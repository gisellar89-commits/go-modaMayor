package user

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name           string    `json:"name" gorm:"not null"`
	Email          string    `json:"email" gorm:"unique;not null"`
	Phone          string    `json:"phone" gorm:"size:20;not null"` // Teléfono/celular de contacto (obligatorio para comunicación)
	Password       string    `json:"password" gorm:"not null"`
	Role           string    `json:"role" gorm:"not null;default:'cliente'"`
	ResetToken     string    `json:"-"`
	ResetExpiresAt time.Time `json:"-"`
	// Active indica si la cuenta de usuario está activa (útil para vendedores)
	Active bool `json:"active" gorm:"default:true"`
	// Horario de trabajo (formato HH:MM, por ejemplo "09:00")
	WorkingFrom string `json:"working_from" gorm:"size:5"`
	WorkingTo   string `json:"working_to" gorm:"size:5"`
}
