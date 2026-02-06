package user

import (
	"go-modaMayor/config"
	"log"
	"time"
)

// StartActivityMonitor inicia un job que periódicamente marca como offline
// a los usuarios que no han tenido actividad en los últimos 5 minutos
func StartActivityMonitor() {
	ticker := time.NewTicker(2 * time.Minute) // Ejecutar cada 2 minutos
	go func() {
		for range ticker.C {
			checkInactiveUsers()
		}
	}()
	log.Println("Activity monitor iniciado: marcará usuarios inactivos como offline")
}

func checkInactiveUsers() {
	// Marcar como offline a usuarios que no tienen actividad en los últimos 5 minutos
	threshold := time.Now().Add(-5 * time.Minute)
	
	result := config.DB.Model(&User{}).
		Where("is_online = ? AND last_activity < ?", true, threshold).
		Update("is_online", false)
	
	if result.Error != nil {
		log.Printf("Error al marcar usuarios inactivos: %v", result.Error)
	} else if result.RowsAffected > 0 {
		log.Printf("Marcados %d usuarios como offline por inactividad", result.RowsAffected)
	}
}
