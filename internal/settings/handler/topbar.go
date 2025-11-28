package handler

import (
	"encoding/json"
	"go-modaMayor/config"
	settings "go-modaMayor/internal/settings"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Public GET /settings/topbar
func GetTopbar(c *gin.Context) {
	var tb settings.Topbar
	if err := config.DB.First(&tb).Error; err != nil {
		// return empty default rather than 404
		c.JSON(http.StatusOK, gin.H{"center_text": "", "social_links": []interface{}{}})
		return
	}
	// social links stored as JSON string, try to unmarshal
	var socials interface{}
	if err := json.Unmarshal([]byte(tb.SocialLinks), &socials); err != nil {
		socials = []interface{}{}
	}
	c.JSON(http.StatusOK, gin.H{"center_text": tb.CenterText, "social_links": socials})
}

// PUT /settings/topbar (admin/encargado)
func UpdateTopbar(c *gin.Context) {
	var input struct {
		CenterText  string      `json:"center_text"`
		SocialLinks interface{} `json:"social_links"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// serialize social links back to JSON string
	b, _ := json.Marshal(input.SocialLinks)

	var tb settings.Topbar
	if err := config.DB.First(&tb).Error; err != nil {
		// create new
		tb = settings.Topbar{CenterText: input.CenterText, SocialLinks: string(b)}
		if err := config.DB.Create(&tb).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, tb)
		return
	}
	tb.CenterText = input.CenterText
	tb.SocialLinks = string(b)
	if err := config.DB.Save(&tb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tb)
}
