package category

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Crear categoría
func CreateCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input Category
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Validar categoría duplicada por nombre
		var existing Category
		if err := db.Where("name = ?", input.Name).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe una categoría con ese nombre"})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, input)
	}
}

// Listar categorías
func ListCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var categories []Category
		if err := db.Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, categories)
	}
}

// Editar categoría
func UpdateCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var category Category
		if err := db.First(&category, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Categoría no encontrada"})
			return
		}
		var input Category
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Model(&category).Updates(input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, category)
	}
}

// Eliminar categoría
func DeleteCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&Category{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Categoría eliminada"})
	}
}

// Crear subcategoría
func CreateSubcategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input Subcategory
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Validar subcategoría duplicada por nombre y categoría
		var existing Subcategory
		if err := db.Where("name = ? AND category_id = ?", input.Name, input.CategoryID).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe una subcategoría con ese nombre en esta categoría"})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, input)
	}
}

// Listar todas las subcategorías
func ListAllSubcategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var subs []Subcategory
		if err := db.Find(&subs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, subs)
	}
}

// Listar subcategorías de una categoría
func ListSubcategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("category_id")
		var subs []Subcategory
		if err := db.Where("category_id = ?", categoryID).Find(&subs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, subs)
	}
}

// Editar subcategoría
func UpdateSubcategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var sub Subcategory
		if err := db.First(&sub, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Subcategoría no encontrada"})
			return
		}
		var input Subcategory
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Model(&sub).Updates(input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, sub)
	}
}

// Eliminar subcategoría
func DeleteSubcategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&Subcategory{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Subcategoría eliminada"})
	}
}
