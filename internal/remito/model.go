package remito

import (
	"time"

	"gorm.io/gorm"
)

type RemitoInterno struct {
	ID                 uint           `json:"id" gorm:"primaryKey"`
	Numero             string         `json:"numero" gorm:"uniqueIndex;not null"`
	CartID             *uint          `json:"cart_id"`
	OrderID            *uint          `json:"order_id"`
	UbicacionOrigen    string         `json:"ubicacion_origen" gorm:"not null"`
	UbicacionDestino   string         `json:"ubicacion_destino" gorm:"default:deposito"`
	Estado             string         `json:"estado" gorm:"default:pendiente"` // pendiente, en_transito, recibido, cancelado
	FechaEnvio         *time.Time     `json:"fecha_envio"`
	FechaRecepcion     *time.Time     `json:"fecha_recepcion"`
	RecibidoPorUserID  *uint          `json:"recibido_por_user_id"`
	Observaciones      string         `json:"observaciones"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relaciones
	Items              []RemitoInternoItem `json:"items" gorm:"foreignKey:RemitoInternoID"`
}

type RemitoInternoItem struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	RemitoInternoID  uint      `json:"remito_interno_id"`
	CartItemID       *uint     `json:"cart_item_id"`
	ProductID        uint      `json:"product_id"`
	VariantID        *uint     `json:"variant_id"`
	Cantidad         int       `json:"cantidad"`
	CreatedAt        time.Time `json:"created_at"`
	
	// Relaciones para incluir en queries
	Product          *ProductInfo  `json:"product,omitempty" gorm:"-"`
	Variant          *VariantInfo  `json:"variant,omitempty" gorm:"-"`
}

// ProductInfo información básica del producto para el remito
type ProductInfo struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
}

// VariantInfo información de la variante para el remito
type VariantInfo struct {
	ID    uint   `json:"id"`
	SKU   string `json:"sku"`
	Size  string `json:"size,omitempty"`
	Color string `json:"color,omitempty"`
}

// TableName especifica el nombre de la tabla
func (RemitoInterno) TableName() string {
	return "remitos_internos"
}

func (RemitoInternoItem) TableName() string {
	return "remito_interno_items"
}
