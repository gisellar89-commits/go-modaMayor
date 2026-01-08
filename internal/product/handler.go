package product

import (
	"database/sql"
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/category"
	"go-modaMayor/internal/settings"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler exportado para consultar variantes de un producto
func GetProductVariants(c *gin.Context) {
	productID := c.Param("id")
	var variants []ProductVariant
	if err := config.DB.Where("product_id = ?", productID).Find(&variants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, variants)
}

// Input para crear/actualizar stock de variante en ubicación
type VariantStockInput struct {
	Location string `json:"location" binding:"required"`
	Stock    int    `json:"stock" binding:"required,gte=0"`
}

// Handler para crear/actualizar stock de variante en ubicación
func SetVariantStock(c *gin.Context) {
	variantID := c.Param("id")
	var variant ProductVariant
	if err := config.DB.First(&variant, variantID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Variante no encontrada"})
		return
	}
	var input VariantStockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Ejecutar en transacción para validar total_stock y evitar race conditions
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var prod Product
		if err := tx.First(&prod, variant.ProductID).Error; err != nil {
			return err
		}

		// Buscar existente (si existe) para poder calcular el delta
		var existing LocationStock
		q := tx.Where("variant_id = ? AND location = ?", variant.ID, input.Location).First(&existing)
		if q.Error != nil && q.Error != gorm.ErrRecordNotFound {
			return q.Error
		}

		// Si existe, asegurarse de no bajar stock por debajo del reservado
		if q.Error == nil {
			if input.Stock < existing.Reserved {
				return fmt.Errorf("no se puede fijar stock %d menor que reservado %d para variante %d en %s", input.Stock, existing.Reserved, variant.ID, input.Location)
			}
		}

		// Calcular sumas actuales
		type sums struct {
			SumStock sql.NullInt64 `gorm:"column:sum_stock"`
			SumRes   sql.NullInt64 `gorm:"column:sum_reserved"`
		}
		var s sums
		if err := tx.Raw("SELECT COALESCE(SUM(stock),0) as sum_stock, COALESCE(SUM(reserved),0) as sum_reserved FROM location_stocks WHERE product_id = ?", prod.ID).Scan(&s).Error; err != nil {
			return err
		}

		currentCombined := int64(0)
		currentCombined += s.SumStock.Int64
		currentCombined += s.SumRes.Int64

		// compute existing stock value if present
		existingStock := int64(0)
		if q.Error == nil {
			existingStock = int64(existing.Stock)
		}

		// proposed combined after applying this update
		proposedCombined := currentCombined - existingStock + int64(input.Stock)

		if prod.TotalStock != nil {
			if proposedCombined > int64(*prod.TotalStock) {
				return fmt.Errorf("la suma total de stock (%d) excede el total permitido por producto (%d)", proposedCombined, *prod.TotalStock)
			}
		}

		if q.Error == nil {
			existing.Stock = input.Stock
			if err := tx.Save(&existing).Error; err != nil {
				return err
			}
			// devolver el valor actualizado
			c.JSON(http.StatusOK, existing)
			return nil
		}

		nuevoStock := LocationStock{
			ProductID: prod.ID,
			VariantID: &variant.ID,
			Location:  input.Location,
			Stock:     input.Stock,
		}
		if err := tx.Create(&nuevoStock).Error; err != nil {
			return err
		}
		c.JSON(http.StatusOK, nuevoStock)
		return nil
	})
	if err != nil {
		// decidir si es error de validación o interno
		if strings.Contains(err.Error(), "excede el total") || strings.Contains(err.Error(), "no se puede fijar stock") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

// Handler para consultar stock de una variante por ubicación
func GetVariantStock(c *gin.Context) {
	variantID := c.Param("id")
	var stocks []LocationStock
	if err := config.DB.Where("variant_id = ?", variantID).Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stocks)
}

// Listar productos
func GetProducts(c *gin.Context) {
	// Server-side search + pagination
	var products []Product
	search := strings.TrimSpace(c.Query("search"))
	categoryQ := c.Query("category")
	subcategoryQ := c.Query("subcategory")

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "25")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 25
	}
	offset := (page - 1) * limit

	// Base query with preloads
	// Seleccionar explícitamente products.* para evitar columnas ambiguas cuando hacemos JOINs
	base := config.DB.Model(&Product{}).Select("products.*").Preload("Category").Preload("Subcategory").Preload("Variants").Preload("LocationStocks")

	// Apply category/subcategory filters from explicit params
	if categoryQ != "" {
		// Qualify column with table name to avoid ambiguity when joining categories/subcategories
		base = base.Where("products.category_id = ?", categoryQ)
	}
	if subcategoryQ != "" {
		base = base.Where("products.subcategory_id = ?", subcategoryQ)
	}

	// If search provided, join categories/subcategories and filter by name
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		// Join categories, subcategories and variants to search across name, category, subcategory and variant SKU/description
		base = base.Joins("LEFT JOIN categories ON categories.id = products.category_id").Joins("LEFT JOIN subcategories ON subcategories.id = products.subcategory_id").Joins("LEFT JOIN product_variants ON product_variants.product_id = products.id").Where(
			"LOWER(products.name) LIKE ? OR LOWER(products.description) LIKE ? OR LOWER(categories.name) LIKE ? OR LOWER(subcategories.name) LIKE ? OR LOWER(product_variants.sku) LIKE ?",
			like, like, like, like, like,
		)
	}

	// Count total distinct products matching filters
	var total int64
	countQuery := base.Session(&gorm.Session{})
	if err := countQuery.Distinct("products.id").Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch paged results
	// We want to order products so those with stock appear first. Compute total stock per product
	// via a subquery and left join it as `stocks`, then order by COALESCE(stocks.total_stock,0) DESC
	stockSubquery := "(SELECT product_id, SUM(COALESCE(stock,0)) as total_stock FROM location_stocks GROUP BY product_id)"
	base = base.Joins("LEFT JOIN " + stockSubquery + " stocks ON stocks.product_id = products.id")
	// When we joined variants/categories the base query can return duplicate product rows
	// (one per variant). To avoid returning duplicate products (which causes React key warnings)
	// we first fetch the distinct product IDs for the current page, then load full product
	// records with preloads in a second query.
	var productIDs []uint
	if search != "" {
		// Query only ids (distinct) with pagination
		// Para usar DISTINCT con ORDER BY, necesitamos incluir la columna del ORDER BY en el SELECT
		type IDWithStock struct {
			ID         uint
			TotalStock int
		}
		var idsWithStock []IDWithStock
		if err := base.Select("DISTINCT products.id, COALESCE(stocks.total_stock,0) as total_stock").Order("total_stock DESC, products.id DESC").Offset(offset).Limit(limit).Scan(&idsWithStock).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Extraer solo los IDs
		for _, item := range idsWithStock {
			productIDs = append(productIDs, item.ID)
		}

		if len(productIDs) > 0 {
			// Load full product records with preloads, manteniendo el orden
			if err := config.DB.Preload("Category").Preload("Subcategory").Preload("Variants").Preload("LocationStocks").Where("products.id IN ?", productIDs).Order("products.id DESC").Find(&products).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			products = []Product{}
		}
	} else {
		// No joins/search involved — simple paged fetch is fine
		if err := base.Order("COALESCE(stocks.total_stock,0) DESC").Offset(offset).Limit(limit).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"items": products, "total": total})
}

// GetProduct obtiene el detalle de un producto por id
func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.Preload("Category").Preload("Subcategory").Preload("Variants").Preload("LocationStocks").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// CreateProduct lee el JSON del cuerpo y lo inserta en la base de datos
type CreateProductInput struct {
	Name          string  `json:"name" binding:"required,min=2,max=100"`
	Description   string  `json:"description"`
	CategoryID    uint    `json:"category_id" binding:"required,gt=0"`
	SubcategoryID uint    `json:"subcategory_id" binding:"required,gt=0"`
	ImageURL      string  `json:"image_url"`
	CostPrice     float64 `json:"cost_price" binding:"required,gt=0"`
	SupplierID    *uint   `json:"supplier_id,omitempty"`
	Season        string  `json:"season,omitempty"`
	SeasonID      *uint   `json:"season_id,omitempty"`
	Year          *int    `json:"year,omitempty"`
	SizeTypeID    *uint   `json:"size_type_id,omitempty"`
	TotalStock    *int    `json:"total_stock,omitempty"`
	ImageModel    string  `json:"image_model,omitempty"`
	ImageHanger   string  `json:"image_hanger,omitempty"`
	// Los precios se calculan automáticamente
	// Tipo de variantes: "talle_unico", "color_surtido", "ambos", "sin_variantes"
	VariantType string `json:"variant_type" binding:"omitempty,oneof=talle_unico color_surtido ambos sin_variantes"`
	// Campos de descuento administrables
	DiscountType  string  `json:"discount_type" binding:"omitempty,oneof=none percent fixed"`
	DiscountValue float64 `json:"discount_value" binding:"omitempty,gte=0"`
	// Tags para secciones del home
	IsNewArrival bool `json:"is_new_arrival"`
	IsFeatured   bool `json:"is_featured"`
	IsOffer      bool `json:"is_offer"`
	IsTrending   bool `json:"is_trending"`
}

func CreateProduct(c *gin.Context) {
	var input CreateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// DEBUG: Log para ver qué está recibiendo
	log.Printf("DEBUG CreateProduct - Received input: variant_type=%s, size_type_id=%v, supplier_id=%v",
		input.VariantType, input.SizeTypeID, input.SupplierID)

	// Verificar que la categoría exista
	var cat category.Category
	if err := config.DB.First(&cat, input.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría no encontrada"})
		return
	}
	// Verificar que la subcategoría exista y pertenezca a la categoría
	var subcat category.Subcategory
	if err := config.DB.First(&subcat, input.SubcategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Subcategoría no encontrada"})
		return
	}
	if subcat.CategoryID != input.CategoryID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La subcategoría no pertenece a la categoría seleccionada"})
		return
	}
	// Obtener price tiers y calcular precios
	var tiers []settings.PriceTier
	config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers)
	prices := settings.CalculateProductPricesFromList(input.CostPrice, tiers)

	product := Product{
		Name:           input.Name,
		Description:    input.Description,
		CategoryID:     input.CategoryID,
		SubcategoryID:  input.SubcategoryID,
		ImageURL:       input.ImageURL,
		CostPrice:      input.CostPrice,
		WholesalePrice: prices.WholesalePrice,
		Discount1Price: prices.Discount1Price,
		Discount2Price: prices.Discount2Price,
		VariantType:    input.VariantType,
		SupplierID:     input.SupplierID,
		Season:         input.Season,
		SeasonID:       input.SeasonID,
		Year:           input.Year,
		SizeTypeID:     input.SizeTypeID,
		TotalStock:     input.TotalStock,
		ImageModel:     input.ImageModel,
		ImageHanger:    input.ImageHanger,
		DiscountType:   input.DiscountType,
		DiscountValue:  input.DiscountValue,
		IsNewArrival:   input.IsNewArrival,
		IsFeatured:     input.IsFeatured,
		IsOffer:        input.IsOffer,
		IsTrending:     input.IsTrending,
	}
	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, product)
}

// Editar producto
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	type UpdateProductInput struct {
		Name           *string  `json:"name"`
		Description    *string  `json:"description"`
		CategoryID     *uint    `json:"category_id"`
		SubcategoryID  *uint    `json:"subcategory_id"`
		SupplierID     *uint    `json:"supplier_id"`
		SeasonID       *uint    `json:"season_id"`
		Year           *int     `json:"year"`
		SizeTypeID     *uint    `json:"size_type_id"`
		TotalStock     *int     `json:"total_stock"`
		ImageURL       *string  `json:"image_url"`
		CostPrice      *float64 `json:"cost_price"`
		WholesalePrice *float64 `json:"wholesale_price"`
		Discount1Price *float64 `json:"discount1_price"`
		Discount2Price *float64 `json:"discount2_price"`
		VariantType    *string  `json:"variant_type"`
		// Campos de descuento
		DiscountType  *string  `json:"discount_type"`
		DiscountValue *float64 `json:"discount_value"`
		// Tags para el home
		IsNewArrival *bool `json:"is_new_arrival"`
		IsFeatured   *bool `json:"is_featured"`
		IsOffer      *bool `json:"is_offer"`
		IsTrending   *bool `json:"is_trending"`
	}
	var input UpdateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Si se envía CategoryID, validar que exista
	if input.CategoryID != nil {
		var cat category.Category
		if err := config.DB.First(&cat, *input.CategoryID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría no encontrada"})
			return
		}
	}
	// Actualizar solo los campos enviados
	updates := make(map[string]interface{})
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.CategoryID != nil {
		updates["category_id"] = *input.CategoryID
	}
	if input.SubcategoryID != nil {
		updates["subcategory_id"] = *input.SubcategoryID
	}
	if input.SupplierID != nil {
		updates["supplier_id"] = *input.SupplierID
	}
	if input.SeasonID != nil {
		updates["season_id"] = *input.SeasonID
	}
	if input.Year != nil {
		updates["year"] = *input.Year
	}
	if input.SizeTypeID != nil {
		updates["size_type_id"] = *input.SizeTypeID
	}
	if input.TotalStock != nil {
		updates["total_stock"] = *input.TotalStock
	}
	if input.ImageURL != nil {
		updates["image_url"] = *input.ImageURL
	}
	if input.CostPrice != nil {
		updates["cost_price"] = *input.CostPrice
	}
	if input.WholesalePrice != nil {
		updates["wholesale_price"] = *input.WholesalePrice
	}
	if input.Discount1Price != nil {
		updates["discount1_price"] = *input.Discount1Price
	}
	if input.Discount2Price != nil {
		updates["discount2_price"] = *input.Discount2Price
	}
	if input.VariantType != nil {
		updates["variant_type"] = *input.VariantType
	}
	// Campos de descuento enviados en el update (permitir actualizar desde el mismo endpoint)
	if input.DiscountType != nil {
		updates["discount_type"] = *input.DiscountType
	}
	if input.DiscountValue != nil {
		updates["discount_value"] = *input.DiscountValue
	}
	// Tags para el home
	if input.IsNewArrival != nil {
		updates["is_new_arrival"] = *input.IsNewArrival
	}
	if input.IsFeatured != nil {
		updates["is_featured"] = *input.IsFeatured
	}
	if input.IsOffer != nil {
		updates["is_offer"] = *input.IsOffer
	}
	if input.IsTrending != nil {
		updates["is_trending"] = *input.IsTrending
	}
	if err := config.DB.Model(&product).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Recargar el producto para obtener las relaciones actualizadas
	if err := config.DB.Preload("Category").Preload("Subcategory").First(&product, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al recargar producto"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// UpdateProductDiscount permite a admin o encargado actualizar sólo los campos de descuento
func UpdateProductDiscount(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	type DiscountInput struct {
		DiscountType  string  `json:"discount_type" binding:"required,oneof=none percent fixed"`
		DiscountValue float64 `json:"discount_value" binding:"required,gte=0"`
	}
	var input DiscountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.DiscountType = input.DiscountType
	product.DiscountValue = input.DiscountValue
	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, product)
}

// Eliminar producto
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado"})
}

// Actualizar stock de un producto (solo admin/vendedor)
func UpdateStock(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	// El stock ahora se gestiona por variante y ubicación en LocationStock
	c.JSON(http.StatusBadRequest, gin.H{"error": "El stock se gestiona por variante y ubicación. Utiliza el endpoint correspondiente."})
}

// Listar productos con bajo stock (solo admin)
func LowStockProducts(c *gin.Context) {
	var products []Product
	// Puedes ajustar el umbral de bajo stock aquí
	const threshold = 5
	if err := config.DB.Where("stock <= ?", threshold).Preload("Category").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

// Subir imagen de producto (solo admin)
func UploadProductImage(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió archivo"})
		return
	}
	filename := "uploads/product_" + id + "_" + file.Filename
	if err := c.SaveUploadedFile(file, filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	product.ImageURL = "/" + filename
	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, product)
}

// Subir múltiples imágenes de producto (solo admin)
// Acepta hasta 3 archivos: image_main, image_model, image_hanger
func UploadProductImages(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error al procesar formulario"})
		return
	}

	uploadedImages := make(map[string]string)
	imageFields := []string{"image_main", "image_model", "image_hanger"}

	for _, fieldName := range imageFields {
		files := form.File[fieldName]
		if len(files) > 0 {
			file := files[0] // tomar el primer archivo de cada campo
			filename := "uploads/product_" + id + "_" + fieldName + "_" + file.Filename
			if err := c.SaveUploadedFile(file, filename); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar " + fieldName})
				return
			}
			uploadedImages[fieldName] = "/" + filename

			// Actualizar el campo correspondiente en el producto
			switch fieldName {
			case "image_main":
				product.ImageURL = "/" + filename
			case "image_model":
				product.ImageModel = "/" + filename
			case "image_hanger":
				product.ImageHanger = "/" + filename
			}
		}
	}

	if len(uploadedImages) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió ninguna imagen"})
		return
	}

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Imágenes subidas exitosamente",
		"uploaded_images": uploadedImages,
		"product":         product,
	})
}

// --- Extended create: crear producto + variantes + stocks iniciales en una transacción ---
type VariantInput struct {
	SKU      string `json:"sku"`
	Color    string `json:"color"`
	Size     string `json:"size"`
	ImageURL string `json:"image_url"`
}

type InitialStockInput struct {
	VariantIndex *int   `json:"variant_index,omitempty"`
	VariantID    *uint  `json:"variant_id,omitempty"`
	Location     string `json:"location" binding:"required"`
	Stock        int    `json:"stock" binding:"required,gte=0"`
}

type CreateProductFullInput struct {
	Name          string              `json:"name" binding:"required,min=2,max=100"`
	Description   string              `json:"description"`
	CategoryID    uint                `json:"category_id" binding:"required,gt=0"`
	SubcategoryID uint                `json:"subcategory_id" binding:"required,gt=0"`
	ImageURL      string              `json:"image_url"`
	CostPrice     float64             `json:"cost_price" binding:"required,gt=0"`
	VariantType   string              `json:"variant_type" binding:"omitempty,oneof=talle_unico color_surtido ambos sin_variantes"`
	SupplierID    *uint               `json:"supplier_id,omitempty"`
	Season        string              `json:"season,omitempty"`
	Year          *int                `json:"year,omitempty"`
	SizeTypeID    *uint               `json:"size_type_id,omitempty"`
	TotalStock    *int                `json:"total_stock,omitempty"`
	ImageModel    string              `json:"image_model,omitempty"`
	ImageHanger   string              `json:"image_hanger,omitempty"`
	Variants      []VariantInput      `json:"variants,omitempty"`
	InitialStocks []InitialStockInput `json:"initial_stocks,omitempty"`
	// Descuento al crear completo
	DiscountType  string  `json:"discount_type" binding:"omitempty,oneof=none percent fixed"`
	DiscountValue float64 `json:"discount_value" binding:"omitempty,gte=0"`
}

func CreateProductFull(c *gin.Context) {
	var input CreateProductFullInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Validar category/subcategory
	var cat category.Category
	if err := config.DB.First(&cat, input.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría no encontrada"})
		return
	}
	var subcat category.Subcategory
	if err := config.DB.First(&subcat, input.SubcategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Subcategoría no encontrada"})
		return
	}
	if subcat.CategoryID != input.CategoryID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La subcategoría no pertenece a la categoría seleccionada"})
		return
	}
	// Obtener price tiers y calcular precios
	var tiers []settings.PriceTier
	config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers)
	prices := settings.CalculateProductPricesFromList(input.CostPrice, tiers)

	product := Product{
		Name:           input.Name,
		Description:    input.Description,
		CategoryID:     input.CategoryID,
		SubcategoryID:  input.SubcategoryID,
		ImageURL:       input.ImageURL,
		CostPrice:      input.CostPrice,
		WholesalePrice: prices.WholesalePrice,
		Discount1Price: prices.Discount1Price,
		Discount2Price: prices.Discount2Price,
		VariantType:    input.VariantType,
	}

	// transacción para crear product, variantes y stocks
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&product).Error; err != nil {
			return err
		}
		createdVariants := make([]ProductVariant, 0, len(input.Variants))
		for _, v := range input.Variants {
			pv := ProductVariant{ProductID: product.ID, Color: v.Color, Size: v.Size, SKU: v.SKU, ImageURL: v.ImageURL}
			if err := tx.Create(&pv).Error; err != nil {
				return err
			}
			createdVariants = append(createdVariants, pv)
		}
		for _, s := range input.InitialStocks {
			var variantID *uint = nil
			if s.VariantID != nil {
				variantID = s.VariantID
			} else if s.VariantIndex != nil {
				idx := *s.VariantIndex
				if idx < 0 || idx >= len(createdVariants) {
					return fmt.Errorf("variant_index fuera de rango: %d", idx)
				}
				vid := createdVariants[idx].ID
				variantID = &vid
			}
			stock := LocationStock{ProductID: product.ID, VariantID: variantID, Location: s.Location, Stock: s.Stock}
			// comprobar duplicado: buscar por product+location+(variant nullable)
			var existing LocationStock
			q := tx.Where("product_id = ? AND location = ? AND "+
				"(variant_id IS NULL OR variant_id = ?)", product.ID, s.Location, variantID).First(&existing)
			if q.Error == nil {
				existing.Stock = s.Stock
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}
			} else if q.Error == gorm.ErrRecordNotFound {
				if err := tx.Create(&stock).Error; err != nil {
					return err
				}
			} else {
				return q.Error
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var out Product
	if err := config.DB.Preload("Variants").Preload("LocationStocks").Preload("Category").Preload("Subcategory").First(&out, product.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, out)
}

// --- New: agregar/actualizar stocks para un producto existente ---
type StockItemInput struct {
	VariantID *uint  `json:"variant_id,omitempty"`
	Location  string `json:"location" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,gte=0"`
}

type AddStocksInput struct {
	Stocks []StockItemInput `json:"stocks" binding:"required,dive,required"`
}

// AddProductStocks agrega o actualiza (upsert) los stocks asociados a un producto.
// Ruta: POST /products/:id/stocks
func AddProductStocks(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}
	var input AddStocksInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ejecutar en transacción: validar variantes y upsert por cada item
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		// Primero calcular sumas actuales (stock + reserved) para el producto
		type sums struct {
			SumStock sql.NullInt64 `gorm:"column:sum_stock"`
			SumRes   sql.NullInt64 `gorm:"column:sum_reserved"`
		}
		var s sums
		if err := tx.Raw("SELECT COALESCE(SUM(stock),0) as sum_stock, COALESCE(SUM(reserved),0) as sum_reserved FROM location_stocks WHERE product_id = ?", product.ID).Scan(&s).Error; err != nil {
			return err
		}
		currentCombined := int64(0)
		currentCombined += s.SumStock.Int64
		currentCombined += s.SumRes.Int64

		// Sumamos los nuevos valores propuestos y restamos los stocks existentes para las filas que se reemplazan
		var sumNew int64 = 0
		var sumExistingForItems int64 = 0

		// Para cada item validamos variante y recolectamos valores
		for _, it := range input.Stocks {
			if it.VariantID != nil {
				var v ProductVariant
				if err := tx.First(&v, *it.VariantID).Error; err != nil {
					return fmt.Errorf("Variante %d no encontrada", *it.VariantID)
				}
				if v.ProductID != product.ID {
					return fmt.Errorf("La variante %d no pertenece al producto %d", *it.VariantID, product.ID)
				}
			}

			// revisar existente
			var existing LocationStock
			var q *gorm.DB
			if it.VariantID == nil {
				q = tx.Where("product_id = ? AND location = ? AND variant_id IS NULL", product.ID, it.Location).First(&existing)
			} else {
				q = tx.Where("product_id = ? AND location = ? AND variant_id = ?", product.ID, it.Location, *it.VariantID).First(&existing)
			}
			if q.Error != nil && q.Error != gorm.ErrRecordNotFound {
				return q.Error
			}
			if q.Error == nil {
				// No permitir bajar stock por debajo del reservado
				if it.Quantity < existing.Reserved {
					return fmt.Errorf("no se puede fijar stock %d menor que reservado %d para variante en ubicacion %s", it.Quantity, existing.Reserved, it.Location)
				}
				sumExistingForItems += int64(existing.Stock)
			}
			sumNew += int64(it.Quantity)
		}

		proposedCombined := currentCombined - sumExistingForItems + sumNew
		if product.TotalStock != nil {
			if proposedCombined > int64(*product.TotalStock) {
				return fmt.Errorf("la suma total de stock (%d) excede el total permitido por producto (%d)", proposedCombined, *product.TotalStock)
			}
		}

		// Si pasó las validaciones, aplicar upserts y registrar movimientos
		results := make([]LocationStock, 0, len(input.Stocks))

		// Obtener info del usuario para el registro de movimientos
		userID, _ := c.Get("user_id")
		userName, _ := c.Get("user_name")
		var uid *uint
		var uname string
		if userID != nil {
			if u, ok := userID.(uint); ok {
				uid = &u
			}
		}
		if userName != nil {
			if un, ok := userName.(string); ok {
				uname = un
			}
		}

		for _, it := range input.Stocks {
			var existing LocationStock
			var q *gorm.DB
			previousStock := 0

			if it.VariantID == nil {
				q = tx.Where("product_id = ? AND location = ? AND variant_id IS NULL", product.ID, it.Location).First(&existing)
			} else {
				q = tx.Where("product_id = ? AND location = ? AND variant_id = ?", product.ID, it.Location, *it.VariantID).First(&existing)
			}

			if q.Error == nil {
				// Actualización de stock existente
				previousStock = existing.Stock
				existing.Stock = it.Quantity
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}

				// Registrar movimiento
				movement := StockMovement{
					ProductID:     product.ID,
					VariantID:     it.VariantID,
					Location:      it.Location,
					MovementType:  "adjustment",
					Quantity:      it.Quantity - previousStock,
					PreviousStock: previousStock,
					NewStock:      it.Quantity,
					Reason:        "Ajuste manual desde inventario",
					UserID:        uid,
					UserName:      uname,
				}
				if err := tx.Create(&movement).Error; err != nil {
					return err
				}

				results = append(results, existing)
				continue
			}

			// Crear nuevo registro de stock
			newStock := LocationStock{
				ProductID: product.ID,
				VariantID: it.VariantID,
				Location:  it.Location,
				Stock:     it.Quantity,
			}
			if err := tx.Create(&newStock).Error; err != nil {
				return err
			}

			// Registrar movimiento de stock inicial
			movement := StockMovement{
				ProductID:     product.ID,
				VariantID:     it.VariantID,
				Location:      it.Location,
				MovementType:  "initial",
				Quantity:      it.Quantity,
				PreviousStock: 0,
				NewStock:      it.Quantity,
				Reason:        "Stock inicial",
				UserID:        uid,
				UserName:      uname,
			}
			if err := tx.Create(&movement).Error; err != nil {
				return err
			}

			results = append(results, newStock)
		}
		return nil
	})

	if err != nil {
		// Si el error viene formateado, devolver 400 cuando corresponde
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Recargar stocks del producto para la respuesta
	var stocks []LocationStock
	if err := config.DB.Where("product_id = ?", product.ID).Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"product_id": product.ID, "stocks": stocks})
}

// ListLocationStocks lista stocks por ubicación con filtros opcionales
func ListLocationStocks(c *gin.Context) {
	productID := c.Query("product_id")
	variantID := c.Query("variant_id")
	location := c.Query("location")

	query := config.DB.Model(&LocationStock{})

	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	}
	if location != "" {
		query = query.Where("location = ?", location)
	}

	var stocks []LocationStock
	if err := query.Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stocks)
}
