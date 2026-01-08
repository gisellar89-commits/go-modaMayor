package config

import (
	"fmt"
	"go-modaMayor/internal/address"
	"go-modaMayor/internal/category"
	settings "go-modaMayor/internal/settings"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() *gorm.DB {
	_ = godotenv.Load() // ignora error si no existe .env

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

	// Ejecutar AutoMigrate sólo si AUTO_MIGRATE=true
	if os.Getenv("AUTO_MIGRATE") == "true" {
		// Migración automática de la tabla de configuración de precios
		db.AutoMigrate(&settings.PricingConfig{})

		// Migración automática de categorías y subcategorías
		db.AutoMigrate(&category.Category{}, &category.Subcategory{})

		// Migración automática de direcciones
		db.AutoMigrate(&address.Address{})
	}

	// ... existing code ...

	return db
}
