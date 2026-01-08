package order

import (
	"time"

	"go-modaMayor/config"

	"gorm.io/gorm"
)

// RunBestsellerSnapshotOnce executes the aggregation and stores a snapshot immediately.
func RunBestsellerSnapshotOnce(db *gorm.DB) error {
	// Consider recent window (e.g., last 90 days) for relevancy
	since := time.Now().AddDate(0, 0, -90)

	type aggRow struct {
		ProductID    uint
		QuantitySold int64
		TotalRevenue float64
	}
	var rows []aggRow
	q := db.Table("order_items").Select("product_id, SUM(quantity) as quantity_sold, SUM(quantity * price) as total_revenue").Where("created_at >= ?", since)
	if err := q.Group("product_id").Order("quantity_sold desc").Limit(200).Scan(&rows).Error; err != nil {
		return err
	}

	if len(rows) == 0 {
		return nil
	}

	snapshotAt := time.Now()
	// Build slice for bulk insert
	inserts := make([]BestsellerSnapshot, 0, len(rows))
	for i, r := range rows {
		inserts = append(inserts, BestsellerSnapshot{
			ProductID:    r.ProductID,
			QuantitySold: r.QuantitySold,
			TotalRevenue: r.TotalRevenue,
			Rank:         i + 1,
			SnapshotAt:   snapshotAt,
		})
	}

	// Insert in transaction
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&inserts).Error; err != nil {
			return err
		}
		return nil
	})
}

// StartBestsellerSnapshotter launches a background goroutine that refreshes snapshot periodically.
// interval: how often to run (e.g., time.Hour)
func StartBestsellerSnapshotter(interval time.Duration) {
	go func() {
		// Run once on start
		_ = RunBestsellerSnapshotOnce(config.DB)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			<-ticker.C
			_ = RunBestsellerSnapshotOnce(config.DB)
		}
	}()
}
