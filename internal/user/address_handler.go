package user

import (
	"go-modaMayor/config"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListAddresses devuelve todas las direcciones de un usuario
func ListAddresses(c *gin.Context) {
	userID := c.Param("user_id")

	var addresses []Address
	if err := config.DB.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

// CreateAddress crea una nueva dirección para un usuario
func CreateAddress(c *gin.Context) {
	userID := c.Param("user_id")

	var input Address
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convertir userID a uint
	uid, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}
	input.UserID = uint(uid)

	// Si es la primera dirección o se marca como default, asegurar que sea la única default
	if input.IsDefault {
		config.DB.Model(&Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	// Si no hay direcciones, esta será la default
	var count int64
	config.DB.Model(&Address{}).Where("user_id = ?", userID).Count(&count)
	if count == 0 {
		input.IsDefault = true
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateAddress actualiza una dirección
func UpdateAddress(c *gin.Context) {
	addressID := c.Param("id")

	var address Address
	if err := config.DB.First(&address, addressID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	var input Address
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Si se marca como default, desmarcar las demás del mismo usuario
	if input.IsDefault && !address.IsDefault {
		config.DB.Model(&Address{}).Where("user_id = ? AND id != ?", address.UserID, addressID).Update("is_default", false)
	}

	if err := config.DB.Model(&address).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, address)
}

// DeleteAddress elimina una dirección
func DeleteAddress(c *gin.Context) {
	addressID := c.Param("id")

	var address Address
	if err := config.DB.First(&address, addressID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	wasDefault := address.IsDefault
	userID := address.UserID

	if err := config.DB.Delete(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Si era la dirección default, marcar otra como default
	if wasDefault {
		var newDefault Address
		if err := config.DB.Where("user_id = ?", userID).First(&newDefault).Error; err == nil {
			config.DB.Model(&newDefault).Update("is_default", true)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dirección eliminada"})
}

// SetDefaultAddress marca una dirección como predeterminada
func SetDefaultAddress(c *gin.Context) {
	addressID := c.Param("id")

	var address Address
	if err := config.DB.First(&address, addressID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
		return
	}

	// Desmarcar todas las direcciones del usuario
	config.DB.Model(&Address{}).Where("user_id = ?", address.UserID).Update("is_default", false)

	// Marcar esta como default
	address.IsDefault = true
	config.DB.Save(&address)

	c.JSON(http.StatusOK, address)
}
