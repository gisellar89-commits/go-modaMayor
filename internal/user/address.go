package user

import (
	"gorm.io/gorm"
)

// Address representa una dirección de envío de un usuario
type Address struct {
	gorm.Model
	UserID uint   `json:"user_id" gorm:"not null;index"`
	Label  string `json:"label" gorm:"size:50"` // ej: "Casa", "Trabajo", "Oficina"

	// Información del destinatario
	RecipientName  string `json:"recipient_name" gorm:"size:100;not null"`
	RecipientPhone string `json:"recipient_phone" gorm:"size:20;not null"`

	// Dirección completa
	Street     string `json:"street" gorm:"size:255;not null"`             // Calle y número
	Floor      string `json:"floor" gorm:"size:50"`                        // Piso/Dpto (opcional)
	City       string `json:"city" gorm:"size:100;not null"`               // Ciudad
	State      string `json:"state" gorm:"size:100;not null"`              // Provincia/Estado
	PostalCode string `json:"postal_code" gorm:"size:20;not null"`         // Código postal
	Country    string `json:"country" gorm:"size:100;default:'Argentina'"` // País

	// Referencias adicionales
	Reference string `json:"reference" gorm:"size:500"` // Ej: "Portón azul", "Entre X e Y"

	// Dirección por defecto
	IsDefault bool `json:"is_default" gorm:"default:false"`
}
