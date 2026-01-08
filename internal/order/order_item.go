package order

import (
	"go-modaMayor/internal/product"

	"gorm.io/gorm"
)

type OrderItem struct {
	gorm.Model
	OrderID   uint            `json:"order_id"`
	ProductID uint            `json:"product_id"`
	Product   product.Product `json:"product" gorm:"foreignKey:ProductID"`
	Quantity  int             `json:"quantity"`
	Price     float64         `json:"price"` // Precio unitario al momento de la compra
}
