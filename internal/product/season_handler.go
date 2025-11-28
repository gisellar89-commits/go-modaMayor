package product

import (
	"go-modaMayor/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListSeasons devuelve todas las temporadas
func ListSeasons(c *gin.Context) {
	var seasons []Season
	if err := config.DB.Order("year DESC, id DESC").Find(&seasons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, seasons)
}

// GetSeason devuelve una temporada por ID
func GetSeason(c *gin.Context) {
	id := c.Param("id")
	var season Season
	if err := config.DB.First(&season, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Temporada no encontrada"})
		return
	}
	c.JSON(http.StatusOK, season)
}

// CreateSeason crea una nueva temporada
func CreateSeason(c *gin.Context) {
	var season Season
	if err := c.ShouldBindJSON(&season); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validaciones
	if season.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El nombre es obligatorio"})
		return
	}
	if season.Year == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El año es obligatorio"})
		return
	}

	if err := config.DB.Create(&season).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, season)
}

// UpdateSeason actualiza una temporada
func UpdateSeason(c *gin.Context) {
	id := c.Param("id")
	var season Season
	if err := config.DB.First(&season, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Temporada no encontrada"})
		return
	}

	var input Season
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Actualizar campos
	season.Name = input.Name
	season.Code = input.Code
	season.Year = input.Year
	season.Active = input.Active

	if err := config.DB.Save(&season).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, season)
}

// DeleteSeason elimina una temporada (soft delete)
func DeleteSeason(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&Season{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Temporada eliminada"})
}
