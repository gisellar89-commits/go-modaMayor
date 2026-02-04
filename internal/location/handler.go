package location

import (
	"go-modaMayor/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListLocations devuelve todas las ubicaciones (opcionalmente solo las activas)
func ListLocations(c *gin.Context) {
	activeOnly := c.Query("active") == "true"

	query := config.DB.Model(&Location{}).Order("display_order ASC, name ASC")
	
	if activeOnly {
		query = query.Where("active = ?", true)
	}

	var locations []Location
	if err := query.Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, locations)
}

// GetLocation devuelve una ubicación por ID
func GetLocation(c *gin.Context) {
	id := c.Param("id")
	
	var location Location
	if err := config.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ubicación no encontrada"})
		return
	}

	c.JSON(http.StatusOK, location)
}

// CreateLocation crea una nueva ubicación
func CreateLocation(c *gin.Context) {
	var input Location
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que el código no esté duplicado
	var existing Location
	if err := config.DB.Where("code = ?", input.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Ya existe una ubicación con ese código"})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateLocation actualiza una ubicación existente
func UpdateLocation(c *gin.Context) {
	id := c.Param("id")
	
	var location Location
	if err := config.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ubicación no encontrada"})
		return
	}

	var input Location
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que el código no esté duplicado (si cambió)
	if input.Code != location.Code {
		var existing Location
		if err := config.DB.Where("code = ? AND id != ?", input.Code, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Ya existe una ubicación con ese código"})
			return
		}
	}

	// Actualizar campos
	location.Code = input.Code
	location.Name = input.Name
	location.Description = input.Description
	location.Active = input.Active
	location.DisplayOrder = input.DisplayOrder

	if err := config.DB.Save(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, location)
}

// DeleteLocation elimina (soft delete) una ubicación
func DeleteLocation(c *gin.Context) {
	id := c.Param("id")
	
	var location Location
	if err := config.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ubicación no encontrada"})
		return
	}

	// Validar que no exista stock en esta ubicación
	var stockCount int64
	if err := config.DB.Table("location_stocks").
		Where("location = ? AND (stock > 0 OR reserved > 0)", location.Code).
		Count(&stockCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al validar stock"})
		return
	}

	if stockCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se puede eliminar la ubicación porque tiene productos con stock o reservas. Primero debe transferir o eliminar el stock de esta ubicación.",
		})
		return
	}

	if err := config.DB.Delete(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ubicación eliminada correctamente"})
}
