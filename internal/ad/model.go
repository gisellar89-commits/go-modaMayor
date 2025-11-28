package ad

import (
	"time"

	"gorm.io/gorm"
)

type Ad struct {
	gorm.Model
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	MediaURL    string    `json:"media_url" gorm:"not null"`
	Type        string    `json:"type" gorm:"not null"` // "anuncio" o "video"
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Active      bool      `json:"active" gorm:"default:true"`
	Featured    bool      `json:"featured" gorm:"default:false"`
}
