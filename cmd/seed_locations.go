//go:build ignore

package main

import (
	"log"
	"os"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"
)

func main() {
	// This tool uses the same DB connection logic as the main app.
	// Ensure your environment (.env or env vars) provides DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSLMODE.
	// Usage: go run cmd/seed_locations.go

	_ = os.Setenv("AUTO_MIGRATE", "false") // prevent any accidental automigration
	db := config.ConnectDatabase()

	variantIDs := []uint{102, 26, 111}

	for _, vid := range variantIDs {
		var pv product.ProductVariant
		if err := db.First(&pv, vid).Error; err != nil {
			log.Printf("variant %d not found: %v", vid, err)
			continue
		}

		locations := []product.LocationStock{
			{ProductID: pv.ProductID, VariantID: &pv.ID, Location: "deposito", Stock: 10, Reserved: 0},
			{ProductID: pv.ProductID, VariantID: &pv.ID, Location: "mendoza", Stock: 5, Reserved: 0},
		}

		for _, ls := range locations {
			if err := db.Create(&ls).Error; err != nil {
				log.Printf("error creating location stock %+v: %v", ls, err)
			} else {
				log.Printf("created location stock for variant %d at %s", pv.ID, ls.Location)
			}
		}
	}

	log.Println("seeder finished")
}
