package order

import (
	"go-modaMayor/internal/product"

	"gorm.io/gorm"
)

type OrderItem struct {
	gorm.Model
	OrderID      uint            `json:"order_id"`
	ProductID    uint            `json:"product_id"`
	Product      product.Product `json:"product" gorm:"foreignKey:ProductID"`
	VariantID    *uint           `json:"variant_id,omitempty"`
	VariantSize  string          `json:"variant_size"`
	VariantColor string          `json:"variant_color"`
	Quantity     int             `json:"quantity"`
	Price        float64         `json:"price"`     // Precio unitario al momento de la compra (con tier aplicado)
	BaseCost     float64         `json:"base_cost"` // Costo base del producto cuando se creó el item (sin tier)
}
