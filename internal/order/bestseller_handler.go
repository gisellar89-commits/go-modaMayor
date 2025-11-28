package order

import (
	"net/http"
	"strconv"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"

	"github.com/gin-gonic/gin"
)

// GET /public/bestsellers?limit=N
func GetLatestBestsellers(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit := 10
	if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
		limit = v
	}

	// Find latest snapshot time
	var last BestsellerSnapshot
	if err := config.DB.Order("snapshot_at desc").First(&last).Error; err != nil {
		// no snapshots yet: return empty
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	snapshotAt := last.SnapshotAt

	var snaps []BestsellerSnapshot
	if err := config.DB.Where("snapshot_at = ?", snapshotAt).Order("rank asc").Limit(limit).Find(&snaps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ids := make([]uint, 0, len(snaps))
	for _, s := range snaps {
		ids = append(ids, s.ProductID)
	}
	var products []product.Product
	if len(ids) > 0 {
		if err := config.DB.Where("id IN ?", ids).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	prodMap := make(map[uint]product.Product)
	for _, p := range products {
		prodMap[p.ID] = p
	}

	type respRow struct {
		Product      product.Product `json:"product"`
		QuantitySold int64           `json:"quantity_sold"`
		TotalRevenue float64         `json:"total_revenue"`
		Rank         int             `json:"rank"`
	}
	resp := make([]respRow, 0, len(snaps))
	for _, s := range snaps {
		p, ok := prodMap[s.ProductID]
		if !ok {
			continue
		}
		resp = append(resp, respRow{Product: p, QuantitySold: s.QuantitySold, TotalRevenue: s.TotalRevenue, Rank: s.Rank})
	}
	c.JSON(http.StatusOK, gin.H{"snapshot_at": snapshotAt, "data": resp})
}
