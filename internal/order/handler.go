package order

import (
	"errors"
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/audit"
	"go-modaMayor/internal/cart"
	"go-modaMayor/internal/notification"
	"go-modaMayor/internal/product"
	"go-modaMayor/internal/settings"
	"go-modaMayor/internal/user"
	"log"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/gin-gonic/gin"
)

// Crear pedido con productos
func CreateOrder(c *gin.Context) {
	var input struct {
		UserID uint   `json:"user_id"`
		Status string `json:"status"`
		Items  []struct {
			ProductID uint `json:"product_id"`
			Quantity  int  `json:"quantity"`
			// accept either `price` or `unit_price` from clients and map to OrderItem.Price
			Price     float64 `json:"price"`
			UnitPrice float64 `json:"unit_price"`
		} `json:"items"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var orderItems []OrderItem
	total := 0.0
	for _, item := range input.Items {
		var prod product.Product
		if err := config.DB.First(&prod, item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Producto no encontrado"})
			return
		}
		// determine unit price: priority -> item.Price, item.UnitPrice, product.WholesalePrice
		unitPrice := prod.WholesalePrice
		if item.Price > 0 {
			unitPrice = item.Price
		} else if item.UnitPrice > 0 {
			unitPrice = item.UnitPrice
		}
		orderItems = append(orderItems, OrderItem{
			ProductID: prod.ID,
			Quantity:  item.Quantity,
			Price:     unitPrice,
		})
		total += unitPrice * float64(item.Quantity)
	}

	order := Order{
		UserID: input.UserID,
		Status: input.Status,
		Total:  total,
		Items:  orderItems,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, order)
}

// Listar pedidos de un usuario
func ListOrdersByUser(c *gin.Context) {
	userID := c.Param("user_id")
	var orders []Order
	if err := config.DB.Preload("Items").Preload("Items.Product").Where("user_id = ?", userID).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// Listar todos los pedidos (solo admin)
func ListAllOrders(c *gin.Context) {
	var orders []Order
	if err := config.DB.Preload("User").Preload("AssignedToUser").Preload("Items").Preload("Items.Product").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// Actualizar estado de un pedido (solo admin)
func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var order Order
	if err := config.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Guardar estado anterior para logging
	oldStatus := order.Status
	order.Status = input.Status
	
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Si la orden tiene un carrito asociado, actualizar también el estado del carrito
	// para mantener sincronizados los estados
	if order.CartID != nil && *order.CartID > 0 {
		var carrito cart.Cart
		if err := config.DB.First(&carrito, *order.CartID).Error; err != nil {
			log.Printf("⚠️ Error cargando carrito #%d: %v", *order.CartID, err)
		} else {
			// Mapear el estado de la orden al estado del carrito
			cartEstado := mapOrderStatusToCartStatus(order.Status)
			
			// Solo actualizar si es diferente
			if carrito.Estado != cartEstado {
				log.Printf("🔄 Actualizando estado del carrito #%d de '%s' a '%s' (orden #%d: %s -> %s)", 
					carrito.ID, carrito.Estado, cartEstado, order.ID, oldStatus, order.Status)
				
				// Si el nuevo estado es "pagado", usar la lógica completa del carrito para descontar stock
				if cartEstado == "pagado" && oldStatus != "pagado" {
					// Llamar al endpoint de actualización de estado del carrito
					// que tiene toda la lógica de descuento de stock
					carrito.Estado = cartEstado
					if err := config.DB.Save(&carrito).Error; err != nil {
						log.Printf("❌ Error actualizando estado del carrito: %v", err)
					}
				} else {
					// Para otros cambios de estado, simplemente actualizar
					carrito.Estado = cartEstado
					if err := config.DB.Save(&carrito).Error; err != nil {
						log.Printf("❌ Error actualizando estado del carrito: %v", err)
					}
				}
			}
		}
	}
	
	// Registrar log de auditoría
	userID, _ := c.Get("user_id")
	config.DB.Create(&audit.AuditLog{
		UserID:   userID.(uint),
		Action:   "update_status",
		Entity:   "order",
		EntityID: order.ID,
		Details:  fmt.Sprintf("Estado cambiado de '%s' a '%s'", oldStatus, order.Status),
	})
	c.JSON(http.StatusOK, order)
}

// Mapea estados de orden a estados de carrito
func mapOrderStatusToCartStatus(orderStatus string) string {
	switch orderStatus {
	case "pendiente_asignacion":
		return "esperando_vendedora"
	case "pendiente":
		return "esperando_vendedora"
	case "pagado":
		return "pagado"
	case "enviado":
		return "enviado"
	case "completado":
		return "completado"
	case "cancelado":
		return "cancelado"
	default:
		return orderStatus
	}
}

// Handler para que el vendedor finalice la compra de un carrito asignado
func CheckoutCart(c *gin.Context) {
	// Obtener el vendedor autenticado
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}
	userID := userIDIfc.(uint)

	// Obtener el cartID de la ruta
	cartIDStr := c.Param("cartID")
	cartID, err := strconv.Atoi(cartIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de carrito inválido"})
		return
	}

	// Buscar el carrito y validar asignación al vendedor
	var carrito cart.Cart
	if err := config.DB.Preload("Items").First(&carrito, cartID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}

	// Validar que el vendedor esté asignado al carrito
	// Suponiendo que el carrito tiene un campo VendedorID
	if carrito.VendedorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para este carrito"})
		return
	}

	// Validar stock y procesar orden
	var cfg settings.PricingConfig
	if err := config.DB.First(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se encontró configuración de precios"})
		return
	}
	var orderItems []OrderItem
	total := 0.0
	// Consider ONLY items that are either not requires_stock_check or already stock_confirmed
	var confirmedItems []cart.CartItem
	for _, item := range carrito.Items {
		if item.RequiresStockCheck && !item.StockConfirmed {
			continue
		}
		confirmedItems = append(confirmedItems, item)
	}
	if len(confirmedItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No hay items confirmados en el carrito para procesar"})
		return
	}
	// Calcular cantidad total de prendas en los items confirmados
	totalQty := 0
	for _, item := range confirmedItems {
		totalQty += item.Quantity
	}
	       var itemsWithStock []cart.CartItem
	       var itemsOutOfStock []cart.CartItem
			       for _, item := range confirmedItems {
				       // Re-verificar stock en depósito principal (ubicación por defecto: 'deposito')
				       var stock product.LocationStock
				       err := config.DB.Where("product_id = ? AND variant_id = ? AND location = ?", item.ProductID, item.VariantID, "deposito").First(&stock).Error
				       if err != nil || stock.Stock < item.Quantity {
					       // Marcar el item como pendiente por falta de stock durante el proceso
					       config.DB.Model(&cart.CartItem{}).Where("id = ?", item.ID).Updates(map[string]interface{}{
						       "RequiresStockCheck": true,
						       "StockConfirmed": false,
						       "PendingReason": "out_of_stock_during_process",
						       "Location": "", // Limpiar ubicación para forzar selección
					       })
					       itemsOutOfStock = append(itemsOutOfStock, item)
					       continue
				       }
				       // Descontar stock
				       stock.Stock -= item.Quantity
				       config.DB.Save(&stock)

				       // Obtener precio del producto base
				       var prod product.Product
				       if err := config.DB.First(&prod, item.ProductID).Error; err != nil {
					       c.JSON(http.StatusBadRequest, gin.H{"error": "Producto no encontrado"})
					       return
				       }
				       // Determinar el precio según la cantidad total usando price tiers
				       var tiers []settings.PriceTier
				       config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers)
				       precio := settings.CalculatePriceForQuantityFromList(prod.CostPrice, totalQty, tiers)

				       // Si no hay tiers o el precio es igual al costo, usar fallback
				       if len(tiers) == 0 || precio == prod.CostPrice {
					       switch {
					       case totalQty >= cfg.MinQtyDiscount2:
						       precio = prod.CostPrice + (prod.CostPrice * cfg.Discount2Percent)
					       case totalQty >= cfg.MinQtyDiscount1:
						       precio = prod.CostPrice + (prod.CostPrice * cfg.Discount1Percent)
					       case totalQty >= cfg.MinQtyWholesale:
						       precio = prod.CostPrice + (prod.CostPrice * cfg.WholesalePercent)
					       default:
						       precio = prod.CostPrice
					       }
				       }
				       orderItems = append(orderItems, OrderItem{
					       ProductID: prod.ID,
					       Quantity:  item.Quantity,
					       Price:     precio,
				       })
				       total += precio * float64(item.Quantity)
				       itemsWithStock = append(itemsWithStock, item)
			       }
	       if len(itemsWithStock) == 0 {
		       c.JSON(http.StatusBadRequest, gin.H{"error": "No hay stock suficiente para procesar ningún producto. Los productos sin stock han sido marcados como pendientes."})
		       return
	       }

	// Buscar la orden existente creada cuando se solicitó vendedora
	var orden Order
	if err := config.DB.Where("cart_id = ?", carrito.ID).First(&orden).Error; err != nil {
		// Si no existe, crear una nueva (caso legacy)
		cartIDPtr := &carrito.ID
		orden = Order{
			UserID:     carrito.UserID,
			CartID:     cartIDPtr,
			AssignedTo: carrito.VendedorID,
			Status:     "finalizada",
			Total:      total,
		}
		if err := config.DB.Create(&orden).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// Actualizar la orden existente con los items y total
		orden.Status = "finalizada"
		orden.Total = total
		if err := config.DB.Save(&orden).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar la orden"})
			return
		}
	}

	// Guardar los items de la orden (reemplazar items anteriores si existían)
	config.DB.Where("order_id = ?", orden.ID).Delete(&OrderItem{})
	for i := range orderItems {
		orderItems[i].OrderID = orden.ID
	}
	if err := config.DB.Create(&orderItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron crear los items de la orden"})
		return
	}

	// Vaciar el carrito y cambiar estado a 'finalizado'
	if err := config.DB.Where("cart_id = ?", carrito.ID).Delete(&cart.CartItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo vaciar el carrito"})
		return
	}
	carrito.Estado = "finalizado"
	if err := config.DB.Save(&carrito).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar el estado del carrito"})
		return
	}
	// Crear notificación para el cliente
	notif := notification.Notification{
		UserID:  carrito.UserID,
		Message: "¡Tu compra ha sido finalizada y la orden está lista!",
	}
	config.DB.Create(&notif)
	c.JSON(http.StatusOK, gin.H{"orden": orden})
}

// Cliente solicita que su carrito sea asignado a una vendedora para concretar la compra.
// Crea una orden con estado 'pendiente_asignacion' pero NO descuenta stock aún.
func SubmitCartForAssignment(c *gin.Context) {
	// Usuario autenticado (cliente)
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}
	userID := userIDIfc.(uint)

	// cartID
	cartIDStr := c.Param("cartID")
	cartID, err := strconv.Atoi(cartIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de carrito inválido"})
		return
	}

	var carrito cart.Cart
	if err := config.DB.Preload("Items").First(&carrito, cartID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrito no encontrado"})
		return
	}
	if carrito.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes solicitar asignación para este carrito"})
		return
	}

	// Calcular totales (reutiliza la lógica de CheckoutCart para precios)
	var cfg settings.PricingConfig
	if err := config.DB.First(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se encontró configuración de precios"})
		return
	}

	// Consider ONLY items that are either not requires_stock_check or already stock_confirmed
	var confirmedItems2 []cart.CartItem
	for _, item := range carrito.Items {
		if item.RequiresStockCheck && !item.StockConfirmed {
			continue
		}
		confirmedItems2 = append(confirmedItems2, item)
	}
	if len(confirmedItems2) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No hay items confirmados en el carrito para crear la orden"})
		return
	}
	var orderItems []OrderItem
	total := 0.0
	totalQty := 0
	for _, item := range confirmedItems2 {
		totalQty += item.Quantity
	}
	for _, item := range confirmedItems2 {
		var prod product.Product
		if err := config.DB.First(&prod, item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Producto no encontrado"})
			return
		}
		// Determinar el precio según la cantidad total usando price tiers
		var tiers []settings.PriceTier
		config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers)
		precio := settings.CalculatePriceForQuantityFromList(prod.CostPrice, totalQty, tiers)

		// Si no hay tiers o el precio es igual al costo, usar fallback
		if len(tiers) == 0 || precio == prod.CostPrice {
			switch {
			case totalQty >= cfg.MinQtyDiscount2:
				precio = prod.CostPrice + (prod.CostPrice * cfg.Discount2Percent)
			case totalQty >= cfg.MinQtyDiscount1:
				precio = prod.CostPrice + (prod.CostPrice * cfg.Discount1Percent)
			case totalQty >= cfg.MinQtyWholesale:
				precio = prod.CostPrice + (prod.CostPrice * cfg.WholesalePercent)
			default:
				precio = prod.CostPrice
			}
		}
		orderItems = append(orderItems, OrderItem{
			ProductID: prod.ID,
			Quantity:  item.Quantity,
			Price:     precio,
		})
		total += precio * float64(item.Quantity)
	}

	// Crear la orden en DB (pendiente por defecto)
	orden := Order{
		UserID: userID,
		Status: "pendiente_asignacion",
		Total:  total,
		Items:  orderItems,
		CartID: &carrito.ID,
	}

	// Primero intentamos asignar automáticamente por round-robin a una vendedora activa
	var sellers []user.User
	if err := config.DB.Where("role = ? AND active = ?", "vendedor", true).Order("id asc").Find(&sellers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar vendedoras"})
		return
	}

	//si no hay vendedoras activas, dejamos la orden pendiente y notificamos a admins
	if len(sellers) == 0 {
		// Asegurarse de que la orden tenga el cart_id asociado
		orden.CartID = &carrito.ID
		if err := config.DB.Create(&orden).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		carrito.Estado = "esperando_vendedora"
		config.DB.Save(&carrito)
		// notificar a admins
		var admins []user.User
		config.DB.Where("role = ?", "admin").Find(&admins)
		for _, a := range admins {
			notif := notification.Notification{UserID: a.ID, Message: "Nueva orden pendiente sin vendedoras activas: orden #" + strconv.FormatUint(uint64(orden.ID), 10)}
			config.DB.Create(&notif)
		}
		c.JSON(http.StatusCreated, gin.H{"orden": orden, "message": "No hay vendedoras activas. La orden quedó pendiente y el equipo será notificado."})
		return
	}

	// Determinar si hay vendedoras en su working_hours ahora
	now := time.Now()
	nowMin := now.Hour()*60 + now.Minute()
	var inShift []user.User
	for _, s := range sellers {
		if s.WorkingFrom == "" || s.WorkingTo == "" {
			continue
		}
		// parse HH:MM
		var fh, fm, th, tm int
		if _, err := fmt.Sscanf(s.WorkingFrom, "%d:%d", &fh, &fm); err != nil {
			continue
		}
		if _, err := fmt.Sscanf(s.WorkingTo, "%d:%d", &th, &tm); err != nil {
			continue
		}
		fromMin := fh*60 + fm
		toMin := th*60 + tm
		if fromMin <= toMin {
			if nowMin >= fromMin && nowMin <= toMin {
				inShift = append(inShift, s)
			}
		} else { // overnight shift
			if nowMin >= fromMin || nowMin <= toMin {
				inShift = append(inShift, s)
			}
		}
	}

	eligible := sellers
	if len(inShift) > 0 {
		eligible = inShift
	}

	// Round-robin: usamos RoundRobinState con key 'seller_rr'
	var assignedSeller user.User
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	var state RoundRobinState
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("key = ?", "seller_rr").First(&state).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			state = RoundRobinState{Key: "seller_rr", LastAssigned: 0}
			if err := tx.Create(&state).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo inicializar estado de round-robin"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener estado de round-robin"})
			return
		}
	}

	// seleccionar el siguiente vendedor en eligible por ID > LastAssigned, si no existe, tomar el primero
	var chosen *user.User
	for _, s := range eligible {
		if s.ID > state.LastAssigned {
			chosen = &s
			break
		}
	}
	if chosen == nil {
		// tomar el primero eligible
		chosen = &eligible[0]
	}

	// actualizar estado y crear orden asignada
	state.LastAssigned = chosen.ID
	if err := tx.Save(&state).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar estado de round-robin"})
		return
	}

	orden.AssignedTo = chosen.ID
	orden.Status = "asignada"
	// Asegurarse de que la orden tenga el cart_id asociado
	orden.CartID = &carrito.ID
	if err := tx.Create(&orden).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Marcar carrito
	// asignar también el carrito a la vendedora elegida para que la ruta /cart/seller lo encuentre
	carrito.VendedorID = chosen.ID
	carrito.Estado = "esperando_vendedora"
	if err := tx.Save(&carrito).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar carrito"})
		return
	}

	// Crear un nuevo carrito vacío para el cliente para que pueda seguir comprando
	newCart := cart.Cart{
		UserID: carrito.UserID,
		Estado: "pendiente",
	}
	if err := tx.Create(&newCart).Error; err != nil {
		// No es crítico si falla, continuar
	}

	// Notificar al vendedor elegido y al cliente
	notifSeller := notification.Notification{UserID: chosen.ID, Message: "Se te asignó la orden #" + strconv.FormatUint(uint64(orden.ID), 10) + ". Revisa y contacta a la clienta."}
	if err := tx.Create(&notifSeller).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear notificación"})
		return
	}
	notifClient := notification.Notification{UserID: orden.UserID, Message: "Tu orden #" + strconv.FormatUint(uint64(orden.ID), 10) + " fue asignada a una vendedora y pronto se contactará contigo."}
	if err := tx.Create(&notifClient).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear notificación cliente"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar asignación"})
		return
	}

	assignedSeller = *chosen
	c.JSON(http.StatusCreated, gin.H{"orden": orden, "assigned_to": assignedSeller, "message": "Se asignó automáticamente una vendedora."})
}

// Vendedor se asigna a sí mismo a una orden pendiente
func AssignOrderSelf(c *gin.Context) {
	roleIfc, _ := c.Get("user_role")
	if roleIfc != "vendedor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo vendedores pueden asignarse órdenes"})
		return
	}
	userIDIfc, _ := c.Get("user_id")
	userID := userIDIfc.(uint)

	id := c.Param("id")
	var orden Order
	if err := config.DB.Preload("Items").First(&orden, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}
	if orden.AssignedTo != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Orden ya asignada"})
		return
	}
	if orden.Status != "pendiente_asignacion" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Orden no está en estado pendiente"})
		return
	}
	orden.AssignedTo = userID
	orden.Status = "asignada"
	if err := config.DB.Save(&orden).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Notificar al cliente
	notif := notification.Notification{
		UserID:  orden.UserID,
		Message: "Tu orden #" + strconv.FormatUint(uint64(orden.ID), 10) + " fue asignada a una vendedora y pronto se contactará contigo para coordinar pago/entrega.",
	}
	config.DB.Create(&notif)

	// Notificar al vendedor
	notif2 := notification.Notification{
		UserID:  userID,
		Message: "Te asignaste a la orden #" + strconv.FormatUint(uint64(orden.ID), 10) + ". Contacta a la clienta para finalizar la compra.",
	}
	config.DB.Create(&notif2)

	c.JSON(http.StatusOK, orden)

	// Si existe un carrito relacionado en estado 'esperando_vendedora', asignarlo también
	var relatedCart cart.Cart
	if err := config.DB.Where("user_id = ? AND estado = ?", orden.UserID, "esperando_vendedora").First(&relatedCart).Error; err == nil {
		relatedCart.VendedorID = userID
		config.DB.Save(&relatedCart)
	}
}

// Listar órdenes asignadas al vendedor autenticado
func ListOrdersForSeller(c *gin.Context) {
	roleIfc, _ := c.Get("user_role")
	if roleIfc != "vendedor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}
	userIDIfc, _ := c.Get("user_id")
	userID := userIDIfc.(uint)

	var orders []Order
	if err := config.DB.Preload("User").Preload("Items").Preload("Items.Product").Where("assigned_to = ?", userID).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// Reporte: ranking de ventas por vendedor en el mes actual
func SalesRankingCurrentMonth(c *gin.Context) {
	// Solo vendedores, encargados y admin pueden ver el ranking
	role, _ := c.Get("user_role")
	if role != "admin" && role != "encargado" && role != "vendedor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado"})
		return
	}
	// Obtener primer y último día del mes actual
	now := time.Now()
	firstDay := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	lastDay := firstDay.AddDate(0, 1, -1)
	// Consulta: agrupar por vendedor y contar pedidos
	type Ranking struct {
		UserID uint
		Name   string
		Email  string
		Role   string
		Ventas int
	}
	var results []Ranking
	// Join con tabla de usuarios para obtener nombre/email/rol
	// Filtrar solo vendedores usando assigned_to en lugar de user_id
	// user_id es el cliente que hizo la orden, assigned_to es la vendedora asignada
	       config.DB.Table("orders").
		       Select("orders.assigned_to as user_id, users.name, users.email, users.role, COUNT(orders.id) as ventas").
		       Joins("JOIN users ON users.id = orders.assigned_to").
		       Where("orders.created_at >= ? AND orders.created_at <= ?", firstDay, lastDay).
		       Where("orders.assigned_to IS NOT NULL").                     // Solo órdenes con vendedora asignada
		       Where("users.role IN ?", []string{"vendedor", "vendedora"}). // Solo vendedores/as
		       Where("orders.status IN ?", []string{"pagado", "completado", "enviado"}). // Solo estados válidos
		       Group("orders.assigned_to, users.name, users.email, users.role").
		       Order("ventas DESC").
		       Scan(&results)
	c.JSON(http.StatusOK, results)
}

// Admin asigna una orden a una vendedora manualmente
func AssignOrderAdmin(c *gin.Context) {
	roleIfc, _ := c.Get("user_role")
	if roleIfc != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo admin puede asignar órdenes manualmente"})
		return
	}

	id := c.Param("id")
	var input struct {
		AssignedTo uint `json:"assigned_to"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var orden Order
	if err := config.DB.Preload("Items").First(&orden, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}

	// Verificar que el usuario destino exista y sea vendedor
	var seller user.User
	if err := config.DB.First(&seller, input.AssignedTo).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vendedora no encontrada"})
		return
	}
	if seller.Role != "vendedor" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El usuario no es una vendedora"})
		return
	}

	// Asignar y actualizar estado
	orden.AssignedTo = input.AssignedTo
	orden.Status = "asignada"
	if err := config.DB.Save(&orden).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Notificar al cliente y a la vendedora
	notifSeller := notification.Notification{UserID: seller.ID, Message: "Se te asignó la orden #" + strconv.FormatUint(uint64(orden.ID), 10) + ". Revisa y contacta a la clienta."}
	config.DB.Create(&notifSeller)
	notifClient := notification.Notification{UserID: orden.UserID, Message: "Tu orden #" + strconv.FormatUint(uint64(orden.ID), 10) + " fue asignada a una vendedora y pronto se contactará contigo."}
	config.DB.Create(&notifClient)

	// Registrar auditoría
	userIDIfc, _ := c.Get("user_id")
	if userIDIfc != nil {
		config.DB.Create(&audit.AuditLog{UserID: userIDIfc.(uint), Action: "assign_order_admin", Entity: "order", EntityID: orden.ID, Details: fmt.Sprintf("Asignada a %d", input.AssignedTo)})
	}

	c.JSON(http.StatusOK, orden)

	// Si existe un carrito relacionado en estado 'esperando_vendedora', asignarlo también al mismo ID
	var relatedCart cart.Cart
	if err := config.DB.Where("user_id = ? AND estado = ?", orden.UserID, "esperando_vendedora").First(&relatedCart).Error; err == nil {
		relatedCart.VendedorID = input.AssignedTo
		config.DB.Save(&relatedCart)
	}
}
