package handler

import (
	"net/http"

	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"

	"github.com/gin-gonic/gin"
)

// GET /settings/home_section_configs - Listar todas las configuraciones
func ListHomeSectionConfigs(c *gin.Context) {
	var configs []settings.HomeSectionConfig
	if err := config.DB.Order("display_order ASC").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// GET /public/home_section_configs - Configuraciones públicas (solo activas)
func GetPublicHomeSectionConfigs(c *gin.Context) {
	var configs []settings.HomeSectionConfig
	if err := config.DB.Where("enabled = ?", true).Order("display_order ASC").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// GET /settings/home_section_configs/:id
func GetHomeSectionConfig(c *gin.Context) {
	id := c.Param("id")
	var cfg settings.HomeSectionConfig
	if err := config.DB.First(&cfg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// PUT /settings/home_section_configs/:id - Actualizar configuración
func UpdateHomeSectionConfig(c *gin.Context) {
	id := c.Param("id")
	var cfg settings.HomeSectionConfig
	if err := config.DB.First(&cfg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		return
	}

	type UpdateInput struct {
		Title         *string `json:"title"`
		Enabled       *bool   `json:"enabled"`
		DisplayOrder  *int    `json:"display_order"`
		LimitProducts *int    `json:"limit_products"`
		ShowMode      *string `json:"show_mode"`
	}

	var input UpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Actualizar campos
	if input.Title != nil {
		cfg.Title = *input.Title
	}
	if input.Enabled != nil {
		cfg.Enabled = *input.Enabled
	}
	if input.DisplayOrder != nil {
		cfg.DisplayOrder = *input.DisplayOrder
	}
	if input.LimitProducts != nil {
		if *input.LimitProducts < 1 || *input.LimitProducts > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "limit_products debe estar entre 1 y 100"})
			return
		}
		cfg.LimitProducts = *input.LimitProducts
	}
	if input.ShowMode != nil {
		if *input.ShowMode != "manual" && *input.ShowMode != "auto" && *input.ShowMode != "both" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "show_mode debe ser 'manual', 'auto' o 'both'"})
			return
		}
		cfg.ShowMode = *input.ShowMode
	}

	if err := config.DB.Save(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// PUT /settings/home_section_configs/reorder - Reordenar secciones
func ReorderHomeSectionConfigs(c *gin.Context) {
	var payload []struct {
		ID           uint `json:"id"`
		DisplayOrder int  `json:"display_order"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range payload {
		if err := config.DB.Model(&settings.HomeSectionConfig{}).Where("id = ?", item.ID).Update("display_order", item.DisplayOrder).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	var configs []settings.HomeSectionConfig
	if err := config.DB.Order("display_order ASC").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, configs)
}

// POST /settings/home_section_configs - Crear nueva configuración personalizada
func CreateHomeSectionConfig(c *gin.Context) {
	var input settings.HomeSectionConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validaciones
	if input.SectionKey == "" || input.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "section_key y title son obligatorios"})
		return
	}

	if input.LimitProducts < 1 || input.LimitProducts > 100 {
		input.LimitProducts = 12 // valor por defecto
	}

	if input.ShowMode != "manual" && input.ShowMode != "auto" && input.ShowMode != "both" {
		input.ShowMode = "both"
	}

	// Verificar que no exista
	var existing settings.HomeSectionConfig
	if err := config.DB.Where("section_key = ?", input.SectionKey).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe una configuración con ese section_key"})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// DELETE /settings/home_section_configs/:id - Eliminar configuración
func DeleteHomeSectionConfig(c *gin.Context) {
	id := c.Param("id")
	var cfg settings.HomeSectionConfig
	if err := config.DB.First(&cfg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuración no encontrada"})
		return
	}

	if err := config.DB.Delete(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Configuración eliminada", "id": id})
}
