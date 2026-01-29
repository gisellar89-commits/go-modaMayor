package settings

import (
	"log"
	"gorm.io/gorm"
)

type PricingConfig struct {
	gorm.Model
	WholesalePercent float64 `json:"wholesale_percent"`
	Discount1Percent float64 `json:"discount1_percent"`
	Discount2Percent float64 `json:"discount2_percent"`
	MinQtyWholesale  int     `json:"min_qty_wholesale"`
	MinQtyDiscount1  int     `json:"min_qty_discount1"`
	MinQtyDiscount2  int     `json:"min_qty_discount2"`
}

// PriceTier representa un nivel de precio configurable
// Permite definir múltiples niveles con diferentes fórmulas y reglas de aplicación
type PriceTier struct {
	gorm.Model
	Name         string  `json:"name" gorm:"not null"`                          // ej: "Mayorista", "Descuento 1", "Final"
	DisplayName  string  `json:"display_name" gorm:"not null"`                  // nombre visible para el cliente
	FormulaType  string  `json:"formula_type" gorm:"type:varchar(20);not null"` // "multiplier", "percentage_markup", "flat_amount"
	Multiplier   float64 `json:"multiplier" gorm:"default:1.0"`                 // para multiplier: precio = costo * multiplier
	Percentage   float64 `json:"percentage" gorm:"default:0.0"`                 // para percentage_markup: precio = costo + (costo * percentage/100)
	FlatAmount   float64 `json:"flat_amount" gorm:"default:0.0"`                // para flat_amount: precio = costo + flat_amount
	MinQuantity  int     `json:"min_quantity" gorm:"default:0"`                 // cantidad mínima para aplicar este tier
	OrderIndex   int     `json:"order_index" gorm:"not null"`                   // orden de aplicación (menor = mayor prioridad si se cumplen condiciones)
	Active       bool    `json:"active" gorm:"default:true"`                    // si está activo
	Description  string  `json:"description" gorm:"type:text"`                  // descripción para el admin
	IsDefault    bool    `json:"is_default" gorm:"default:false"`               // si es el precio por defecto cuando no se cumple ninguna condición
	ShowInPublic bool    `json:"show_in_public" gorm:"default:true"`            // si se muestra en listados públicos
	ColorCode    string  `json:"color_code" gorm:"type:varchar(7)"`             // código de color hex para la UI
}

// CalculatePrice calcula el precio según el tipo de fórmula
func (pt *PriceTier) CalculatePrice(costPrice float64) float64 {
	log.Printf("[DEBUG PriceTier.CalculatePrice] INPUT: costPrice=%.2f, FormulaType=%s, Multiplier=%.2f, Percentage=%.2f, FlatAmount=%.2f", 
		costPrice, pt.FormulaType, pt.Multiplier, pt.Percentage, pt.FlatAmount)
	
	var result float64
	switch pt.FormulaType {
	case "multiplier":
		result = costPrice * pt.Multiplier
	case "percentage_markup":
		result = costPrice + (costPrice * pt.Percentage / 100.0)
	case "flat_amount":
		result = costPrice + pt.FlatAmount
	default:
		result = costPrice
	}
	
	log.Printf("[DEBUG PriceTier.CalculatePrice] OUTPUT: result=%.2f", result)
	return result
}

// Topbar settings editable by admin/encargado
type Topbar struct {
	gorm.Model
	CenterText string `json:"center_text" gorm:"type:text"`
	// SocialLinks stored as JSON array: [{"platform":"instagram","url":"https://..."}, ...]
	SocialLinks string `json:"social_links" gorm:"type:json"`
}

// Banner represents a homepage banner slide
type Banner struct {
	gorm.Model
	ImageURL string `json:"image_url" gorm:"type:text"`
	AltText  string `json:"alt_text" gorm:"type:varchar(255)"`
	Link     string `json:"link" gorm:"type:text"`
	Order    int    `json:"order"`
	Active   bool   `json:"active"`
}

// Video represents a video block to show on the home page
type Video struct {
	gorm.Model
	Title        string `json:"title" gorm:"type:varchar(255)"`
	Description  string `json:"description" gorm:"type:text"`
	VideoURL     string `json:"video_url" gorm:"type:text"`
	ExternalURL  string `json:"external_url" gorm:"type:text"`
	ThumbnailURL string `json:"thumbnail_url" gorm:"type:text"`
	Order        int    `json:"order"`
	Active       bool   `json:"active"`
}

// HomeSectionEntry represents a curated product entry for a home section (e.g. new_arrivals, season, featured)
type HomeSectionEntry struct {
	gorm.Model
	Section   string      `json:"section" gorm:"type:varchar(100);index:idx_section_order"`
	ProductID uint        `json:"product_id"`
	Product   interface{} `json:"product" gorm:"-"`
	Order     int         `json:"order" gorm:"index:idx_section_order"`
	Active    bool        `json:"active"`
}

// HomeSectionConfig representa la configuración de una sección del home
type HomeSectionConfig struct {
	gorm.Model
	SectionKey    string `json:"section_key" gorm:"type:varchar(100);uniqueIndex"`
	Title         string `json:"title" gorm:"type:varchar(255)"`
	Enabled       bool   `json:"enabled" gorm:"default:true"`
	DisplayOrder  int    `json:"display_order" gorm:"default:0;index"`
	LimitProducts int    `json:"limit_products" gorm:"default:12"`
	ShowMode      string `json:"show_mode" gorm:"type:varchar(20);default:'both'"` // 'manual', 'auto', 'both'
}

// ContactSettings representa las configuraciones de contacto del sitio
type ContactSettings struct {
	gorm.Model
	WhatsAppNumber  string `json:"whatsapp_number" gorm:"type:varchar(20)"` // Número de WhatsApp (formato: 5491123456789)
	WhatsAppMessage string `json:"whatsapp_message" gorm:"type:text"`       // Mensaje predeterminado
	Email           string `json:"email" gorm:"type:varchar(255)"`          // Email de contacto
	Phone           string `json:"phone" gorm:"type:varchar(20)"`           // Teléfono de contacto
	Address         string `json:"address" gorm:"type:text"`                // Dirección física
	FacebookURL     string `json:"facebook_url" gorm:"type:text"`           // URL de Facebook
	InstagramURL    string `json:"instagram_url" gorm:"type:text"`          // URL de Instagram
	TwitterURL      string `json:"twitter_url" gorm:"type:text"`            // URL de Twitter/X
}
