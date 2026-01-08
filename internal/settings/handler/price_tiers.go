package handler

import (
	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GET /settings/price-tiers
// Obtiene todos los niveles de precio activos, ordenados por order_index
func GetPriceTiers(c *gin.Context) {
	var tiers []settings.PriceTier
	query := config.DB.Where("active = ?", true).Order("order_index ASC")

	// Opción para incluir inactivos (solo admin)
	if c.Query("include_inactive") == "true" {
		query = config.DB.Order("order_index ASC")
	}

	if err := query.Find(&tiers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tiers": tiers})
}

// GET /settings/price-tiers/:id
// Obtiene un nivel de precio específico
func GetPriceTier(c *gin.Context) {
	id := c.Param("id")
	var tier settings.PriceTier

	if err := config.DB.First(&tier, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nivel de precio no encontrado"})
		return
	}

	c.JSON(http.StatusOK, tier)
}

// POST /settings/price-tiers
// Crea un nuevo nivel de precio (solo admin/encargado)
func CreatePriceTier(c *gin.Context) {
	var input settings.PriceTier

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validaciones
	if input.Name == "" || input.DisplayName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name y DisplayName son requeridos"})
		return
	}

	if input.FormulaType != "multiplier" && input.FormulaType != "percentage_markup" && input.FormulaType != "flat_amount" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FormulaType debe ser 'multiplier', 'percentage_markup' o 'flat_amount'"})
		return
	}

	// Si se marca como default, desmarcar otros
	if input.IsDefault {
		config.DB.Model(&settings.PriceTier{}).Where("is_default = ?", true).Update("is_default", false)
	}

	// Si no se especifica order_index, usar el siguiente disponible
	if input.OrderIndex == 0 {
		var maxOrder int
		config.DB.Model(&settings.PriceTier{}).Select("COALESCE(MAX(order_index), 0)").Scan(&maxOrder)
		input.OrderIndex = maxOrder + 1
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// PUT /settings/price-tiers/:id
// Actualiza un nivel de precio existente (solo admin/encargado)
func UpdatePriceTier(c *gin.Context) {
	id := c.Param("id")
	var tier settings.PriceTier

	if err := config.DB.First(&tier, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nivel de precio no encontrado"})
		return
	}

	var input settings.PriceTier
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validar formula_type si se está cambiando
	if input.FormulaType != "" && input.FormulaType != "multiplier" &&
		input.FormulaType != "percentage_markup" && input.FormulaType != "flat_amount" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FormulaType debe ser 'multiplier', 'percentage_markup' o 'flat_amount'"})
		return
	}

	// Si se marca como default, desmarcar otros
	if input.IsDefault && !tier.IsDefault {
		config.DB.Model(&settings.PriceTier{}).Where("id != ?", id).Update("is_default", false)
	}

	// Actualizar campos
	updates := make(map[string]interface{})
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.DisplayName != "" {
		updates["display_name"] = input.DisplayName
	}
	if input.FormulaType != "" {
		updates["formula_type"] = input.FormulaType
	}
	updates["multiplier"] = input.Multiplier
	updates["percentage"] = input.Percentage
	updates["flat_amount"] = input.FlatAmount
	updates["min_quantity"] = input.MinQuantity
	if input.OrderIndex > 0 {
		updates["order_index"] = input.OrderIndex
	}
	updates["active"] = input.Active
	if input.Description != "" {
		updates["description"] = input.Description
	}
	updates["is_default"] = input.IsDefault
	updates["show_in_public"] = input.ShowInPublic
	if input.ColorCode != "" {
		updates["color_code"] = input.ColorCode
	}

	if err := config.DB.Model(&tier).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Recargar el tier actualizado
	config.DB.First(&tier, id)
	c.JSON(http.StatusOK, tier)
}

// DELETE /settings/price-tiers/:id
// Elimina (soft delete) un nivel de precio (solo admin/encargado)
func DeletePriceTier(c *gin.Context) {
	id := c.Param("id")
	var tier settings.PriceTier

	if err := config.DB.First(&tier, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nivel de precio no encontrado"})
		return
	}

	// No permitir eliminar el tier por defecto
	if tier.IsDefault {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se puede eliminar el nivel de precio por defecto"})
		return
	}

	if err := config.DB.Delete(&tier).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Nivel de precio eliminado exitosamente"})
}

// PUT /settings/price-tiers/reorder
// Reordena los niveles de precio
// Espera: { "tiers": [{"id": 1, "order_index": 1}, {"id": 2, "order_index": 2}, ...] }
func ReorderPriceTiers(c *gin.Context) {
	var input struct {
		Tiers []struct {
			ID         uint `json:"id"`
			OrderIndex int  `json:"order_index"`
		} `json:"tiers"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Actualizar cada tier
	for _, tierUpdate := range input.Tiers {
		config.DB.Model(&settings.PriceTier{}).Where("id = ?", tierUpdate.ID).Update("order_index", tierUpdate.OrderIndex)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Orden actualizado exitosamente"})
}

// POST /settings/price-tiers/recalculate-products
// Recalcula los precios de todos los productos existentes usando los tiers actuales
func RecalculateAllProductPrices(c *gin.Context) {
	// Obtener todos los tiers activos
	var tiers []settings.PriceTier
	if err := config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener price tiers"})
		return
	}

	if len(tiers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No hay price tiers configurados"})
		return
	}

	// Obtener todos los productos
	var products []struct {
		ID        uint
		CostPrice float64
	}

	if err := config.DB.Table("products").Select("id, cost_price").Where("deleted_at IS NULL").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	// Recalcular precios para cada producto
	updated := 0
	errors := 0

	for _, prod := range products {
		prices := settings.CalculateProductPricesFromList(prod.CostPrice, tiers)

		updates := map[string]interface{}{
			"wholesale_price": prices.WholesalePrice,
			"discount1_price": prices.Discount1Price,
			"discount2_price": prices.Discount2Price,
		}

		if err := config.DB.Table("products").Where("id = ?", prod.ID).Updates(updates).Error; err != nil {
			errors++
		} else {
			updated++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Recálculo completado",
		"total_products": len(products),
		"updated":        updated,
		"errors":         errors,
		"tiers_applied":  len(tiers),
	})
}

// GET /settings/price-tiers/calculate
// Endpoint auxiliar para calcular precios según diferentes tiers
// Query params: cost_price (requerido), quantity (opcional, default 1)
// Devuelve todos los tiers aplicables con sus precios calculados
func CalculatePricesForTiers(c *gin.Context) {
	costPriceStr := c.Query("cost_price")
	if costPriceStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cost_price es requerido"})
		return
	}

	costPrice, err := strconv.ParseFloat(costPriceStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cost_price debe ser un número válido"})
		return
	}

	quantity := 1
	if qtyStr := c.Query("quantity"); qtyStr != "" {
		if q, err := strconv.Atoi(qtyStr); err == nil {
			quantity = q
		}
	}

	var tiers []settings.PriceTier
	if err := config.DB.Where("active = ?", true).Order("order_index ASC").Find(&tiers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type TierWithPrice struct {
		settings.PriceTier
		CalculatedPrice float64 `json:"calculated_price"`
		AppliesNow      bool    `json:"applies_now"`
	}

	result := make([]TierWithPrice, 0)
	var applicableTier *settings.PriceTier

	// Encontrar el tier aplicable según la cantidad
	for i := range tiers {
		tier := &tiers[i]
		applies := quantity >= tier.MinQuantity

		if applies && (applicableTier == nil || tier.OrderIndex < applicableTier.OrderIndex) {
			applicableTier = tier
		}

		result = append(result, TierWithPrice{
			PriceTier:       *tier,
			CalculatedPrice: tier.CalculatePrice(costPrice),
			AppliesNow:      applies && tier == applicableTier,
		})
	}

	// Si ninguno aplica, usar el default
	if applicableTier == nil {
		for i := range result {
			if result[i].IsDefault {
				result[i].AppliesNow = true
				break
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"cost_price": costPrice,
		"quantity":   quantity,
		"tiers":      result,
	})
}
