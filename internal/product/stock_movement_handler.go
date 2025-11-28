package product

import (
	"go-modaMayor/config"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListStockMovements lista movimientos de stock con filtros opcionales
func ListStockMovements(c *gin.Context) {
	productID := c.Query("product_id")
	variantID := c.Query("variant_id")
	location := c.Query("location")
	movementType := c.Query("movement_type")
	limitStr := c.Query("limit")

	query := config.DB.Model(&StockMovement{}).Order("created_at DESC")

	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	}
	if location != "" {
		query = query.Where("location = ?", location)
	}
	if movementType != "" {
		query = query.Where("movement_type = ?", movementType)
	}

	// Limitar resultados (default 100)
	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	query = query.Limit(limit)

	var movements []StockMovement
	if err := query.Find(&movements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, movements)
}

// CreateStockMovement registra un movimiento de stock manualmente
func CreateStockMovement(c *gin.Context) {
	var input struct {
		ProductID    uint   `json:"product_id" binding:"required"`
		VariantID    *uint  `json:"variant_id"`
		Location     string `json:"location" binding:"required"`
		MovementType string `json:"movement_type" binding:"required"`
		Quantity     int    `json:"quantity" binding:"required"`
		Reason       string `json:"reason"`
		Reference    string `json:"reference"`
		Notes        string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obtener stock actual
	var currentStock LocationStock
	var query = config.DB
	if input.VariantID == nil {
		query = query.Where("product_id = ? AND location = ? AND variant_id IS NULL", input.ProductID, input.Location)
	} else {
		query = query.Where("product_id = ? AND location = ? AND variant_id = ?", input.ProductID, input.Location, *input.VariantID)
	}

	var previousStock int
	if err := query.First(&currentStock).Error; err == nil {
		previousStock = currentStock.Stock
	} else {
		previousStock = 0
	}

	newStock := previousStock + input.Quantity

	// Obtener información del usuario desde el contexto
	userID, _ := c.Get("user_id")
	userName, _ := c.Get("user_name")

	movement := StockMovement{
		ProductID:     input.ProductID,
		VariantID:     input.VariantID,
		Location:      input.Location,
		MovementType:  input.MovementType,
		Quantity:      input.Quantity,
		PreviousStock: previousStock,
		NewStock:      newStock,
		Reason:        input.Reason,
		Reference:     input.Reference,
		Notes:         input.Notes,
	}

	if userID != nil {
		if uid, ok := userID.(uint); ok {
			movement.UserID = &uid
		}
	}
	if userName != nil {
		if uname, ok := userName.(string); ok {
			movement.UserName = uname
		}
	}

	if err := config.DB.Create(&movement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, movement)
}

// RegisterStockMovement es una función helper para registrar movimientos internamente
// Llamada desde otros handlers cuando se modifica stock
func RegisterStockMovement(
	productID uint,
	variantID *uint,
	location string,
	movementType string,
	quantity int,
	previousStock int,
	newStock int,
	reason string,
	reference string,
	userID *uint,
	userName string,
) error {
	movement := StockMovement{
		ProductID:     productID,
		VariantID:     variantID,
		Location:      location,
		MovementType:  movementType,
		Quantity:      quantity,
		PreviousStock: previousStock,
		NewStock:      newStock,
		Reason:        reason,
		Reference:     reference,
		UserID:        userID,
		UserName:      userName,
	}

	return config.DB.Create(&movement).Error
}
