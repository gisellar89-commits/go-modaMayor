package order

import (
	"time"

	"gorm.io/gorm"
)

// BestsellerSnapshot stores a snapshot of top sold products at a given time
type BestsellerSnapshot struct {
	gorm.Model
	ProductID    uint        `json:"product_id" gorm:"index"`
	QuantitySold int64       `json:"quantity_sold"`
	TotalRevenue float64     `json:"total_revenue"`
	Rank         int         `json:"rank"`
	SnapshotAt   time.Time   `json:"snapshot_at" gorm:"index"`
	Product      interface{} `json:"product" gorm:"-"`
}
