package order

import (
	"go-modaMayor/config"
	"go-modaMayor/internal/cart"
	"go-modaMayor/internal/notification"
	"go-modaMayor/internal/settings"
	"go-modaMayor/internal/user"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm/clause"
)

// StartPendingOrderAssignment inicia un job que verifica órdenes pendientes
// de asignación y las asigna cuando hay vendedoras disponibles en horario laboral
func StartPendingOrderAssignment() {
	ticker := time.NewTicker(5 * time.Minute) // Ejecutar cada 5 minutos
	go func() {
		for range ticker.C {
			assignPendingOrders()
		}
	}()
	log.Println("Job de asignación de órdenes pendientes iniciado")
}

func assignPendingOrders() {
	now := time.Now()
	
	// Verificar si es horario laboral usando la configuración de la tienda
	isOpen, err := settings.IsStoreOpen(now)
	if err != nil {
		log.Printf("Error verificando horario de la tienda: %v", err)
		return
	}
	if !isOpen {
		// No es horario laboral, no procesar
		return
	}
	
	// Buscar vendedoras online y activas
	var sellers []user.User
	if err := config.DB.Where("role = ? AND active = ? AND is_online = ?", "vendedor", true, true).
		Order("id asc").Find(&sellers).Error; err != nil || len(sellers) == 0 {
		// No hay vendedoras disponibles
		return
	}
	
	// Filtrar vendedoras en su horario individual (si lo tienen configurado)
	// Si no tienen horario individual, se asume que trabajan en el horario de la tienda
	nowMin := now.Hour()*60 + now.Minute()
	var inShift []user.User
	for _, s := range sellers {
		if s.WorkingFrom != "" && s.WorkingTo != "" {
			var fh, fm, th, tm int
			if _, err := strconv.Atoi(s.WorkingFrom); err == nil {
				t, err := time.Parse("15:04", s.WorkingFrom)
				if err == nil {
					fh, fm = t.Hour(), t.Minute()
				}
			}
			if _, err := strconv.Atoi(s.WorkingTo); err == nil {
				t, err := time.Parse("15:04", s.WorkingTo)
				if err == nil {
					th, tm = t.Hour(), t.Minute()
				}
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
		} else {
			// Sin horario individual, asumir disponible en horario de tienda
			inShift = append(inShift, s)
		}
	}
	
	eligible := inShift
	if len(eligible) == 0 {
		// Si nadie está en turno individual, usar todas las online
		eligible = sellers
	}
	
	// Buscar órdenes pendientes de asignación
	var pendingOrders []Order
	if err := config.DB.Where("status = ?", "pendiente_asignacion").
		Order("created_at asc").Limit(10).Find(&pendingOrders).Error; err != nil {
		log.Printf("Error buscando órdenes pendientes: %v", err)
		return
	}
	
	if len(pendingOrders) == 0 {
		return
	}
	
	log.Printf("Procesando %d órdenes pendientes con %d vendedoras disponibles", len(pendingOrders), len(eligible))
	
	// Obtener estado de round-robin
	var state RoundRobinState
	if err := config.DB.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("key = ?", "seller_rr").First(&state).Error; err != nil {
		state = RoundRobinState{Key: "seller_rr", LastAssigned: 0}
		config.DB.Create(&state)
	}
	
	// Asignar cada orden usando round-robin
	for _, orden := range pendingOrders {
		// Seleccionar siguiente vendedora
		var chosen *user.User
		for _, s := range eligible {
			if s.ID > state.LastAssigned {
				chosen = &s
				break
			}
		}
		if chosen == nil {
			chosen = &eligible[0]
		}
		
		// Actualizar orden
		orden.AssignedTo = &chosen.ID
		orden.Status = "asignada"
		if err := config.DB.Save(&orden).Error; err != nil {
			log.Printf("Error asignando orden %d: %v", orden.ID, err)
			continue
		}
		
		// Actualizar carrito asociado
		if orden.CartID != nil {
			var carrito cart.Cart
			if err := config.DB.First(&carrito, *orden.CartID).Error; err == nil {
				carrito.VendedorID = chosen.ID
				carrito.Estado = "esperando_vendedora"
				config.DB.Save(&carrito)
			}
		}
		
		// Actualizar estado round-robin
		state.LastAssigned = chosen.ID
		config.DB.Save(&state)
		
		// Notificar a vendedora y cliente
		notifSeller := notification.Notification{
			UserID:  chosen.ID,
			Message: "Se te asignó la orden #" + strconv.FormatUint(uint64(orden.ID), 10) + ". Revisa y contacta a la clienta.",
		}
		config.DB.Create(&notifSeller)
		
		notifClient := notification.Notification{
			UserID:  orden.UserID,
			Message: "Tu orden #" + strconv.FormatUint(uint64(orden.ID), 10) + " fue asignada a una vendedora y pronto se contactará contigo.",
		}
		config.DB.Create(&notifClient)
		
		log.Printf("Orden #%d asignada a vendedora %s (ID: %d)", orden.ID, chosen.Name, chosen.ID)
	}
}
