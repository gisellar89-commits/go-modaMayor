package location

import "gorm.io/gorm"

// Location representa una ubicación física para gestión de stock
type Location struct {
	gorm.Model
	Code         string `json:"code" gorm:"type:varchar(50);uniqueIndex;not null"`
	Name         string `json:"name" gorm:"type:varchar(100);not null"`
	Description  string `json:"description" gorm:"type:text"`
	Active       bool   `json:"active" gorm:"default:true"`
	DisplayOrder int    `json:"display_order" gorm:"default:0;index"`
}

func (Location) TableName() string {
	return "locations"
}
