package kit

import (
	"gorm.io/gorm"
)

// Kit represents a bundle/combo of existing products
type Kit struct {
	gorm.Model
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	// Price for the whole kit (optional). If zero, price will be computed from items.
	Price float64 `json:"price"`
	// Items in the kit
	Items []KitItem `json:"items" gorm:"foreignKey:KitID"`
	// Sum of individual items (computed, not persisted)
	SumIndividuals float64 `json:"sum_individuals" gorm:"-"`
}

// KitItem links a product (optionally a specific variant) to the kit
type KitItem struct {
	gorm.Model
	KitID     uint    `json:"kit_id"`
	ProductID uint    `json:"product_id"` // product included in kit
	VariantID *uint   `json:"variant_id"` // optional: specific variant
	Quantity  int     `json:"quantity" gorm:"default:1"`
	UnitPrice float64 `json:"unit_price"` // optional override
}
