package cart

import (
	"go-modaMayor/internal/product"
	"go-modaMayor/internal/user"
	"time"

	"gorm.io/gorm"
)

type Cart struct {
	gorm.Model
	UserID     uint             `json:"user_id"`
	User       user.User        `json:"user" gorm:"foreignKey:UserID"`
	VendedorID uint             `json:"vendedor_id"`
	Estado     string           `json:"estado" gorm:"default:'pendiente'"`
	Items      []CartItem       `json:"items" gorm:"foreignKey:CartID"`
	// Expiration tracking for reserved stock
	ReservedAt *time.Time `json:"reserved_at,omitempty"` // When cart moved to 'listo_para_pago'
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`  // When reservation expires (24h after ReservedAt)
}

type CartItem struct {
	gorm.Model
	CartID    uint                   `json:"cart_id"`
	ProductID uint                   `json:"product_id"`
	VariantID uint                   `json:"variant_id"`
	Product   product.Product        `json:"product" gorm:"foreignKey:ProductID"`
	Variant   product.ProductVariant `json:"variant" gorm:"foreignKey:VariantID"`
	Quantity  int                    `json:"quantity"`
	// flags for stock verification flow
	RequiresStockCheck bool `json:"requires_stock_check" gorm:"default:false"`
	StockConfirmed     bool `json:"stock_confirmed" gorm:"default:false"`
	// Optional location from which the seller reserved stock (ej: 'deposito', 'sucursal A')
	Location string `json:"location"`
	// cantidad reservada en la ubicación indicada. Cuando se confirme la venta
	// (estado 'listo_para_pago') esta cantidad se aplicará al stock real.
	ReservedQuantity int `json:"reserved_quantity" gorm:"default:0"`
}
