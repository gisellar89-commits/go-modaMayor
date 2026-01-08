package order

import (
	"net/http"
	"strconv"
	"time"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"

	"github.com/gin-gonic/gin"
)

// TopProductsReport returns top sold products aggregated from order_items.
// Query params:
//   - from=YYYY-MM-DD (inclusive)
//   - to=YYYY-MM-DD (inclusive)
//   - limit=N (default 20)
func TopProductsReportLegacy(c *gin.Context) {
	fromStr := c.Query("from")
	toStr := c.Query("to")
	limitStr := c.DefaultQuery("limit", "20")

	var from time.Time
	var to time.Time
	var err error
	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid from date, expected YYYY-MM-DD"})
			return
		}
	} else {
		// default: 30 days ago
		from = time.Now().AddDate(0, 0, -30)
	}
	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid to date, expected YYYY-MM-DD"})
			return
		}
		// include full day
		to = to.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	} else {
		to = time.Now()
	}
	limit := 20
	if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
		limit = v
	}

	// Aggregate order_items
	type aggRow struct {
		ProductID    uint    `json:"product_id"`
		QuantitySold int64   `json:"quantity_sold"`
		TotalRevenue float64 `json:"total_revenue"`
	}
	var rows []aggRow
	// Note: table name is order_items
	if err := config.DB.Table("order_items").Select("product_id, SUM(quantity) as quantity_sold, SUM(quantity * price) as total_revenue").Where("created_at BETWEEN ? AND ?", from, to).Group("product_id").Order("quantity_sold desc").Limit(limit).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch product details for the returned IDs
	ids := make([]uint, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ProductID)
	}
	var products []product.Product
	if len(ids) > 0 {
		if err := config.DB.Where("id IN ?", ids).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Map products by id for quick lookup
	prodMap := make(map[uint]product.Product)
	for _, p := range products {
		prodMap[p.ID] = p
	}

	// Build response preserving order
	type respRow struct {
		Product      product.Product `json:"product"`
		QuantitySold int64           `json:"quantity_sold"`
		TotalRevenue float64         `json:"total_revenue"`
	}
	resp := make([]respRow, 0, len(rows))
	for _, r := range rows {
		p, ok := prodMap[r.ProductID]
		if !ok {
			// skip missing product
			continue
		}
		resp = append(resp, respRow{Product: p, QuantitySold: r.QuantitySold, TotalRevenue: r.TotalRevenue})
	}

	c.JSON(http.StatusOK, gin.H{"from": from.Format(time.RFC3339), "to": to.Format(time.RFC3339), "limit": limit, "data": resp})
}
