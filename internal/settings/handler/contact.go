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
		c.JSON(http.StatusOK, gin.H{
			"settings": settings.ContactSettings{
				WhatsAppNumber:  "5491123456789",
				WhatsAppMessage: "¡Hola! Tengo una consulta sobre Moda x Mayor",
			},
			"addresses": []settings.ContactAddress{},
		})
		return
	}

	// Obtener direcciones
	var addresses []settings.ContactAddress
	config.DB.Order("display_order ASC, id ASC").Find(&addresses)

	c.JSON(http.StatusOK, gin.H{
		"settings":  cs,
		"addresses": addresses,
	})
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

// GET /settings/contact/addresses
func GetContactAddresses(c *gin.Context) {
	var addresses []settings.ContactAddress
	config.DB.Order("display_order ASC, id ASC").Find(&addresses)
	c.JSON(http.StatusOK, addresses)
}

// POST /settings/contact/addresses
func CreateContactAddress(c *gin.Context) {
	var input settings.ContactAddress
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, input)
}

// PUT /settings/contact/addresses/:id
func UpdateContactAddress(c *gin.Context) {
	id := c.Param("id")
	var addr settings.ContactAddress
	
	if err := config.DB.First(&addr, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	var input settings.ContactAddress
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addr.Name = input.Name
	addr.Address = input.Address
	addr.BusinessHours = input.BusinessHours
	addr.DisplayOrder = input.DisplayOrder

	if err := config.DB.Save(&addr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, addr)
}

// DELETE /settings/contact/addresses/:id
func DeleteContactAddress(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&settings.ContactAddress{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dirección eliminada"})
}
