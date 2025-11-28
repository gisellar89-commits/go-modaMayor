package category

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	Name          string        `json:"name" gorm:"unique;not null"`
	Description   string        `json:"description"`
	Subcategories []Subcategory `json:"subcategories" gorm:"foreignKey:CategoryID"`
}

type Subcategory struct {
	gorm.Model
	Name       string `json:"name" gorm:"not null"`
	CategoryID uint   `json:"category_id"`
}
