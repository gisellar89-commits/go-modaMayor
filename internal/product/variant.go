package product

import "gorm.io/gorm"

type ProductVariant struct {
	gorm.Model
	ProductID uint   `json:"product_id"`
	Color     string `json:"color"`
	Size      string `json:"size"`
	SKU       string `json:"sku" gorm:"unique;not null"`
	ImageURL  string `json:"image_url"`
	// El stock se maneja por ubicación en LocationStock
}
