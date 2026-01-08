package cart

import (
	"log"
	"time"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"

	"gorm.io/gorm"
)

// ExpireCartReservations finds carts that have expired reservations and releases their stock
func ExpireCartReservations(db *gorm.DB) error {
	now := time.Now()

	// Find carts in 'listo_para_pago' state that have expired
	var expiredCarts []Cart
	if err := db.Where("estado = ? AND expires_at IS NOT NULL AND expires_at <= ?", "listo_para_pago", now).
		Find(&expiredCarts).Error; err != nil {
		log.Printf("❌ Error buscando carritos expirados: %v", err)
		return err
	}

	if len(expiredCarts) == 0 {
		return nil
	}

	log.Printf("🕐 Procesando %d carrito(s) expirado(s)", len(expiredCarts))

	for _, cart := range expiredCarts {
		// Process in a transaction to ensure atomicity
		err := db.Transaction(func(tx *gorm.DB) error {
			// Get all items for this cart
			var items []CartItem
			if err := tx.Where("cart_id = ?", cart.ID).Find(&items).Error; err != nil {
				return err
			}

			// Release reserved stock for each item
			for _, item := range items {
				if item.ReservedQuantity > 0 && item.Location != "" {
					var ls product.LocationStock
					if err := tx.Where("product_id = ? AND variant_id = ? AND location = ?",
						item.ProductID, item.VariantID, item.Location).First(&ls).Error; err != nil {
						log.Printf("⚠️  No se encontró LocationStock para item %d: %v", item.ID, err)
						continue
					}

					// Release reserved stock
					if ls.Reserved >= item.ReservedQuantity {
						ls.Reserved -= item.ReservedQuantity
					} else {
						log.Printf("⚠️  Reserved stock menor que cantidad reservada. Ajustando a 0.")
						ls.Reserved = 0
					}

					if err := tx.Save(&ls).Error; err != nil {
						return err
					}

					// Clear reservation from cart item
					item.ReservedQuantity = 0
					item.Location = ""
					if err := tx.Save(&item).Error; err != nil {
						return err
					}

					log.Printf("✅ Stock liberado para item %d del carrito %d", item.ID, cart.ID)
				}
			}

			// Update cart status to 'expirado'
			cart.Estado = "expirado"
			if err := tx.Save(&cart).Error; err != nil {
				return err
			}

			log.Printf("✅ Carrito %d marcado como expirado", cart.ID)
			return nil
		})

		if err != nil {
			log.Printf("❌ Error procesando carrito expirado %d: %v", cart.ID, err)
			// Continue with next cart instead of failing completely
			continue
		}
	}

	return nil
}

// StartCartExpirationJob launches a background goroutine that checks for expired carts periodically
// interval: how often to check for expired carts (e.g., 15 minutes)
func StartCartExpirationJob(interval time.Duration) {
	go func() {
		log.Printf("🚀 Iniciando job de expiración de carritos (intervalo: %v)", interval)
		
		// Run once on start
		if err := ExpireCartReservations(config.DB); err != nil {
			log.Printf("❌ Error en primera ejecución del job de expiración: %v", err)
		}

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			<-ticker.C
			log.Printf("⏰ Ejecutando verificación de carritos expirados...")
			if err := ExpireCartReservations(config.DB); err != nil {
				log.Printf("❌ Error en job de expiración: %v", err)
			}
		}
	}()
}
