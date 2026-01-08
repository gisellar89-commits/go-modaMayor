package main

import (
	"fmt"
	"log"

	"go-modaMayor/config"
	"go-modaMayor/internal/product"

	"gorm.io/gorm/clause"
)

func main() {
	db := config.ConnectDatabase()

	// Asegurar que la tabla existe (no destruye datos)
	if err := db.AutoMigrate(&product.Color{}); err != nil {
		log.Fatalf("AutoMigrate error: %v", err)
	}

	colors := []product.Color{
		{Key: "negro", Name: "Negro", Hex: "#000000", Active: true},
		{Key: "blanco", Name: "Blanco", Hex: "#FFFFFF", Active: true},
		{Key: "rojo", Name: "Rojo", Hex: "#FF0000", Active: true},
		{Key: "azul", Name: "Azul", Hex: "#0000FF", Active: true},
		{Key: "verde", Name: "Verde", Hex: "#00AA00", Active: true},
	}

	// Insertar de forma idempotente usando ON CONFLICT DO NOTHING sobre la columna `key`
	if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "key"}}, DoNothing: true}).Create(&colors).Error; err != nil {
		log.Fatalf("Error inserting colors: %v", err)
	}

	fmt.Println("seed_colors: colores insertados (o ya existentes)")
}
