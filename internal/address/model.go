package address

import "gorm.io/gorm"

type Address struct {
	gorm.Model
	UserID         uint   `json:"user_id" gorm:"not null"`
	Label          string `json:"label" gorm:"size:50"`                    // Ej: "Casa", "Trabajo", "Casa de mamá"
	RecipientName  string `json:"recipient_name" gorm:"size:100;not null"` // Nombre del destinatario
	RecipientPhone string `json:"recipient_phone" gorm:"size:20;not null"` // Teléfono del destinatario
	Street         string `json:"street" gorm:"size:255;not null"`
	Floor          string `json:"floor" gorm:"size:50"` // Piso/Depto
	City           string `json:"city" gorm:"size:100;not null"`
	State          string `json:"state" gorm:"size:100;not null"` // Provincia
	PostalCode     string `json:"postal_code" gorm:"size:20;not null"`
	Country        string `json:"country" gorm:"size:100;default:'Argentina'"`
	Reference      string `json:"reference" gorm:"size:500"` // Referencias adicionales (ej: "Entre calle X y Y")
	IsDefault      bool   `json:"is_default" gorm:"default:false"`
}
