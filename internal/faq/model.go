package faq

import "gorm.io/gorm"

type FAQ struct {
	gorm.Model
	Question string `json:"question" gorm:"not null;size:500"` // Pregunta
	Answer   string `json:"answer" gorm:"not null;type:text"`  // Respuesta
	Order    int    `json:"order" gorm:"default:0"`            // Orden de visualización
	Active   bool   `json:"active" gorm:"default:true"`        // Si está activa para mostrar
	Category string `json:"category" gorm:"size:100"`          // Categoría opcional (ej: "Envíos", "Pagos", "Productos")
}
