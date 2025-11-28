package order

import (
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Reporte de ventas por período
func SalesReport(c *gin.Context) {
	start := c.Query("start")
	end := c.Query("end")
	var startDate, endDate time.Time
	var err error
	if start != "" {
		startDate, err = time.Parse("2006-01-02", start)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha de inicio inválida"})
			return
		}
	}
	if end != "" {
		endDate, err = time.Parse("2006-01-02", end)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha de fin inválida"})
			return
		}
	}
	var total float64
	var count int64
	query := config.DB.Model(&Order{})
	if !startDate.IsZero() {
		query = query.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("created_at <= ?", endDate)
	}
	query.Count(&count)
	query.Select("SUM(total)").Scan(&total)
	c.JSON(http.StatusOK, gin.H{"total_ventas": total, "cantidad_pedidos": count})
}

// Productos más vendidos
// TopProductsReport returns top sold products aggregated from order_items.
// Supports optional query params: from=YYYY-MM-DD, to=YYYY-MM-DD, limit=N
func TopProductsReport(c *gin.Context) {
	fromStr := c.Query("from")
	toStr := c.Query("to")
	limitStr := c.DefaultQuery("limit", "10")

	var from time.Time
	var to time.Time
	var err error
	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid from date, expected YYYY-MM-DD"})
			return
		}
	}
	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid to date, expected YYYY-MM-DD"})
			return
		}
		to = to.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	}
	limit := 10
	if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
		limit = v
	}

	type aggRow struct {
		ProductID    uint    `json:"product_id"`
		QuantitySold int64   `json:"quantity_sold"`
		TotalRevenue float64 `json:"total_revenue"`
	}
	var rows []aggRow
	q := config.DB.Table("order_items").Select("product_id, SUM(quantity) as quantity_sold, SUM(quantity * price) as total_revenue")
	if !from.IsZero() && !to.IsZero() {
		q = q.Where("created_at BETWEEN ? AND ?", from, to)
	} else if !from.IsZero() {
		q = q.Where("created_at >= ?", from)
	} else if !to.IsZero() {
		q = q.Where("created_at <= ?", to)
	}
	if err := q.Group("product_id").Order("quantity_sold desc").Limit(limit).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
	prodMap := make(map[uint]product.Product)
	for _, p := range products {
		prodMap[p.ID] = p
	}

	type respRow struct {
		Product      product.Product `json:"product"`
		QuantitySold int64           `json:"quantity_sold"`
		TotalRevenue float64         `json:"total_revenue"`
	}
	resp := make([]respRow, 0, len(rows))
	for _, r := range rows {
		p, ok := prodMap[r.ProductID]
		if !ok {
			continue
		}
		resp = append(resp, respRow{Product: p, QuantitySold: r.QuantitySold, TotalRevenue: r.TotalRevenue})
	}
	c.JSON(http.StatusOK, gin.H{"from": from.Format(time.RFC3339), "to": to.Format(time.RFC3339), "limit": limit, "data": resp})
}
