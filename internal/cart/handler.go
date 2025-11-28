package cart

import (
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/notification"
	"go-modaMayor/internal/product"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Obtener user_id desde el contexto (JWT)
func getUserID(c *gin.Context) (uint, bool) {
	uid, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	id, ok := uid.(uint)
	return id, ok
}

// Listar carrito del usuario
func GetCart(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	var cart Cart
	// Buscar carrito activo (pendiente o edicion)
	err := config.DB.Preload("Items.Product").Preload("Items.Variant").
		Where("user_id = ? AND estado IN ?", userID, []string{"pendiente", "edicion"}).
		First(&cart).Error

	if err != nil {
		// Si no existe un carrito activo, crear uno nuevo
		if err == gorm.ErrRecordNotFound {
			cart = Cart{UserID: userID, Estado: "pendiente"}
			if err := config.DB.Create(&cart).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear el carrito"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, cart)
}

// Agregar producto al carrito
type AddToCartInput struct {
	ProductID          uint `json:"product_id" binding:"required,gt=0"`
	VariantID          uint `json:"variant_id" binding:"required,gt=0"`
	Quantity           int  `json:"quantity" binding:"required,gt=0"`
	RequiresStockCheck bool `json:"requires_stock_check,omitempty"`
	// Optional location to reserve from (only used by sellers)
	Location string `json:"location,omitempty"`
}

func AddToCart(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	var input AddToCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cart Cart
	// allow specifying cart_id for seller/admin actions
	cartIDStr := c.Query("cart_id")
	if cartIDStr != "" {
		// try to load by ID
		if err := config.DB.First(&cart, cartIDStr).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
			return
		}
		// permiso: si es vendedor o cliente validar acceso
		roleIfc, _ := c.Get("user_role")
		userIDIfc, _ := c.Get("user_id")
		if roleIfc == "vendedor" {
			if cart.VendedorID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}
		} else if roleIfc == "cliente" || roleIfc == "" {
			if cart.UserID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}
		}
	} else {
		// Buscar carrito por usuario o por vendedor asignado. Si no existe, crear uno para este usuario.
		if err := config.DB.Where("user_id = ? OR vendedor_id = ?", userID, userID).FirstOrCreate(&cart, Cart{UserID: userID, Estado: "pendiente"}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	// Permitir modificar solo si el estado es 'pendiente', 'edicion' o 'esperando_vendedora'
	// Si el carrito existe pero tiene un estado no válido (ej: fue completado), crear uno nuevo
	if cart.Estado != "pendiente" && cart.Estado != "edicion" && cart.Estado != "esperando_vendedora" {
		// Si el carrito está en un estado finalizado (ej: 'completado', 'pagado'), crear uno nuevo
		if cart.Estado == "completado" || cart.Estado == "pagado" || cart.Estado == "listo_para_pago" {
			// Crear un nuevo carrito en estado pendiente
			newCart := Cart{UserID: userID, Estado: "pendiente"}
			if err := config.DB.Create(&newCart).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear un nuevo carrito"})
				return
			}
			cart = newCart
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "No se puede modificar el carrito en este estado"})
			return
		}
	}
	var item CartItem
	if err := config.DB.Where("cart_id = ? AND product_id = ? AND variant_id = ?", cart.ID, input.ProductID, input.VariantID).First(&item).Error; err == nil {
		// update quantity; if client marked requires_stock_check, preserve/upgrade flag
		// If a location reservation exists, attempt to reserve additional quantity in same location
		if input.Location != "" && item.Location != "" && item.Location == input.Location {
			// try to reserve additional amount
			delta := input.Quantity
			var ls product.LocationStock
			if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", input.ProductID, input.VariantID, input.Location).First(&ls).Error; err == nil {
				available := ls.Stock - ls.Reserved
				if available < delta {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Stock insuficiente en la ubicación seleccionada"})
					return
				}
				ls.Reserved += delta
				if err := config.DB.Save(&ls).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reservar stock"})
					return
				}
				item.ReservedQuantity += delta
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ubicación inválida para reservar"})
				return
			}
		}
		item.Quantity += input.Quantity
		if input.RequiresStockCheck {
			item.RequiresStockCheck = true
			item.StockConfirmed = false
		}
		config.DB.Save(&item)
	} else {
		item = CartItem{CartID: cart.ID, ProductID: input.ProductID, VariantID: input.VariantID, Quantity: input.Quantity, RequiresStockCheck: input.RequiresStockCheck, StockConfirmed: false}
		// If a location provided, attempt to reserve
		if input.Location != "" {
			var ls product.LocationStock
			if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", input.ProductID, input.VariantID, input.Location).First(&ls).Error; err == nil {
				available := ls.Stock - ls.Reserved
				if available < input.Quantity {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Stock insuficiente en la ubicación seleccionada"})
					return
				}
				ls.Reserved += input.Quantity
				if err := config.DB.Save(&ls).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reservar stock"})
					return
				}
				item.Location = input.Location
				item.ReservedQuantity = input.Quantity
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ubicación inválida para reservar"})
				return
			}
		}
		config.DB.Create(&item)
	}

	// Cargar el carrito actualizado con relaciones para devolver al cliente
	var updatedCart Cart
	if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").First(&updatedCart, cart.ID).Error; err != nil {
		// si falla la carga del carrito, devolvemos al menos el mensaje de éxito
		c.JSON(http.StatusOK, gin.H{"message": "Producto agregado al carrito"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Producto agregado al carrito", "cart": updatedCart})
}

// Quitar producto del carrito
func RemoveFromCart(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	productID := c.Param("product_id")
	variantID := c.Query("variant_id")

	// NUEVO: Primero buscar el item para obtener el cart_id correcto
	var item CartItem
	itemQuery := config.DB.Where("product_id = ? AND variant_id = ?", productID, variantID)
	if err := itemQuery.First(&item).Error; err != nil {
		log.Printf("❌ RemoveFromCart - Item NO encontrado en la base de datos: product_id=%s, variant_id=%s", productID, variantID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Item no encontrado en el carrito"})
		return
	}

	log.Printf("🗑️ RemoveFromCart - Item encontrado: ID=%d, cart_id=%d, product_id=%s, variant_id=%s", item.ID, item.CartID, productID, variantID)

	// Buscar el carrito activo del usuario actual (no el del item)
	// Esto evita conflictos con items de carritos viejos o de otros usuarios
	var cart Cart
	if err := config.DB.Where("user_id = ? AND estado IN ('pendiente','edicion','esperando_vendedora','listo_para_pago')", userID).Order("id DESC").First(&cart).Error; err != nil {
		log.Printf("❌ RemoveFromCart - Carrito activo NO encontrado para user_id=%d", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}

	log.Printf("🗑️ RemoveFromCart - Carrito activo encontrado: cart_id=%d, user_id=%d, estado=%s", cart.ID, cart.UserID, cart.Estado)

	// Verificar que el item pertenezca al carrito activo del usuario
	if item.CartID != cart.ID {
		log.Printf("❌ RemoveFromCart - Item pertenece a otro carrito: item.cart_id=%d, user_cart_id=%d", item.CartID, cart.ID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Item no encontrado en tu carrito activo"})
		return
	}
	// Permitir modificaciones solo en estados editables
	allowedStates := []string{"pendiente", "edicion", "esperando_vendedora", "listo_para_pago"}
	stateAllowed := false
	for _, s := range allowedStates {
		if cart.Estado == s {
			stateAllowed = true
			break
		}
	}
	if !stateAllowed {
		log.Printf("❌ RemoveFromCart - Estado no permite modificaciones: %s", cart.Estado)
		c.JSON(http.StatusForbidden, gin.H{"error": "No se puede modificar el carrito en este estado: " + cart.Estado})
		return
	}

	// Liberar stock reservado antes de eliminar
	if item.ReservedQuantity > 0 && item.Location != "" {
		log.Printf("🗑️ RemoveFromCart - Liberando stock reservado: %d unidades en location=%s", item.ReservedQuantity, item.Location)
		var ls product.LocationStock
		if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, item.Location).First(&ls).Error; err == nil {
			if ls.Reserved >= item.ReservedQuantity {
				ls.Reserved -= item.ReservedQuantity
			} else {
				ls.Reserved = 0
			}
			config.DB.Save(&ls)
			log.Printf("✅ RemoveFromCart - Stock liberado correctamente")
		}
	}

	// Eliminar el item usando su ID (más directo y seguro)
	if err := config.DB.Delete(&item).Error; err != nil {
		log.Printf("❌ RemoveFromCart - Error al eliminar item ID=%d: %v", item.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("✅ RemoveFromCart - Item ID=%d eliminado exitosamente del carrito %d", item.ID, cart.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado del carrito"})
}

// Vaciar carrito
func ClearCart(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	var cart Cart
	if err := config.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}
	// release any reserved stock for items in this cart before deleting
	var items []CartItem
	if err := config.DB.Where("cart_id = ?", cart.ID).Find(&items).Error; err == nil {
		for _, it := range items {
			if it.ReservedQuantity > 0 && it.Location != "" {
				var ls product.LocationStock
				if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", it.ProductID, it.VariantID, it.Location).First(&ls).Error; err == nil {
					if ls.Reserved >= it.ReservedQuantity {
						ls.Reserved -= it.ReservedQuantity
					} else {
						ls.Reserved = 0
					}
					config.DB.Save(&ls)
				}
			}
		}
	}
	if err := config.DB.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Carrito vaciado"})
}

// Actualizar cantidad de un producto en el carrito
type UpdateCartItemInput struct {
	Quantity           *int  `json:"quantity,omitempty"`
	StockConfirmed     *bool `json:"stock_confirmed,omitempty"`
	RequiresStockCheck *bool `json:"requires_stock_check,omitempty"`
	// Optional: request to reserve stock for this item in given location
	Location string `json:"location,omitempty"`
	Reserve  *bool  `json:"reserve,omitempty"`
}

// Input para transferir el carrito al vendedor
type TransferCartInput struct {
	VendedorID uint `json:"vendedor_id" binding:"required,gt=0"`
}

// Handler para transferir el carrito al vendedor y cambiar el estado a 'edicion'
func TransferCartToSeller(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	var input TransferCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cart Cart
	if err := config.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}
	// Solo se puede transferir si el estado es 'pendiente'
	if cart.Estado != "pendiente" {
		c.JSON(http.StatusForbidden, gin.H{"error": "El carrito ya fue transferido o finalizado"})
		return
	}
	cart.VendedorID = input.VendedorID
	cart.Estado = "edicion"
	if err := config.DB.Save(&cart).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Crear notificación para el vendedor
	notif := notification.Notification{
		UserID:  input.VendedorID,
		Message: "Tienes un nuevo carrito asignado para revisión y edición.",
	}
	config.DB.Create(&notif)
	c.JSON(http.StatusOK, gin.H{"message": "Carrito transferido al vendedor", "cart": cart})
}

func UpdateCartItem(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}
	productID := c.Param("product_id")
	variantID := c.Query("variant_id")
	var input UpdateCartItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cart Cart
	cartIDStr := c.Query("cart_id")
	if cartIDStr != "" {
		if err := config.DB.First(&cart, cartIDStr).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
			return
		}
		// validar permisos
		roleIfc, _ := c.Get("user_role")
		userIDIfc, _ := c.Get("user_id")
		if roleIfc == "vendedor" {
			if cart.VendedorID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}
		} else if roleIfc == "cliente" || roleIfc == "" {
			if cart.UserID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}
		}
	} else {
		// Buscar carrito activo del usuario (con estado editable)
		log.Printf("🔄 UpdateCartItem - Buscando carrito activo para user_id=%d", userID)
		if err := config.DB.Where("user_id = ? AND estado IN ('pendiente','edicion','esperando_vendedora','listo_para_pago')", userID).
			Order("id DESC").First(&cart).Error; err != nil {
			log.Printf("❌ UpdateCartItem - Carrito activo NO encontrado para user_id=%d", userID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
			return
		}
		log.Printf("🔄 UpdateCartItem - Carrito activo encontrado: cart_id=%d, user_id=%d, estado=%s", cart.ID, cart.UserID, cart.Estado)
	}
	// Permitir modificaciones solo en estados editables o cuando está esperando vendedora
	if cart.Estado != "pendiente" && cart.Estado != "edicion" && cart.Estado != "esperando_vendedora" {
		c.JSON(http.StatusForbidden, gin.H{"error": "No se puede modificar el carrito en este estado"})
		return
	}
	var item CartItem
	log.Printf("🔄 UpdateCartItem - Buscando item: cart_id=%d, product_id=%s, variant_id=%s", cart.ID, productID, variantID)
	if err := config.DB.Where("cart_id = ? AND product_id = ? AND variant_id = ?", cart.ID, productID, variantID).First(&item).Error; err != nil {
		log.Printf("❌ UpdateCartItem - Item NO encontrado en carrito activo")
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto/variante no encontrado en el carrito"})
		return
	}
	log.Printf("✅ UpdateCartItem - Item encontrado: item_id=%d, cantidad_actual=%d", item.ID, item.Quantity)
	if input.Quantity != nil {
		// adjust reservations if this item had a location reserved
		newQty := *input.Quantity
		delta := newQty - item.Quantity
		if delta > 0 {
			// need to reserve additional quantity if item.Location is set
			if item.Location != "" {
				var ls product.LocationStock
				if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, item.Location).First(&ls).Error; err == nil {
					available := ls.Stock - ls.Reserved
					if available < delta {
						c.JSON(http.StatusBadRequest, gin.H{"error": "Stock insuficiente en la ubicación reservada para aumentar la cantidad"})
						return
					}
					ls.Reserved += delta
					if err := config.DB.Save(&ls).Error; err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reservar stock adicional"})
						return
					}
					item.ReservedQuantity += delta
				} else {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Ubicación inválida para reservar"})
					return
				}
			}
		} else if delta < 0 {
			// releasing some reserved quantity if present
			release := -delta
			if item.ReservedQuantity > 0 && item.Location != "" {
				var ls product.LocationStock
				if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, item.Location).First(&ls).Error; err == nil {
					if ls.Reserved >= release {
						ls.Reserved -= release
					} else {
						ls.Reserved = 0
					}
					if err := config.DB.Save(&ls).Error; err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo liberar stock reservado"})
						return
					}
					if item.ReservedQuantity >= release {
						item.ReservedQuantity -= release
					} else {
						item.ReservedQuantity = 0
					}
				}
			}
		}
		item.Quantity = newQty
	}

	// stock_confirmed can only be set by vendedor (or admin)
	if input.StockConfirmed != nil {
		roleIfc, _ := c.Get("user_role")
		userIDIfc, _ := c.Get("user_id")
		if roleIfc != "vendedor" && roleIfc != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para confirmar stock"})
			return
		}
		// if vendedor, ensure the cart is assigned to them
		if roleIfc == "vendedor" {
			if cart.VendedorID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}
		}
		// detect previous value to emit notifications when it changes
		prevConfirmed := item.StockConfirmed
		item.StockConfirmed = *input.StockConfirmed
		if *input.StockConfirmed {
			// when confirmed, keep RequiresStockCheck true (origin), but it's now confirmed
		}
		// if the confirmation state changed, create a notification for the cart owner
		if prevConfirmed != item.StockConfirmed {
			// try to load product name for a friendlier message
			var prod product.Product
			if err := config.DB.First(&prod, item.ProductID).Error; err == nil {
				if item.StockConfirmed {
					notif := notification.Notification{
						UserID:  cart.UserID,
						Message: "La vendedora confirmó stock para: " + prod.Name,
					}
					config.DB.Create(&notif)
				} else {
					notif := notification.Notification{
						UserID:  cart.UserID,
						Message: "La vendedora marcó como no disponible: " + prod.Name,
					}
					config.DB.Create(&notif)
				}
			}
		}
	}

	if input.RequiresStockCheck != nil {
		// allow client to toggle this only if they own the cart; sellers/admins can also set
		roleIfc, _ := c.Get("user_role")
		userIDIfc, _ := c.Get("user_id")
		if roleIfc == "cliente" || roleIfc == "" {
			if cart.UserID != userIDIfc.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
				return
			}

			// If caller requested a reservation for this item
			if input.Reserve != nil && *input.Reserve {
				// location must be provided
				if input.Location == "" {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere 'location' para reservar"})
					return
				}
				// desired quantity: use updated item.Quantity (may have been modified above)
				desired := item.Quantity
				// If item already has a reservation in another location, release it first
				if item.ReservedQuantity > 0 && item.Location != "" && item.Location != input.Location {
					var prevLs product.LocationStock
					if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, item.Location).First(&prevLs).Error; err == nil {
						if prevLs.Reserved >= item.ReservedQuantity {
							prevLs.Reserved -= item.ReservedQuantity
						} else {
							prevLs.Reserved = 0
						}
						config.DB.Save(&prevLs)
					}
					item.ReservedQuantity = 0
					item.Location = ""
				}
				// attempt to reserve desired qty in input.Location
				var ls product.LocationStock
				if err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, input.Location).First(&ls).Error; err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Ubicación inválida para reservar"})
					return
				}
				available := ls.Stock - ls.Reserved
				if available < desired {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Stock insuficiente en la ubicación seleccionada"})
					return
				}
				ls.Reserved += desired
				if err := config.DB.Save(&ls).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reservar stock"})
					return
				}
				item.Location = input.Location
				item.ReservedQuantity = desired
			}
		}
		item.RequiresStockCheck = *input.RequiresStockCheck
		if !*input.RequiresStockCheck {
			item.StockConfirmed = false
		}
	}

	if err := config.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cantidad actualizada en el carrito"})
}

// Listar carritos asignados al vendedor autenticado
func GetCartsForSeller(c *gin.Context) {
	roleIfc, _ := c.Get("user_role")
	if roleIfc != "vendedor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}
	userIDIfc, _ := c.Get("user_id")
	userID := userIDIfc.(uint)

	var carts []Cart
	if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").Where("vendedor_id = ?", userID).Find(&carts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, carts)
}

// Obtener un carrito por ID (vendedor sólo si le pertenece, admin puede cualquiera)
func GetCartByID(c *gin.Context) {
	id := c.Param("id")
	var cartObj Cart
	if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").First(&cartObj, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}
	// permiso: si es vendedor debe ser el vendedor asignado; si es cliente debe ser owner; admins permitidos via middleware
	roleIfc, _ := c.Get("user_role")
	userIDIfc, _ := c.Get("user_id")
	if roleIfc == "vendedor" {
		if cartObj.VendedorID != userIDIfc.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
			return
		}
	} else if roleIfc == "cliente" || roleIfc == "" {
		if cartObj.UserID != userIDIfc.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a este carrito"})
			return
		}
	}
	c.JSON(http.StatusOK, cartObj)
}

// Actualizar estado del carrito (ej: 'listo_para_pago', 'edicion', 'cancelado')
func UpdateCartStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Estado string `json:"estado" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cartObj Cart
	if err := config.DB.First(&cartObj, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}
	// permiso: vendedor puede cambiar sólo si es asignado; cliente solo si owner; admin lo permite (middleware)
	roleIfc, _ := c.Get("user_role")
	userIDIfc, _ := c.Get("user_id")
	if roleIfc == "vendedor" {
		if cartObj.VendedorID != userIDIfc.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para este carrito"})
			return
		}
	} else if roleIfc == "cliente" || roleIfc == "" {
		if cartObj.UserID != userIDIfc.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para este carrito"})
			return
		}
	}
	// If transitioning to 'listo_para_pago' we must finalize reserved stock and decrement real stock atomically
	target := input.Estado
	if target == "listo_para_pago" {
		// use transaction to ensure atomicity
		errTx := config.DB.Transaction(func(tx *gorm.DB) error {
			// reload items with lock (for update) to avoid races
			var items []CartItem
			if err := tx.Where("cart_id = ?", cartObj.ID).Find(&items).Error; err != nil {
				return err
			}
			// iterate items and commit stock changes
			for _, it := range items {
				if it.ReservedQuantity > 0 && it.Location != "" {
					var ls product.LocationStock
					if err := tx.Where("product_id = ? AND variant_id = ? AND location = ?", it.ProductID, it.VariantID, it.Location).First(&ls).Error; err != nil {
						return err
					}
					// verify we have reserved >= needed and stock >= reserved
					if ls.Reserved < it.ReservedQuantity {
						return fmt.Errorf("reservas insuficientes en la ubicación %s para el producto %d", it.Location, it.ProductID)
					}
					if ls.Stock < it.ReservedQuantity {
						return fmt.Errorf("stock físico insuficiente en la ubicación %s para el producto %d", it.Location, it.ProductID)
					}
					ls.Stock -= it.ReservedQuantity
					ls.Reserved -= it.ReservedQuantity
					if err := tx.Save(&ls).Error; err != nil {
						return err
					}
					// clear reserved quantity on the cart item
					if err := tx.Model(&CartItem{}).Where("id = ?", it.ID).Updates(map[string]interface{}{"reserved_quantity": 0}).Error; err != nil {
						return err
					}
				} else {
					// no reservation: try to find any location with available stock
					var ls product.LocationStock
					if err := tx.Where("product_id = ? AND variant_id = ? AND (stock - reserved) >= ?", it.ProductID, it.VariantID, it.Quantity).First(&ls).Error; err != nil {
						return fmt.Errorf("sin stock disponible para product %d variant %d", it.ProductID, it.VariantID)
					}
					ls.Stock -= it.Quantity
					if err := tx.Save(&ls).Error; err != nil {
						return err
					}
				}
			}
			// finally update cart status
			cartObj.Estado = target
			if err := tx.Save(&cartObj).Error; err != nil {
				return err
			}
			return nil
		})
		if errTx != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": errTx.Error()})
			return
		}
		// return updated cart
		if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").First(&cartObj, cartObj.ID).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "Estado actualizado", "cart": cartObj})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Estado actualizado", "cart": cartObj})
		return
	}

	// For other state transitions, just update
	cartObj.Estado = target
	if err := config.DB.Save(&cartObj).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cartObj)
}

// Endpoint debug para que una vendedora vea info adicional sobre su estado
func GetCartsForSellerDebug(c *gin.Context) {
	roleIfc, _ := c.Get("user_role")
	if roleIfc != "vendedor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}
	userIDIfc, _ := c.Get("user_id")
	userID := userIDIfc.(uint)

	var byVendor []Cart
	if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").Where("vendedor_id = ?", userID).Find(&byVendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var waiting []Cart
	if err := config.DB.Preload("Items").Preload("Items.Product").Preload("Items.Variant").Where("estado = ? AND (vendedor_id IS NULL OR vendedor_id = 0)", "esperando_vendedora").Find(&waiting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Orders assigned to this seller
	var orders []map[string]interface{}
	if err := config.DB.Table("orders").Select("id, user_id, assigned_to, status, total, created_at").Where("assigned_to = ?", userID).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"by_vendor": byVendor, "waiting": waiting, "orders_assigned": orders})
}

// GET /cart/summary
// Calcula el resumen del carrito con precios aplicados según los price tiers
// Responde con el tier aplicable, subtotal, cantidad total, y desglose por item
func GetCartSummary(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}

	var cart Cart
	// IMPORTANTE: Buscar solo carritos activos (pendiente, edicion, esperando_vendedora, listo_para_pago)
	// Esto coincide con la lógica de AddToCart para evitar inconsistencias
	if err := config.DB.Preload("Items.Product").Preload("Items.Variant").
		Where("user_id = ? AND estado IN ('pendiente','edicion','esperando_vendedora','listo_para_pago')", userID).
		Order("id DESC").First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("🔔 GetCartSummary - No active cart found for user_id=%d", userID)
			c.JSON(http.StatusOK, gin.H{
				"total_quantity": 0,
				"subtotal":       0,
				"items":          []interface{}{},
				"tier":           nil,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("🔔 GetCartSummary - Found cart: cart_id=%d, user_id=%d, items_count=%d, estado=%s", cart.ID, cart.UserID, len(cart.Items), cart.Estado)

	// Obtener price tiers activos
	var tiers []struct {
		ID           uint    `json:"id"`
		Name         string  `json:"name"`
		DisplayName  string  `json:"display_name"`
		FormulaType  string  `json:"formula_type"`
		Multiplier   float64 `json:"multiplier"`
		Percentage   float64 `json:"percentage"`
		FlatAmount   float64 `json:"flat_amount"`
		MinQuantity  int     `json:"min_quantity"`
		OrderIndex   int     `json:"order_index"`
		Active       bool    `json:"active"`
		IsDefault    bool    `json:"is_default"`
		ShowInPublic bool    `json:"show_in_public"`
		ColorCode    string  `json:"color_code"`
	}

	if err := config.DB.Table("price_tiers").Where("active = ? AND deleted_at IS NULL", true).Order("order_index ASC").Find(&tiers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar price tiers"})
		return
	}

	// Calcular cantidad total
	totalQuantity := 0
	for _, item := range cart.Items {
		log.Printf("🔔 GetCartSummary - Item: cart_item_id=%d, product_id=%d, variant_id=%d, quantity=%d", item.ID, item.ProductID, item.VariantID, item.Quantity)
		totalQuantity += item.Quantity
	}
	log.Printf("🔔 GetCartSummary - Total quantity calculated: %d", totalQuantity)

	// Encontrar el tier aplicable
	var applicableTier *struct {
		ID           uint    `json:"id"`
		Name         string  `json:"name"`
		DisplayName  string  `json:"display_name"`
		FormulaType  string  `json:"formula_type"`
		Multiplier   float64 `json:"multiplier"`
		Percentage   float64 `json:"percentage"`
		FlatAmount   float64 `json:"flat_amount"`
		MinQuantity  int     `json:"min_quantity"`
		OrderIndex   int     `json:"order_index"`
		Active       bool    `json:"active"`
		IsDefault    bool    `json:"is_default"`
		ShowInPublic bool    `json:"show_in_public"`
		ColorCode    string  `json:"color_code"`
	}

	for i := range tiers {
		tier := &tiers[i]
		if totalQuantity >= tier.MinQuantity {
			if applicableTier == nil || tier.OrderIndex < applicableTier.OrderIndex {
				applicableTier = tier
			}
		}
	}

	// Si no hay tier aplicable, usar el default
	if applicableTier == nil {
		for i := range tiers {
			if tiers[i].IsDefault {
				applicableTier = &tiers[i]
				break
			}
		}
	}

	// Calcular precio para cada item usando el tier aplicable
	type ItemSummary struct {
		CartItemID  uint    `json:"cart_item_id"`
		ProductID   uint    `json:"product_id"`
		ProductName string  `json:"product_name"`
		VariantID   uint    `json:"variant_id"`
		VariantName string  `json:"variant_name"`
		Quantity    int     `json:"quantity"`
		CostPrice   float64 `json:"cost_price"`
		UnitPrice   float64 `json:"unit_price"`
		Subtotal    float64 `json:"subtotal"`
		ImageURL    string  `json:"image_url"`
	}

	items := make([]ItemSummary, 0)
	subtotal := 0.0

	for _, item := range cart.Items {
		var unitPrice float64
		costPrice := item.Product.CostPrice

		if applicableTier != nil {
			// Calcular precio según la fórmula del tier
			switch applicableTier.FormulaType {
			case "multiplier":
				unitPrice = costPrice * applicableTier.Multiplier
			case "percentage_markup":
				unitPrice = costPrice + (costPrice * applicableTier.Percentage / 100.0)
			case "flat_amount":
				unitPrice = costPrice + applicableTier.FlatAmount
			default:
				unitPrice = costPrice
			}
		} else {
			// Fallback al precio mayorista si existe
			unitPrice = item.Product.WholesalePrice
			if unitPrice == 0 {
				unitPrice = costPrice * 2.0
			}
		}

		itemSubtotal := unitPrice * float64(item.Quantity)
		subtotal += itemSubtotal

		variantName := ""
		if item.Variant.Color != "" || item.Variant.Size != "" {
			variantName = item.Variant.Color + " / " + item.Variant.Size
		}

		imageURL := item.Product.ImageURL
		if item.Variant.ImageURL != "" {
			imageURL = item.Variant.ImageURL
		}

		items = append(items, ItemSummary{
			CartItemID:  item.ID,
			ProductID:   item.ProductID,
			ProductName: item.Product.Name,
			VariantID:   item.VariantID,
			VariantName: variantName,
			Quantity:    item.Quantity,
			CostPrice:   costPrice,
			UnitPrice:   unitPrice,
			Subtotal:    itemSubtotal,
			ImageURL:    imageURL,
		})
	}

	// Calcular tier siguiente (si existe)
	var nextTier *struct {
		DisplayName      string `json:"display_name"`
		MinQuantity      int    `json:"min_quantity"`
		QuantityToUnlock int    `json:"quantity_to_unlock"`
	}

	for i := range tiers {
		tier := &tiers[i]
		if tier.MinQuantity > totalQuantity {
			if nextTier == nil || tier.MinQuantity < nextTier.MinQuantity {
				nextTier = &struct {
					DisplayName      string `json:"display_name"`
					MinQuantity      int    `json:"min_quantity"`
					QuantityToUnlock int    `json:"quantity_to_unlock"`
				}{
					DisplayName:      tier.DisplayName,
					MinQuantity:      tier.MinQuantity,
					QuantityToUnlock: tier.MinQuantity - totalQuantity,
				}
			}
		}
	}

	response := gin.H{
		"cart_id":        cart.ID,
		"total_quantity": totalQuantity,
		"subtotal":       subtotal,
		"items":          items,
		"tier":           applicableTier,
		"next_tier":      nextTier,
		"all_tiers":      tiers,
	}

	c.JSON(http.StatusOK, response)
}

// GET /cart/check-stock
// Verifica la disponibilidad de stock para todos los items del carrito
// Retorna items con problemas de stock (sin stock, stock insuficiente, stock limitado)
func CheckCartStock(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autorizado"})
		return
	}

	var cart Cart
	if err := config.DB.Preload("Items.Product").Preload("Items.Variant").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{
				"items_with_issues": []interface{}{},
				"all_available":     true,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type StockIssue struct {
		CartItemID      uint   `json:"cart_item_id"`
		ProductID       uint   `json:"product_id"`
		ProductName     string `json:"product_name"`
		VariantID       uint   `json:"variant_id"`
		VariantName     string `json:"variant_name"`
		RequestedQty    int    `json:"requested_qty"`
		AvailableStock  int    `json:"available_stock"`
		IssueType       string `json:"issue_type"` // "out_of_stock", "insufficient_stock", "limited_stock"
		SuggestedAction string `json:"suggested_action"`
		ImageURL        string `json:"image_url"`
	}

	itemsWithIssues := make([]StockIssue, 0)
	allAvailable := true

	for _, item := range cart.Items {
		// Obtener stock total disponible para esta variante
		var totalStock int
		err := config.DB.Table("location_stocks").
			Select("COALESCE(SUM(quantity), 0)").
			Where("variant_id = ? AND deleted_at IS NULL", item.VariantID).
			Scan(&totalStock).Error

		if err != nil {
			continue
		}

		variantName := ""
		if item.Variant.Color != "" || item.Variant.Size != "" {
			variantName = item.Variant.Color + " / " + item.Variant.Size
		}

		imageURL := item.Product.ImageURL
		if item.Variant.ImageURL != "" {
			imageURL = item.Variant.ImageURL
		}

		issue := StockIssue{
			CartItemID:     item.ID,
			ProductID:      item.ProductID,
			ProductName:    item.Product.Name,
			VariantID:      item.VariantID,
			VariantName:    variantName,
			RequestedQty:   item.Quantity,
			AvailableStock: totalStock,
			ImageURL:       imageURL,
		}

		// Determinar tipo de problema
		if totalStock == 0 {
			// Sin stock
			issue.IssueType = "out_of_stock"
			issue.SuggestedAction = "Eliminar del carrito o buscar producto alternativo"
			itemsWithIssues = append(itemsWithIssues, issue)
			allAvailable = false
		} else if totalStock < item.Quantity {
			// Stock insuficiente
			issue.IssueType = "insufficient_stock"
			issue.SuggestedAction = fmt.Sprintf("Reducir cantidad a %d unidades disponibles", totalStock)
			itemsWithIssues = append(itemsWithIssues, issue)
			allAvailable = false
		} else if totalStock < item.Quantity+3 {
			// Stock limitado (advertencia preventiva)
			issue.IssueType = "limited_stock"
			issue.SuggestedAction = fmt.Sprintf("Stock limitado: solo quedan %d unidades", totalStock)
			itemsWithIssues = append(itemsWithIssues, issue)
			// No marcar como no disponible, solo es una advertencia
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"items_with_issues": itemsWithIssues,
		"all_available":     allAvailable,
		"total_items":       len(cart.Items),
		"issues_count":      len(itemsWithIssues),
	})
}
