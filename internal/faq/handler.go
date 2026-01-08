package faq

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Listar todas las FAQs (admin/encargado ven todas, público solo activas)
func ListFAQs(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var faqs []FAQ
		query := db.Order(`"order" ASC, created_at DESC`)

		// Si no es admin/encargado, solo mostrar activas
		role, _ := c.Get("role")
		if role != "admin" && role != "encargado" {
			query = query.Where("active = ?", true)
		}

		if err := query.Find(&faqs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if faqs == nil {
			faqs = []FAQ{}
		}

		c.JSON(http.StatusOK, faqs)
	}
}

// Listar FAQs públicas (sin autenticación)
func ListPublicFAQs(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var faqs []FAQ
		if err := db.Where("active = ?", true).Order(`"order" ASC, created_at DESC`).Find(&faqs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if faqs == nil {
			faqs = []FAQ{}
		}

		c.JSON(http.StatusOK, faqs)
	}
}

// Obtener una FAQ por ID
func GetFAQ(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var faq FAQ
		if err := db.First(&faq, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "FAQ no encontrada"})
			return
		}

		c.JSON(http.StatusOK, faq)
	}
}

// Crear una FAQ (admin/encargado)
func CreateFAQ(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input FAQ
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Question == "" || input.Answer == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Pregunta y respuesta son obligatorias"})
			return
		}

		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, input)
	}
}

// Actualizar una FAQ (admin/encargado)
func UpdateFAQ(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var faq FAQ
		if err := db.First(&faq, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "FAQ no encontrada"})
			return
		}

		var input FAQ
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Model(&faq).Updates(input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, faq)
	}
}

// Eliminar una FAQ (admin/encargado)
func DeleteFAQ(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var faq FAQ
		if err := db.First(&faq, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "FAQ no encontrada"})
			return
		}

		if err := db.Delete(&faq).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "FAQ eliminada"})
	}
}

// Actualizar orden de FAQs (admin/encargado)
func UpdateFAQOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			FAQs []struct {
				ID    uint `json:"id"`
				Order int  `json:"order"`
			} `json:"faqs"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Actualizar el orden de cada FAQ
		for _, item := range input.FAQs {
			db.Model(&FAQ{}).Where("id = ?", item.ID).Update(`"order"`, item.Order)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Orden actualizado"})
	}
}
