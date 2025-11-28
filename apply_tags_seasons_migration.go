package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}

	// Ejecutar statements individuales
	statements := []string{
		// 1. Crear tabla seasons
		`CREATE TABLE IF NOT EXISTS seasons (
			id SERIAL PRIMARY KEY,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP,
			code VARCHAR(20) NOT NULL UNIQUE,
			name VARCHAR(100) NOT NULL,
			year INT NOT NULL,
			active BOOLEAN DEFAULT true
		)`,

		// 2. Agregar campos de tags a products
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false`,

		// 3. Agregar columna season_id
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS season_id INT`,

		// 4. Insertar temporadas predeterminadas
		`INSERT INTO seasons (code, name, year, active) VALUES
			('SS25', 'Primavera/Verano 2025', 2025, true),
			('AW25', 'Otoño/Invierno 2025', 2025, true),
			('SS26', 'Primavera/Verano 2026', 2026, true),
			('AW26', 'Otoño/Invierno 2026', 2026, false)
		ON CONFLICT (code) DO NOTHING`,

		// 5. Crear índices
		`CREATE INDEX IF NOT EXISTS idx_seasons_code ON seasons(code)`,
		`CREATE INDEX IF NOT EXISTS idx_seasons_deleted_at ON seasons(deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_products_season_id ON products(season_id)`,
	}

	executed := 0
	for i, stmt := range statements {
		fmt.Printf("\n[%d/%d] Ejecutando...\n", i+1, len(statements))

		res := db.Exec(stmt)
		if res.Error != nil {
			fmt.Printf("❌ ERROR: %v\n", res.Error)
			if len(stmt) > 150 {
				fmt.Printf("SQL: %s...\n", stmt[:150])
			} else {
				fmt.Printf("SQL: %s\n", stmt)
			}
		} else {
			fmt.Printf("✅ Ejecutado exitosamente (rows affected: %d)\n", res.RowsAffected)
			executed++
		}
	}

	// Crear índices parciales para tags (PostgreSQL)
	fmt.Println("\n🔍 Creando índices parciales para tags...")
	indexStatements := []string{
		`CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = true`,
		`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true`,
		`CREATE INDEX IF NOT EXISTS idx_products_is_offer ON products(is_offer) WHERE is_offer = true`,
		`CREATE INDEX IF NOT EXISTS idx_products_is_trending ON products(is_trending) WHERE is_trending = true`,
	}

	for _, idx := range indexStatements {
		if err := db.Exec(idx).Error; err != nil {
			fmt.Printf("⚠️  %v\n", err)
		} else {
			fmt.Println("✅ Índice creado")
			executed++
		}
	}

	// Agregar FK (PostgreSQL no soporta IF NOT EXISTS en ADD CONSTRAINT)
	fmt.Println("\n🔗 Agregando constraint de FK...")
	fkSQL := `DO $$
	BEGIN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_name = 'fk_products_season'
		) THEN
			ALTER TABLE products ADD CONSTRAINT fk_products_season 
			FOREIGN KEY (season_id) REFERENCES seasons(id);
		END IF;
	END $$`

	if err := db.Exec(fkSQL).Error; err != nil {
		fmt.Printf("⚠️  Constraint FK: %v\n", err)
	} else {
		fmt.Println("✅ Constraint FK agregada")
		executed++
	}

	fmt.Printf("\n🎉 Migración completada. %d operaciones ejecutadas exitosamente.\n", executed)
}
