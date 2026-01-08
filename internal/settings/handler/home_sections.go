package handler

import (
	"net/http"
	"strconv"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	settings "go-modaMayor/internal/settings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /public/home_sections
func GetPublicHomeSections(c *gin.Context) {
	// Return grouped sections: { section: string, items: []Product }
	// Ahora lee configuración desde home_section_configs para determinar qué mostrar

	// Obtener configuraciones activas ordenadas
	var configs []settings.HomeSectionConfig
	if err := config.DB.Where("enabled = ?", true).Order("display_order ASC").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make(map[string][]product.Product)

	// Procesar cada sección habilitada según su configuración
	for _, cfg := range configs {
		sectionKey := cfg.SectionKey
		limit := cfg.LimitProducts
		mode := cfg.ShowMode

		// MODO MANUAL: productos agregados manualmente en la sección
		if mode == "manual" || mode == "both" {
			var entries []settings.HomeSectionEntry
			if err := config.DB.Where("section = ? AND active = ?", sectionKey, true).
				Order("\"order\" asc").Find(&entries).Error; err == nil {
				for _, e := range entries {
					var p product.Product
					if err := config.DB.First(&p, e.ProductID).Error; err == nil {
						resp[sectionKey] = append(resp[sectionKey], p)
					}
				}
			}
		}

		// MODO AUTOMÁTICO: poblar basándose en tags de productos
		if mode == "auto" || mode == "both" {
			needed := limit - len(resp[sectionKey])
			if needed <= 0 {
				continue
			}

			switch sectionKey {
			case "new_arrivals":
				var products []product.Product
				if err := config.DB.Where("is_new_arrival = ?", true).
					Order("created_at DESC").Limit(needed).Find(&products).Error; err == nil {
					resp[sectionKey] = append(resp[sectionKey], products...)
				}

			case "featured":
				var products []product.Product
				if err := config.DB.Where("is_featured = ?", true).
					Order("created_at DESC").Limit(needed).Find(&products).Error; err == nil {
					resp[sectionKey] = append(resp[sectionKey], products...)
				}

			case "offers":
				var products []product.Product
				if err := config.DB.Where("is_offer = ?", true).
					Order("created_at DESC").Limit(needed).Find(&products).Error; err == nil {
					resp[sectionKey] = append(resp[sectionKey], products...)
				}

			case "trending":
				var products []product.Product
				if err := config.DB.Where("is_trending = ?", true).
					Order("created_at DESC").Limit(needed).Find(&products).Error; err == nil {
					resp[sectionKey] = append(resp[sectionKey], products...)
				}

			case "bestsellers":
				// Obtener IDs de bestsellers del snapshot más reciente
				type BestsellerSnapshot struct {
					ID          uint   `gorm:"primaryKey"`
					ProductID   uint   `json:"product_id"`
					TotalOrders int    `json:"total_orders"`
					SnapshotAt  string `json:"snapshot_at"`
				}
				var snapshots []BestsellerSnapshot
				if err := config.DB.Table("bestseller_snapshots").
					Order("snapshot_at DESC, total_orders DESC").
					Limit(needed).Find(&snapshots).Error; err == nil {
					for _, snap := range snapshots {
						var p product.Product
						if err := config.DB.First(&p, snap.ProductID).Error; err == nil {
							resp[sectionKey] = append(resp[sectionKey], p)
						}
					}
				}
			}
		}

		// Aplicar límite final a esta sección
		if len(resp[sectionKey]) > limit {
			resp[sectionKey] = resp[sectionKey][:limit]
		}
	}

	c.JSON(http.StatusOK, resp)
}

// GET /settings/home_sections - admin list
func ListHomeSections(c *gin.Context) {
	var entries []settings.HomeSectionEntry
	if err := config.DB.Order("section asc, \"order\" asc").Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entries)
}

// POST /settings/home_sections - create
func CreateHomeSection(c *gin.Context) {
	section := c.PostForm("section")
	productIDStr := c.PostForm("product_id")
	orderStr := c.PostForm("order")
	activeStr := c.PostForm("active")
	if section == "" || productIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "section and product_id are required"})
		return
	}
	pid, _ := strconv.Atoi(productIDStr)
	order := 0
	if orderStr != "" {
		if v, err := strconv.Atoi(orderStr); err == nil {
			order = v
		}
	}
	active := false
	if activeStr == "1" || activeStr == "true" {
		active = true
	}
	e := settings.HomeSectionEntry{Section: section, ProductID: uint(pid), Order: order, Active: active}
	if err := config.DB.Create(&e).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

// PUT /settings/home_sections/:id
func UpdateHomeSection(c *gin.Context) {
	id := c.Param("id")
	var e settings.HomeSectionEntry
	if err := config.DB.First(&e, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
		return
	}
	if section := c.PostForm("section"); section != "" {
		e.Section = section
	}
	if productIDStr := c.PostForm("product_id"); productIDStr != "" {
		if v, err := strconv.Atoi(productIDStr); err == nil {
			e.ProductID = uint(v)
		}
	}
	if orderStr := c.PostForm("order"); orderStr != "" {
		if v, err := strconv.Atoi(orderStr); err == nil {
			e.Order = v
		}
	}
	if activeStr := c.PostForm("active"); activeStr != "" {
		if activeStr == "1" || activeStr == "true" {
			e.Active = true
		} else {
			e.Active = false
		}
	}
	if err := config.DB.Save(&e).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, e)
}

// DELETE /settings/home_sections/:id
func DeleteHomeSection(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&settings.HomeSectionEntry{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": id})
}

// PUT /settings/home_sections/reorder
func ReorderHomeSections(c *gin.Context) {
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
			if err := tx.Model(&settings.HomeSectionEntry{}).Where("id = ?", p.ID).Update("\"order\"", p.Order).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var entries []settings.HomeSectionEntry
	if err := config.DB.Order("section asc, \"order\" asc").Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entries)
}

// POST /settings/home_sections/sync-from-tags - Sincronizar automáticamente desde tags
func SyncHomeSectionsFromTags(c *gin.Context) {
	section := c.Query("section") // opcional: sincronizar solo una sección
	limit := 12
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
			limit = v
		}
	}

	sectionsToSync := map[string]string{
		"new_arrivals": "is_new_arrival",
		"featured":     "is_featured",
		"offers":       "is_offer",
		"trending":     "is_trending",
	}

	// Si se especifica una sección, solo sincronizar esa
	if section != "" {
		if _, ok := sectionsToSync[section]; ok {
			sectionsToSync = map[string]string{section: sectionsToSync[section]}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sección inválida"})
			return
		}
	}

	synced := make(map[string]int)

	for sectionKey, tagField := range sectionsToSync {
		// Obtener productos con el tag correspondiente
		var products []product.Product
		query := config.DB.Limit(limit)

		switch tagField {
		case "is_new_arrival":
			query = query.Where("is_new_arrival = ?", true)
		case "is_featured":
			query = query.Where("is_featured = ?", true)
		case "is_offer":
			query = query.Where("is_offer = ?", true)
		case "is_trending":
			query = query.Where("is_trending = ?", true)
		}

		if err := query.Order("created_at DESC").Find(&products).Error; err != nil {
			continue
		}

		// Eliminar entradas existentes de esta sección (para evitar duplicados)
		config.DB.Where("section = ?", sectionKey).Delete(&settings.HomeSectionEntry{})

		// Crear nuevas entradas
		count := 0
		for i, p := range products {
			entry := settings.HomeSectionEntry{
				Section:   sectionKey,
				ProductID: p.ID,
				Order:     i,
				Active:    true,
			}
			if err := config.DB.Create(&entry).Error; err == nil {
				count++
			}
		}
		synced[sectionKey] = count
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sincronización completada",
		"synced":  synced,
	})
}
