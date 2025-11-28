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

// GET /public/videos - public list of active videos ordered by 'order'
func GetPublicVideos(c *gin.Context) {
	var videos []settings.Video
	if err := config.DB.Where("active = ?", true).Order("\"order\" asc").Find(&videos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, videos)
}

// GET /settings/videos - admin list all
func ListVideos(c *gin.Context) {
	var videos []settings.Video
	if err := config.DB.Order("\"order\" asc").Find(&videos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, videos)
}

// POST /settings/videos - create new video (multipart form: 'video' file, optional 'thumbnail', title, description, active, order)
func CreateVideo(c *gin.Context) {
	title := c.PostForm("title")
	desc := c.PostForm("description")
	activeStr := c.PostForm("active")
	orderStr := c.PostForm("order")
	external := c.PostForm("external_url")
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

	// If external URL is provided, use it instead of requiring an uploaded file
	filename := ""
	if external == "" {
		file, err := c.FormFile("video")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No video file provided or external_url missing"})
			return
		}
		filename = "uploads/video_" + filepath.Base(file.Filename)
		if err := c.SaveUploadedFile(file, filename); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// optional thumbnail
	thumbFile, _ := c.FormFile("thumbnail")
	thumbName := ""
	if thumbFile != nil {
		tn := "uploads/video_thumb_" + filepath.Base(thumbFile.Filename)
		if err := c.SaveUploadedFile(thumbFile, tn); err == nil {
			thumbName = "/" + tn
		}
	}

	v := settings.Video{Title: title, Description: desc, VideoURL: "", ExternalURL: external, ThumbnailURL: thumbName, Order: order, Active: active}
	if filename != "" {
		v.VideoURL = "/" + filename
	}
	if err := config.DB.Create(&v).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, v)
}

// PUT /settings/videos/:id - update video fields (multipart if replacing files)
func UpdateVideo(c *gin.Context) {
	id := c.Param("id")
	var v settings.Video
	if err := config.DB.First(&v, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}
	// if multipart with video or external_url
	external := c.PostForm("external_url")
	file, _ := c.FormFile("video")
	if file != nil {
		filename := "uploads/video_" + filepath.Base(file.Filename)
		if err := c.SaveUploadedFile(file, filename); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		v.VideoURL = "/" + filename
		// clear external url if a file was uploaded
		v.ExternalURL = ""
	} else if external != "" {
		// use external url and clear local video path
		v.ExternalURL = external
		v.VideoURL = ""
	}
	// thumbnail
	thumbFile, _ := c.FormFile("thumbnail")
	if thumbFile != nil {
		tn := "uploads/video_thumb_" + filepath.Base(thumbFile.Filename)
		if err := c.SaveUploadedFile(thumbFile, tn); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		v.ThumbnailURL = "/" + tn
	}

	if title := c.PostForm("title"); title != "" {
		v.Title = title
	}
	if desc := c.PostForm("description"); desc != "" {
		v.Description = desc
	}
	if activeStr := c.PostForm("active"); activeStr != "" {
		if activeStr == "1" || activeStr == "true" {
			v.Active = true
		} else {
			v.Active = false
		}
	}
	if orderStr := c.PostForm("order"); orderStr != "" {
		if vv, err := strconv.Atoi(orderStr); err == nil {
			v.Order = vv
		}
	}

	if err := config.DB.Save(&v).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, v)
}

// DELETE /settings/videos/:id
func DeleteVideo(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&settings.Video{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": id})
}

// PUT /settings/videos/reorder - bulk update order
func ReorderVideos(c *gin.Context) {
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
			if err := tx.Model(&settings.Video{}).Where("id = ?", p.ID).Update("\"order\"", p.Order).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var videos []settings.Video
	if err := config.DB.Order("\"order\" asc").Find(&videos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, videos)
}
