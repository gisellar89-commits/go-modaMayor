package address

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Listar todas las direcciones de un usuario
func ListUserAddresses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("user_id")

		// Validación de seguridad: solo el usuario puede ver sus propias direcciones
		// a menos que sea admin o encargado
		userIDClaim, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			return
		}

		userRole, _ := c.Get("user_role")
		// Si no es admin ni encargado, solo puede ver sus propias direcciones
		if userRole != "admin" && userRole != "encargado" {
			// Convertir userIDClaim a string para comparar
			userIDStr := fmt.Sprintf("%v", userIDClaim)
			if userIDStr != userID {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para ver estas direcciones"})
				return
			}
		}

		var addresses []Address
		if err := db.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Siempre devolver array, aunque esté vacío
		if addresses == nil {
			addresses = []Address{}
		}

		c.JSON(http.StatusOK, addresses)
	}
}

// Crear una dirección
func CreateAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input Address
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Si es la primera dirección del usuario, marcarla como predeterminada
		var count int64
		db.Model(&Address{}).Where("user_id = ?", input.UserID).Count(&count)
		if count == 0 {
			input.IsDefault = true
		}

		// Si se marca como predeterminada, quitar el flag de las demás
		if input.IsDefault {
			db.Model(&Address{}).Where("user_id = ? AND is_default = ?", input.UserID, true).Update("is_default", false)
		}

		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, input)
	}
}

// Obtener una dirección por ID
func GetAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var address Address
		if err := db.First(&address, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
			return
		}

		c.JSON(http.StatusOK, address)
	}
}

// Actualizar una dirección
func UpdateAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var address Address
		if err := db.First(&address, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
			return
		}

		var input Address
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Si se marca como predeterminada, quitar el flag de las demás direcciones del mismo usuario
		if input.IsDefault && !address.IsDefault {
			db.Model(&Address{}).Where("user_id = ? AND is_default = ? AND id != ?", address.UserID, true, address.ID).Update("is_default", false)
		}

		if err := db.Model(&address).Updates(input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, address)
	}
}

// Marcar una dirección como predeterminada
func SetDefaultAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var address Address
		if err := db.First(&address, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
			return
		}

		// Quitar el flag de las demás direcciones del usuario
		db.Model(&Address{}).Where("user_id = ? AND is_default = ?", address.UserID, true).Update("is_default", false)

		// Marcar esta como predeterminada
		address.IsDefault = true
		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, address)
	}
}

// Eliminar una dirección
func DeleteAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		idInt, _ := strconv.Atoi(id)

		var address Address
		if err := db.First(&address, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dirección no encontrada"})
			return
		}

		userID := address.UserID
		wasDefault := address.IsDefault

		if err := db.Delete(&address, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Si era la predeterminada, marcar otra como predeterminada
		if wasDefault {
			var newDefault Address
			if err := db.Where("user_id = ? AND id != ?", userID, idInt).First(&newDefault).Error; err == nil {
				newDefault.IsDefault = true
				db.Save(&newDefault)
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Dirección eliminada"})
	}
}
