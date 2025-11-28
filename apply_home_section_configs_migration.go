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
		// 1. Crear tabla home_section_configs
		`CREATE TABLE IF NOT EXISTS home_section_configs (
			id SERIAL PRIMARY KEY,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP,
			section_key VARCHAR(100) NOT NULL UNIQUE,
			title VARCHAR(255) NOT NULL,
			enabled BOOLEAN DEFAULT true,
			display_order INT DEFAULT 0,
			limit_products INT DEFAULT 12,
			show_mode VARCHAR(20) DEFAULT 'both'
		)`,

		// 2. Insertar configuraciones predeterminadas
		`INSERT INTO home_section_configs (section_key, title, enabled, display_order, limit_products, show_mode) 
		VALUES
			('new_arrivals', 'Nuevos Ingresos', true, 1, 12, 'both'),
			('featured', 'Destacados', true, 2, 12, 'both'),
			('offers', 'En Oferta', true, 3, 12, 'both'),
			('trending', 'Tendencias', true, 4, 12, 'both'),
			('bestsellers', 'Más Vendidos', true, 5, 12, 'auto')
		ON CONFLICT (section_key) DO NOTHING`,

		// 3. Crear índices
		`CREATE INDEX IF NOT EXISTS idx_home_section_configs_section_key ON home_section_configs(section_key)`,
		`CREATE INDEX IF NOT EXISTS idx_home_section_configs_display_order ON home_section_configs(display_order)`,
		`CREATE INDEX IF NOT EXISTS idx_home_section_configs_enabled ON home_section_configs(enabled) WHERE enabled = true`,
		`CREATE INDEX IF NOT EXISTS idx_home_section_configs_deleted_at ON home_section_configs(deleted_at)`,
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

	fmt.Printf("\n🎉 Migración home_section_configs completada. %d operaciones ejecutadas exitosamente.\n", executed)
}
