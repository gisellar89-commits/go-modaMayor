package product

import (
	"net/http"

	"go-modaMayor/config"

	"github.com/gin-gonic/gin"
)

// --- Suppliers CRUD ---
func ListSuppliers(c *gin.Context) {
	var sup []Supplier
	if err := config.DB.Find(&sup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sup)
}

type CreateSupplierInput struct {
	Name    string `json:"name" binding:"required,min=2"`
	Code    string `json:"code"`
	Contact string `json:"contact"`
	Active  *bool  `json:"active"`
}

func CreateSupplier(c *gin.Context) {
	var input CreateSupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s := Supplier{Name: input.Name, Code: input.Code, Contact: input.Contact}
	if input.Active != nil {
		s.Active = *input.Active
	}
	if err := config.DB.Create(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func UpdateSupplier(c *gin.Context) {
	id := c.Param("id")
	var s Supplier
	if err := config.DB.First(&s, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Proveedor no encontrado"})
		return
	}
	var input CreateSupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Code != "" {
		updates["code"] = input.Code
	}
	if input.Contact != "" {
		updates["contact"] = input.Contact
	}
	if input.Active != nil {
		updates["active"] = *input.Active
	}
	if err := config.DB.Model(&s).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

func DeleteSupplier(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&Supplier{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Proveedor eliminado"})
}

// --- SizeTypes and SizeValues CRUD ---
func ListSizeTypes(c *gin.Context) {
	var types []SizeType
	if err := config.DB.Preload("Values").Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, types)
}

type CreateSizeTypeInput struct {
	Key         string `json:"key" binding:"required"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsSingleton *bool  `json:"is_singleton"`
}

func CreateSizeType(c *gin.Context) {
	var input CreateSizeTypeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	st := SizeType{Key: input.Key, Name: input.Name, Description: input.Description}
	if input.IsSingleton != nil {
		st.IsSingleton = *input.IsSingleton
	}
	if err := config.DB.Create(&st).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, st)
}

func UpdateSizeType(c *gin.Context) {
	id := c.Param("id")
	var st SizeType
	if err := config.DB.First(&st, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SizeType no encontrado"})
		return
	}
	var input CreateSizeTypeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if input.Key != "" {
		updates["key"] = input.Key
	}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Description != "" {
		updates["description"] = input.Description
	}
	if input.IsSingleton != nil {
		updates["is_singleton"] = *input.IsSingleton
	}
	if err := config.DB.Model(&st).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, st)
}

func DeleteSizeType(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&SizeType{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "SizeType eliminado"})
}

// SizeValues
type CreateSizeValueInput struct {
	SizeTypeID uint   `json:"size_type_id" binding:"required"`
	Value      string `json:"value" binding:"required"`
	Ordinal    *int   `json:"ordinal"`
}

func CreateSizeValue(c *gin.Context) {
	var input CreateSizeValueInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	v := SizeValue{SizeTypeID: input.SizeTypeID, Value: input.Value}
	if input.Ordinal != nil {
		v.Ordinal = *input.Ordinal
	}
	if err := config.DB.Create(&v).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, v)
}

func ListSizeValues(c *gin.Context) {
	typeID := c.Query("size_type_id")
	var values []SizeValue
	if typeID != "" {
		if err := config.DB.Where("size_type_id = ?", typeID).Order("ordinal asc").Find(&values).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		if err := config.DB.Order("ordinal asc").Find(&values).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, values)
}

func DeleteSizeValue(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&SizeValue{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "SizeValue eliminado"})
}

func UpdateSizeValue(c *gin.Context) {
	id := c.Param("id")
	var sv SizeValue
	if err := config.DB.First(&sv, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SizeValue no encontrado"})
		return
	}
	var input CreateSizeValueInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if input.Value != "" {
		updates["value"] = input.Value
	}
	if input.Ordinal != nil {
		updates["ordinal"] = *input.Ordinal
	}
	if input.SizeTypeID > 0 {
		updates["size_type_id"] = input.SizeTypeID
	}
	if err := config.DB.Model(&sv).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sv)
}

// --- Colors CRUD ---
func ListColors(c *gin.Context) {
	var cols []Color
	if err := config.DB.Find(&cols).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cols)
}

type CreateColorInput struct {
	Key    string `json:"key" binding:"required"`
	Name   string `json:"name"`
	Hex    string `json:"hex"`
	Active *bool  `json:"active"`
}

func CreateColor(c *gin.Context) {
	var input CreateColorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	col := Color{Key: input.Key, Name: input.Name, Hex: input.Hex}
	if input.Active != nil {
		col.Active = *input.Active
	}
	if err := config.DB.Create(&col).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, col)
}

func UpdateColor(c *gin.Context) {
	id := c.Param("id")
	var col Color
	if err := config.DB.First(&col, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Color no encontrado"})
		return
	}
	var input CreateColorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if input.Key != "" {
		updates["key"] = input.Key
	}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Hex != "" {
		updates["hex"] = input.Hex
	}
	if input.Active != nil {
		updates["active"] = *input.Active
	}
	if err := config.DB.Model(&col).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, col)
}

func DeleteColor(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&Color{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Color eliminado"})
}
