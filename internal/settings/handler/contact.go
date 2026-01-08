package handler

import (
	"net/http"

	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"

	"github.com/gin-gonic/gin"
)

// Public GET /settings/contact
func GetContactSettings(c *gin.Context) {
	var cs settings.ContactSettings
	if err := config.DB.First(&cs).Error; err != nil {
		// Si no existe, devolver configuración por defecto
		c.JSON(http.StatusOK, settings.ContactSettings{
			WhatsAppNumber:  "5491123456789",
			WhatsAppMessage: "¡Hola! Tengo una consulta sobre Moda x Mayor",
		})
		return
	}
	c.JSON(http.StatusOK, cs)
}

// PUT /settings/contact (admin/encargado)
func UpdateContactSettings(c *gin.Context) {
	var input struct {
		WhatsAppNumber  string `json:"whatsapp_number"`
		WhatsAppMessage string `json:"whatsapp_message"`
		Email           string `json:"email"`
		Phone           string `json:"phone"`
		Address         string `json:"address"`
		FacebookURL     string `json:"facebook_url"`
		InstagramURL    string `json:"instagram_url"`
		TwitterURL      string `json:"twitter_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cs settings.ContactSettings
	if err := config.DB.First(&cs).Error; err != nil {
		// Si no existe, crear uno nuevo
		cs = settings.ContactSettings{
			WhatsAppNumber:  input.WhatsAppNumber,
			WhatsAppMessage: input.WhatsAppMessage,
			Email:           input.Email,
			Phone:           input.Phone,
			Address:         input.Address,
			FacebookURL:     input.FacebookURL,
			InstagramURL:    input.InstagramURL,
			TwitterURL:      input.TwitterURL,
		}
		if err := config.DB.Create(&cs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, cs)
		return
	}

	// Actualizar campos
	cs.WhatsAppNumber = input.WhatsAppNumber
	cs.WhatsAppMessage = input.WhatsAppMessage
	cs.Email = input.Email
	cs.Phone = input.Phone
	cs.Address = input.Address
	cs.FacebookURL = input.FacebookURL
	cs.InstagramURL = input.InstagramURL
	cs.TwitterURL = input.TwitterURL

	if err := config.DB.Save(&cs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cs)
}
