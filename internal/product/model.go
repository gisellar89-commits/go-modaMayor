package product

import (
	"fmt"
	"go-modaMayor/internal/category"

	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	Code          string               `json:"code" gorm:"unique"` // código único del producto
	Name          string               `json:"name" gorm:"not null"`
	Description   string               `json:"description"`
	CategoryID    uint                 `json:"category_id"`
	Category      category.Category    `json:"category" gorm:"foreignKey:CategoryID"`
	SubcategoryID uint                 `json:"subcategory_id"`
	Subcategory   category.Subcategory `json:"subcategory" gorm:"foreignKey:SubcategoryID"`
	ImageURL      string               `json:"image_url"`
	// Nuevo: proveedor configurable por admin
	SupplierID     *uint   `json:"supplier_id" gorm:"index"`
	Season         string  `json:"season" gorm:"type:varchar(20)"` // e.g. SS, AW (deprecated, usar SeasonID)
	SeasonID       *uint   `json:"season_id" gorm:"index"`         // FK a tabla seasons
	Year           *int    `json:"year"`
	SizeTypeID     *uint   `json:"size_type_id" gorm:"index"`
	TotalStock     *int    `json:"total_stock"`  // optional total stock at product level
	ImageModel     string  `json:"image_model"`  // foto con modelo
	ImageHanger    string  `json:"image_hanger"` // foto en perchero
	CostPrice      float64 `json:"cost_price"`
	WholesalePrice float64 `json:"wholesale_price"`
	Discount1Price float64 `json:"discount1_price"`
	Discount2Price float64 `json:"discount2_price"`
	// Descuentos administrables
	DiscountType  string  `json:"discount_type" gorm:"type:varchar(20);default:'none'"`
	DiscountValue float64 `json:"discount_value"`
	// Tags para secciones del home
	IsNewArrival   bool             `json:"is_new_arrival" gorm:"default:false"`
	IsFeatured     bool             `json:"is_featured" gorm:"default:false"`
	IsOffer        bool             `json:"is_offer" gorm:"default:false"`
	IsTrending     bool             `json:"is_trending" gorm:"default:false"`
	LocationStocks []LocationStock  `json:"location_stocks" gorm:"foreignKey:ProductID"`
	Variants       []ProductVariant `json:"variants" gorm:"foreignKey:ProductID"`
	VariantType    string           `json:"variant_type" gorm:"type:varchar(20);not null;default:'sin_variantes'"`
}

// BeforeCreate hook para generar código único automáticamente si no se proporciona
func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.Code == "" {
		// Buscar el código más alto usado (incluyendo productos eliminados)
		var lastProduct Product
		tx.Unscoped().Order("code DESC").Limit(1).Find(&lastProduct)

		nextNum := 1
		if lastProduct.Code != "" {
			// Extraer el número del código (formato: PROD-000001)
			var num int
			if _, err := fmt.Sscanf(lastProduct.Code, "PROD-%d", &num); err == nil {
				nextNum = num + 1
			}
		}
		p.Code = fmt.Sprintf("PROD-%06d", nextNum)
	}
	return nil
}

type LocationStock struct {
	gorm.Model
	ProductID uint   `json:"product_id"`
	VariantID *uint  `json:"variant_id"` // nullable: nil -> stock at product level
	Location  string `json:"location"`   // "deposito", "mendoza", "salta"
	Stock     int    `json:"stock"`
	// cantidad reservada por carritos/vendedoras hasta que la venta se confirme
	Reserved int `json:"reserved" gorm:"default:0"`
}

// Suppliers and sizing
type Supplier struct {
	gorm.Model
	Name    string `json:"name" gorm:"not null;unique"`
	Code    string `json:"code" gorm:"unique"`
	Contact string `json:"contact"`
	Active  bool   `json:"active" gorm:"default:true"`
}

// Season representa una temporada configurable (ej: Primavera/Verano 2025)
type Season struct {
	gorm.Model
	Code   string `json:"code" gorm:"not null;unique"` // ej: SS25, AW25
	Name   string `json:"name" gorm:"not null"`        // ej: "Primavera/Verano 2025"
	Year   int    `json:"year" gorm:"not null"`
	Active bool   `json:"active" gorm:"default:true"`
}

type SizeType struct {
	gorm.Model
	Key         string      `json:"key" gorm:"not null;unique"` // e.g. unico,numerico,letras,jeans,especiales
	Name        string      `json:"name"`
	Description string      `json:"description"`
	IsSingleton bool        `json:"is_singleton" gorm:"default:false"`
	Values      []SizeValue `json:"values" gorm:"foreignKey:SizeTypeID"`
}

type SizeValue struct {
	gorm.Model
	SizeTypeID uint   `json:"size_type_id"`
	Value      string `json:"value"`
	Ordinal    int    `json:"ordinal"`
}

// Color entity: prefijados pero editables por admin
type Color struct {
	gorm.Model
	Key    string `json:"key" gorm:"unique;not null"` // e.g. 'negro', 'blanco'
	Name   string `json:"name"`
	Hex    string `json:"hex"` // opcional: color hex code
	Active bool   `json:"active" gorm:"default:true"`
}

// StockMovement registra cambios en el inventario
type StockMovement struct {
	gorm.Model
	ProductID     uint   `json:"product_id" gorm:"index;not null"`
	VariantID     *uint  `json:"variant_id" gorm:"index"` // nullable
	Location      string `json:"location" gorm:"index;not null"`
	MovementType  string `json:"movement_type" gorm:"not null"` // "adjustment", "sale", "return", "transfer", "initial"
	Quantity      int    `json:"quantity"`                      // puede ser positivo o negativo
	PreviousStock int    `json:"previous_stock"`
	NewStock      int    `json:"new_stock"`
	Reason        string `json:"reason"`    // descripción del movimiento
	Reference     string `json:"reference"` // referencia a orden, transferencia, etc.
	UserID        *uint  `json:"user_id"`   // quién realizó el movimiento
	UserName      string `json:"user_name"` // nombre del usuario (denormalizado para histórico)
	Notes         string `json:"notes"`     // notas adicionales
}
