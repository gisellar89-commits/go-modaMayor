package kit

import (
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateKit creates a new kit with items
func CreateKit(c *gin.Context) {
	var payload Kit
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database not initialized"})
		return
	}

	// validate items: product existence, optional variant and fill unit prices
	var sum float64
	for i := range payload.Items {
		it := &payload.Items[i]
		var p product.Product
		if err := db.First(&p, it.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product not found", "product_id": it.ProductID})
			return
		}
		// default unit price to product wholesale if not provided
		if it.UnitPrice == 0 {
			it.UnitPrice = p.WholesalePrice
		}
		// if variant specified, verify it belongs to product
		if it.VariantID != nil {
			var v product.ProductVariant
			if err := db.First(&v, *it.VariantID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "variant not found", "variant_id": it.VariantID})
				return
			}
			if v.ProductID != p.ID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "variant does not belong to product", "variant_id": it.VariantID})
				return
			}
			// if unit price still zero, could consult variant price (not present) so keep product price
		}
		qty := it.Quantity
		if qty <= 0 {
			qty = 1
			it.Quantity = 1
		}
		sum += it.UnitPrice * float64(qty)
	}

	// create kit
	if err := db.Create(&payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// attach computed sum
	payload.SumIndividuals = sum
	c.JSON(http.StatusCreated, payload)
}

// ListKits returns all kits
func ListKits(c *gin.Context) {
	db := config.DB
	var kits []Kit
	if err := db.Preload("Items").Find(&kits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// compute sum_individuals for each kit
	for ki := range kits {
		var sum float64
		for _, it := range kits[ki].Items {
			sum += it.UnitPrice * float64(it.Quantity)
		}
		kits[ki].SumIndividuals = sum
	}
	c.JSON(http.StatusOK, kits)
}

// GetKit returns a kit by id
func GetKit(c *gin.Context) {
	id := c.Param("id")
	db := config.DB
	var k Kit
	if err := db.Preload("Items").First(&k, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "kit not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var sum float64
	for _, it := range k.Items {
		sum += it.UnitPrice * float64(it.Quantity)
	}
	k.SumIndividuals = sum
	c.JSON(http.StatusOK, k)
}

// UpdateKit updates kit metadata and items (replace items)
func UpdateKit(c *gin.Context) {
	id := c.Param("id")
	var payload Kit
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	var existing Kit
	if err := db.Preload("Items").First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "kit not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update simple fields
	existing.Name = payload.Name
	existing.Description = payload.Description
	existing.Price = payload.Price

	tx := db.Begin()
	if err := tx.Save(&existing).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// validate and replace items: delete old items and create new ones
	if err := tx.Where("kit_id = ?", existing.ID).Delete(&KitItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var sum float64
	for i := range payload.Items {
		it := &payload.Items[i]
		it.KitID = existing.ID
		// validate product
		var p product.Product
		if err := tx.First(&p, it.ProductID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "product not found", "product_id": it.ProductID})
			return
		}
		if it.UnitPrice == 0 {
			it.UnitPrice = p.WholesalePrice
		}
		if it.VariantID != nil {
			var v product.ProductVariant
			if err := tx.First(&v, *it.VariantID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "variant not found", "variant_id": it.VariantID})
				return
			}
			if v.ProductID != p.ID {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "variant does not belong to product", "variant_id": it.VariantID})
				return
			}
		}
		if it.Quantity <= 0 {
			it.Quantity = 1
		}
		sum += it.UnitPrice * float64(it.Quantity)
	}
	if len(payload.Items) > 0 {
		if err := tx.Create(&payload.Items).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()
	// return updated kit
	db.Preload("Items").First(&existing, existing.ID)
	// compute sum
	var sum2 float64
	for _, it := range existing.Items {
		sum2 += it.UnitPrice * float64(it.Quantity)
	}
	existing.SumIndividuals = sum2
	c.JSON(http.StatusOK, existing)
}

// DeleteKit removes a kit
func DeleteKit(c *gin.Context) {
	id := c.Param("id")
	db := config.DB
	var k Kit
	if err := db.First(&k, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "kit not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx := db.Begin()
	if err := tx.Where("kit_id = ?", k.ID).Delete(&KitItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := tx.Delete(&k).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}
