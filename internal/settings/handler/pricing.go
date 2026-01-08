package handler

import (
	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GET /settings/pricing
func GetPricingConfig(c *gin.Context) {
	var cfg settings.PricingConfig
	if err := config.DB.First(&cfg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// PUT /settings/pricing
func UpdatePricingConfig(c *gin.Context) {
	var input settings.PricingConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cfg settings.PricingConfig
	if err := config.DB.First(&cfg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		return
	}
	cfg.WholesalePercent = input.WholesalePercent
	cfg.Discount1Percent = input.Discount1Percent
	cfg.Discount2Percent = input.Discount2Percent
	cfg.MinQtyWholesale = input.MinQtyWholesale
	cfg.MinQtyDiscount1 = input.MinQtyDiscount1
	cfg.MinQtyDiscount2 = input.MinQtyDiscount2
	if err := config.DB.Save(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}
