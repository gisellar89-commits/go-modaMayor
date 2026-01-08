package ad

import (
	"go-modaMayor/config"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateAdInput struct {
	Title       string `json:"title" binding:"required,min=2,max=100"`
	Description string `json:"description"`
	MediaURL    string `json:"media_url" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=anuncio video"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Active      bool   `json:"active"`
	Featured    bool   `json:"featured"`
}

func CreateAd(c *gin.Context) {
	var input CreateAdInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ad := Ad{
		Title:       input.Title,
		Description: input.Description,
		MediaURL:    input.MediaURL,
		Type:        input.Type,
		Active:      input.Active,
		Featured:    input.Featured,
	}
	// Parse fechas si se envían
	if input.StartDate != "" {
		ad.StartDate, _ = time.Parse("2006-01-02", input.StartDate)
	}
	if input.EndDate != "" {
		ad.EndDate, _ = time.Parse("2006-01-02", input.EndDate)
	}
	if err := config.DB.Create(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ad)
}

func ListAds(c *gin.Context) {
	var ads []Ad
	if err := config.DB.Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ads)
}

func UpdateAd(c *gin.Context) {
	id := c.Param("id")
	var ad Ad
	if err := config.DB.First(&ad, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anuncio no encontrado"})
		return
	}
	var input CreateAdInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ad.Title = input.Title
	ad.Description = input.Description
	ad.MediaURL = input.MediaURL
	ad.Type = input.Type
	ad.Active = input.Active
	ad.Featured = input.Featured
	if input.StartDate != "" {
		ad.StartDate, _ = time.Parse("2006-01-02", input.StartDate)
	}
	if input.EndDate != "" {
		ad.EndDate, _ = time.Parse("2006-01-02", input.EndDate)
	}
	if err := config.DB.Save(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ad)
}

func DeleteAd(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&Ad{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Anuncio eliminado"})
}
