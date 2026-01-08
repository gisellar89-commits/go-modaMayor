package handler

import (
	"net/http"
	"path/filepath"
	"strconv"

	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

// GET /public/banners - public list of active banners ordered by 'order'
func GetPublicBanners(c *gin.Context) {
	var banners []settings.Banner
	if err := config.DB.Where("active = ?", true).Order("\"order\" asc").Find(&banners).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, banners)
}

// GET /settings/banners - admin list all
func ListBanners(c *gin.Context) {
	var banners []settings.Banner
	if err := config.DB.Order("\"order\" asc").Find(&banners).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, banners)
}

// POST /settings/banners - create new banner (multipart form: image file field 'image', optional alt_text, link, active, order)
func CreateBanner(c *gin.Context) {
	// parse fields
	alt := c.PostForm("alt_text")
	link := c.PostForm("link")
	activeStr := c.PostForm("active")
	orderStr := c.PostForm("order")
	active := false
	if activeStr == "true" || activeStr == "1" {
		active = true
	}
	order := 0
	if orderStr != "" {
		if v, err := strconv.Atoi(orderStr); err == nil {
			order = v
		}
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}
	// Save file to uploads with unique name
	filename := "uploads/banner_" + filepath.Base(file.Filename)
	if err := c.SaveUploadedFile(file, filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	b := settings.Banner{ImageURL: "/" + filename, AltText: alt, Link: link, Order: order, Active: active}
	if err := config.DB.Create(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, b)
}

// PUT /settings/banners/:id - update banner fields (JSON body) or multipart if updating image
func UpdateBanner(c *gin.Context) {
	id := c.Param("id")
	var b settings.Banner
	if err := config.DB.First(&b, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner not found"})
		return
	}

	// If multipart with image
	file, _ := c.FormFile("image")
	if file != nil {
		filename := "uploads/banner_" + filepath.Base(file.Filename)
		if err := c.SaveUploadedFile(file, filename); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		b.ImageURL = "/" + filename
	}

	// parse optional form fields
	if alt := c.PostForm("alt_text"); alt != "" {
		b.AltText = alt
	}
	if link := c.PostForm("link"); link != "" {
		b.Link = link
	}
	if activeStr := c.PostForm("active"); activeStr != "" {
		if activeStr == "1" || activeStr == "true" {
			b.Active = true
		} else {
			b.Active = false
		}
	}
	if orderStr := c.PostForm("order"); orderStr != "" {
		if v, err := strconv.Atoi(orderStr); err == nil {
			b.Order = v
		}
	}

	if err := config.DB.Save(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

// DELETE /settings/banners/:id
func DeleteBanner(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&settings.Banner{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": id})
}

// PUT /settings/banners/reorder - bulk update order
func ReorderBanners(c *gin.Context) {
	var payload []struct {
		ID    uint `json:"id"`
		Order int  `json:"order"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		for _, p := range payload {
			if err := tx.Model(&settings.Banner{}).Where("id = ?", p.ID).Update("\"order\"", p.Order).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// return updated list
	var banners []settings.Banner
	if err := config.DB.Order("\"order\" asc").Find(&banners).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, banners)
}
