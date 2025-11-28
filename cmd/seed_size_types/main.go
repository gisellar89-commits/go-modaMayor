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

	if err := db.AutoMigrate(&product.SizeType{}, &product.SizeValue{}); err != nil {
		log.Fatalf("AutoMigrate error: %v", err)
	}

	types := []product.SizeType{
		{Key: "unico", Name: "Talle único / sin variantes", Description: "Producto sin talles", IsSingleton: true},
		{Key: "especiales", Name: "Talles especiales", Description: "Talles especiales"},
		{Key: "letras", Name: "Letras (S/M/L)", Description: "Talles en letras"},
		{Key: "numericos", Name: "Númericos", Description: "Talles numéricos"},
		{Key: "jeans", Name: "Talle de jeans", Description: "Talles para jeans"},
	}

	if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "key"}}, DoNothing: true}).Create(&types).Error; err != nil {
		log.Fatalf("Error inserting size types: %v", err)
	}

	// Insert some example size values for letras and numericos
	// First fetch the inserted types to get their IDs
	var letras product.SizeType
	var numericos product.SizeType
	db.Where("key = ?", "letras").First(&letras)
	db.Where("key = ?", "numericos").First(&numericos)

	if letras.ID != 0 {
		values := []product.SizeValue{{SizeTypeID: letras.ID, Value: "S", Ordinal: 1}, {SizeTypeID: letras.ID, Value: "M", Ordinal: 2}, {SizeTypeID: letras.ID, Value: "L", Ordinal: 3}}
		if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "size_type_id"}, {Name: "value"}}, DoNothing: true}).Create(&values).Error; err != nil {
			log.Printf("Warning: could not insert letter sizes: %v", err)
		}
	}

	if numericos.ID != 0 {
		values := []product.SizeValue{{SizeTypeID: numericos.ID, Value: "34", Ordinal: 1}, {SizeTypeID: numericos.ID, Value: "36", Ordinal: 2}, {SizeTypeID: numericos.ID, Value: "38", Ordinal: 3}}
		if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "size_type_id"}, {Name: "value"}}, DoNothing: true}).Create(&values).Error; err != nil {
			log.Printf("Warning: could not insert numeric sizes: %v", err)
		}
	}

	fmt.Println("seed_size_types: ejecutado")
}
