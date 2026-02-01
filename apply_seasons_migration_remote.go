package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Este script se puede ejecutar desde tu máquina local
// configurando las variables de entorno de producción

func main() {
	// Cargar .env si existe (pero puedes sobreescribir con variables de entorno)
	_ = godotenv.Load()

	// Obtener credenciales de producción
	dbHost := os.Getenv("PROD_DB_HOST")
	dbUser := os.Getenv("PROD_DB_USER")
	dbPassword := os.Getenv("PROD_DB_PASSWORD")
	dbName := os.Getenv("PROD_DB_NAME")
	dbPort := os.Getenv("PROD_DB_PORT")
	dbSSLMode := os.Getenv("PROD_DB_SSLMODE")

	// Valores por defecto si no están definidos
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbSSLMode == "" {
		dbSSLMode = "require"
	}

	// Validar que tenemos las credenciales necesarias
	if dbHost == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		log.Fatal(`
❌ ERROR: Faltan credenciales de base de datos.

Define las siguientes variables de entorno:
  export PROD_DB_HOST=tu-host.render.com
  export PROD_DB_USER=tu-usuario
  export PROD_DB_PASSWORD=tu-password
  export PROD_DB_NAME=tu-database
  export PROD_DB_PORT=5432
  export PROD_DB_SSLMODE=require

Luego ejecuta: go run apply_seasons_migration_remote.go
`)
	}

	fmt.Println("🔌 Conectando a base de datos de producción...")
	fmt.Printf("   Host: %s\n", dbHost)
	fmt.Printf("   Database: %s\n", dbName)
	fmt.Printf("   User: %s\n", dbUser)

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		dbHost, dbUser, dbPassword, dbName, dbPort, dbSSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Error conectando a la base de datos:", err)
	}

	fmt.Println("✅ Conexión exitosa\n")
	fmt.Println("⚠️  ADVERTENCIA: Estás a punto de ejecutar una migración en PRODUCCIÓN")
	fmt.Println("   Presiona ENTER para continuar o CTRL+C para cancelar...")
	fmt.Scanln()

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

		// 5. Crear índices básicos
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

	// Agregar FK
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

	fmt.Printf("\n🎉 Migración completada exitosamente!\n")
	fmt.Printf("📊 Total de operaciones ejecutadas: %d\n", executed)
}
