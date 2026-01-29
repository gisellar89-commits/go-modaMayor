
package remito

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ListRemitosInternosHistorico lista todos los remitos internos históricos con filtros
func ListRemitosInternosHistorico(c *gin.Context) {
   var remitos []RemitoInterno

   query := config.DB.Preload("Items").Order("created_at DESC")

   // Filtro por ubicación origen
   if origen := c.Query("ubicacion_origen"); origen != "" {
	   query = query.Where("ubicacion_origen = ?", origen)
   }
   // Filtro por ubicación destino
   if destino := c.Query("ubicacion_destino"); destino != "" {
	   query = query.Where("ubicacion_destino = ?", destino)
   }
   // Filtro por estado (ej: recibido, cancelado, etc)
   if estado := c.Query("estado"); estado != "" {
	   query = query.Where("estado = ?", estado)
   }
   // Filtro por fecha de envío (desde/hasta)
   if desde := c.Query("fecha_desde"); desde != "" {
	   query = query.Where("created_at >= ?", desde)
   }
   if hasta := c.Query("fecha_hasta"); hasta != "" {
	   query = query.Where("created_at <= ?", hasta)
   }

	if err := query.Find(&remitos).Error; err != nil {
		log.Printf("❌ Error al listar remitos internos históricos: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar remitos históricos", "detalle": err.Error()})
		return
	}

   // Cargar información de productos y variantes para cada item
   for i := range remitos {
	   for j := range remitos[i].Items {
		   item := &remitos[i].Items[j]
		   // Cargar producto
		   var prod product.Product
		   if err := config.DB.Select("id", "name", "image_url").First(&prod, item.ProductID).Error; err == nil {
			   item.Product = &ProductInfo{
				   ID:       prod.ID,
				   Name:     prod.Name,
				   ImageURL: prod.ImageURL,
			   }
		   }
		   // Cargar variante si existe
		   if item.VariantID != nil {
			   var variant product.ProductVariant
			   if err := config.DB.First(&variant, *item.VariantID).Error; err == nil {
				   item.Variant = &VariantInfo{
					   ID:    variant.ID,
					   SKU:   variant.SKU,
					   Size:  variant.Size,
					   Color: variant.Color,
				   }
			   }
		   }
	   }
   }

   log.Printf("📋 Remitos internos históricos encontrados: %d", len(remitos))
   c.JSON(http.StatusOK, remitos)
}

// GenerarNumeroRemito genera un número único para el remito interno
func GenerarNumeroRemito() (string, error) {
	var count int64
	if err := config.DB.Model(&RemitoInterno{}).Count(&count).Error; err != nil {
		return "", err
	}
	return fmt.Sprintf("RI-%05d", count+1), nil
}

// ListRemitosInternosPendientes lista todos los remitos internos pendientes de recepción
func ListRemitosInternosPendientes(c *gin.Context) {
	var remitos []RemitoInterno
	
	query := config.DB.Preload("Items").
		Where("estado IN ?", []string{"pendiente", "en_transito"}).
		Order("created_at DESC")
	
	// Filtro opcional por ubicación destino
	if destino := c.Query("ubicacion_destino"); destino != "" {
		query = query.Where("ubicacion_destino = ?", destino)
	}
	
	if err := query.Find(&remitos).Error; err != nil {
		log.Printf("❌ Error al listar remitos internos pendientes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar remitos internos"})
		return
	}
	
	// Cargar información de productos y variantes para cada item
	for i := range remitos {
		for j := range remitos[i].Items {
			item := &remitos[i].Items[j]
			
			// Cargar producto
			var prod product.Product
			if err := config.DB.Select("id", "name", "image_url").First(&prod, item.ProductID).Error; err == nil {
				item.Product = &ProductInfo{
					ID:       prod.ID,
					Name:     prod.Name,
					ImageURL: prod.ImageURL,
				}
			}
			
			// Cargar variante si existe
			if item.VariantID != nil {
				var variant product.ProductVariant
				if err := config.DB.First(&variant, *item.VariantID).Error; err == nil {
					item.Variant = &VariantInfo{
						ID:    variant.ID,
						SKU:   variant.SKU,
						Size:  variant.Size,
						Color: variant.Color,
					}
				}
			}
		}
	}
	
	log.Printf("📋 Remitos internos pendientes encontrados: %d", len(remitos))
	c.JSON(http.StatusOK, remitos)
}

// GetRemitoInterno obtiene un remito interno específico con sus items
func GetRemitoInterno(c *gin.Context) {
	id := c.Param("id")
	
	var remito RemitoInterno
	if err := config.DB.Preload("Items").First(&remito, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Remito interno no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar remito interno"})
		return
	}
	
	c.JSON(http.StatusOK, remito)
}

// ConfirmarRecepcionRemito confirma la recepción del remito y ejecuta el movimiento de stock
func ConfirmarRecepcionRemito(c *gin.Context) {
	id := c.Param("id")
	
	var input struct {
		Observaciones string `json:"observaciones"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		// Observaciones es opcional, continuar
	}
	
	// Obtener user_id del contexto
	userIDIfc, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	userID := userIDIfc.(uint)
	
	// Iniciar transacción
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		// Cargar remito con items
		var remito RemitoInterno
		if err := tx.Preload("Items").First(&remito, id).Error; err != nil {
			return err
		}
		
		// Verificar que esté pendiente
		if remito.Estado != "pendiente" && remito.Estado != "en_transito" {
			return fmt.Errorf("el remito ya fue procesado (estado: %s)", remito.Estado)
		}
		
		log.Printf("🔄 Procesando recepción de remito %s: %d items", remito.Numero, len(remito.Items))
		
		   // Procesar cada item: mover stock de origen a destino y registrar movimientos
		   for _, item := range remito.Items {
			   log.Printf("  📦 Procesando item: product_id=%d, variant_id=%v, cantidad=%d", 
				   item.ProductID, item.VariantID, item.Cantidad)

			   // 1. Buscar stock en ubicación origen
			   var stockOrigen product.LocationStock

			   // El stock se maneja por variante, no por producto base
			   if item.VariantID == nil || *item.VariantID == 0 {
				   log.Printf("  ❌ Item sin variant_id: product_id=%d", item.ProductID)
				   return fmt.Errorf("item del remito sin variant_id: product_id=%d", item.ProductID)
			   }

			   log.Printf("  🔍 Buscando stock: variant_id=%d, location=%s", *item.VariantID, remito.UbicacionOrigen)
			   queryOrigen := tx.Where("variant_id = ? AND location = ?", *item.VariantID, remito.UbicacionOrigen)

			   if err := queryOrigen.First(&stockOrigen).Error; err != nil {
				   if err == gorm.ErrRecordNotFound {
					   log.Printf("  ❌ Stock no encontrado en location_stocks: variant_id=%d, location=%s", 
						   *item.VariantID, remito.UbicacionOrigen)
					   return fmt.Errorf("stock no encontrado en %s para producto %d variante %d", 
						   remito.UbicacionOrigen, item.ProductID, *item.VariantID)
				   }
				   log.Printf("  ❌ Error al buscar stock: %v", err)
				   return fmt.Errorf("error al buscar stock: %v", err)
			   }

			   log.Printf("  ✓ Stock encontrado: id=%d, stock=%d, reserved=%d", 
				   stockOrigen.ID, stockOrigen.Stock, stockOrigen.Reserved)

			   // Verificar que haya suficiente stock reservado
			   if stockOrigen.Reserved < item.Cantidad {
				   return fmt.Errorf("stock reservado insuficiente en %s para producto %d (reservado: %d, necesario: %d)", 
					   remito.UbicacionOrigen, item.ProductID, stockOrigen.Reserved, item.Cantidad)
			   }

			   // 2. Descontar de origen (físico y reservado)
			   prevStockOrigen := stockOrigen.Stock
			   stockOrigen.Stock -= item.Cantidad
			   stockOrigen.Reserved -= item.Cantidad
			   if err := tx.Save(&stockOrigen).Error; err != nil {
				   return fmt.Errorf("error al actualizar stock origen: %v", err)
			   }

			   log.Printf("  ✅ Descontado de %s: producto=%d, variante=%d, cantidad=%d, nuevo_stock=%d, nuevo_reservado=%d", 
				   remito.UbicacionOrigen, item.ProductID, *item.VariantID, item.Cantidad, stockOrigen.Stock, stockOrigen.Reserved)

			   // Registrar movimiento de salida (origen)
			   if err := product.RegisterStockMovement(
				   item.ProductID,
				   item.VariantID,
				   remito.UbicacionOrigen,
				   "transferencia",
				   -item.Cantidad,
				   prevStockOrigen,
				   stockOrigen.Stock,
				   "Transferencia por remito interno",
				   remito.Numero,
				   &userID,
				   "",
			   ); err != nil {
				   log.Printf("⚠️ Error al registrar movimiento de stock (origen): %v", err)
			   }

			   // 3. Buscar o crear stock en destino
			   var stockDestino product.LocationStock
			   queryDestino := tx.Where("variant_id = ? AND location = ?", *item.VariantID, remito.UbicacionDestino)

			   err := queryDestino.First(&stockDestino).Error
			   if err == gorm.ErrRecordNotFound {
				   // Crear nuevo registro en destino
				   stockDestino = product.LocationStock{
					   ProductID: item.ProductID,
					   VariantID: item.VariantID,
					   Location:  remito.UbicacionDestino,
					   Stock:     item.Cantidad,
					   Reserved:  item.Cantidad, // Reservar inmediatamente
				   }
				   if err := tx.Create(&stockDestino).Error; err != nil {
					   return fmt.Errorf("error al crear stock destino: %v", err)
				   }
			   } else if err != nil {
				   return fmt.Errorf("error al buscar stock destino: %v", err)
			   } else {
				   // Actualizar stock existente en destino
				   stockDestino.Stock += item.Cantidad
				   stockDestino.Reserved += item.Cantidad // Reservar inmediatamente
				   if err := tx.Save(&stockDestino).Error; err != nil {
					   return fmt.Errorf("error al actualizar stock destino: %v", err)
				   }
			   }

			   log.Printf("  ✅ Sumado a %s: producto=%d, cantidad=%d, nuevo_stock=%d, nuevo_reservado=%d", 
				   remito.UbicacionDestino, item.ProductID, item.Cantidad, stockDestino.Stock, stockDestino.Reserved)

			   // Registrar movimiento de entrada (destino)
			   prevStockDestino := stockDestino.Stock - item.Cantidad
			   if err := product.RegisterStockMovement(
				   item.ProductID,
				   item.VariantID,
				   remito.UbicacionDestino,
				   "transferencia",
				   item.Cantidad,
				   prevStockDestino,
				   stockDestino.Stock,
				   "Transferencia por remito interno",
				   remito.Numero,
				   &userID,
				   "",
			   ); err != nil {
				   log.Printf("⚠️ Error al registrar movimiento de stock (destino): %v", err)
			   }

			   // 4. Actualizar ubicación del cart_item si existe
			   if item.CartItemID != nil {
				   if err := tx.Table("cart_items").Where("id = ?", *item.CartItemID).Update("location", remito.UbicacionDestino).Error; err != nil {
					   log.Printf("⚠️  Advertencia: no se pudo actualizar location del cart_item %d: %v", *item.CartItemID, err)
					   return fmt.Errorf("error al actualizar ubicación del cart_item: %v", err)
				   }
				   log.Printf("  ✓ Cart item %d actualizado a location: %s", *item.CartItemID, remito.UbicacionDestino)
			   }
		   }
		
		// Actualizar estado del remito
		now := time.Now()
		remito.Estado = "recibido"
		remito.FechaRecepcion = &now
		remito.RecibidoPorUserID = &userID
		if input.Observaciones != "" {
			remito.Observaciones = input.Observaciones
		}
		
		if err := tx.Save(&remito).Error; err != nil {
			return fmt.Errorf("error al actualizar remito: %v", err)
		}
		
		log.Printf("✅ Remito %s recibido exitosamente", remito.Numero)
		return nil
	})
	
	if err != nil {
		log.Printf("❌ Error al confirmar recepción: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Remito recibido exitosamente"})
}

// GetRemitosByCart obtiene los remitos internos asociados a un carrito
func GetRemitosByCart(c *gin.Context) {
	cartID := c.Param("cart_id")
	
	var remitos []RemitoInterno
	if err := config.DB.Preload("Items").Where("cart_id = ?", cartID).Order("created_at DESC").Find(&remitos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar remitos"})
		return
	}
	
	c.JSON(http.StatusOK, remitos)
}
