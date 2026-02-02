package main

import (
	"fmt"
	"os"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Product struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string
	ImageURL    string
	ImageModel  string
	ImageHanger string
}

func main() {
	// URL de producción de Render
	prodURL := "postgresql://modamayor_user:aIcXL1R6uuxklNyb8HynVhzgl9d6MVEh@dpg-d5ubrti4d50c73d1qesg-a.virginia-postgres.render.com/modamayor?sslmode=require"
	
	db, err := gorm.Open(postgres.Open(prodURL), &gorm.Config{})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a producción: %v\n", err)
		os.Exit(1)
	}

	var products []Product
	db.Order("id DESC").Limit(10).Find(&products)

	fmt.Println("🔴 PRODUCTOS EN PRODUCCIÓN (Render):")
	fmt.Println("====================================")
	
	if len(products) == 0 {
		fmt.Println("No hay productos en la base de datos de producción")
		return
	}
	
	for _, p := range products {
		fmt.Printf("ID: %d | Nombre: %s\n", p.ID, p.Name)
		fmt.Printf("  ImageURL: '%s'\n", p.ImageURL)
		fmt.Printf("  ImageModel: '%s'\n", p.ImageModel)
		fmt.Printf("  ImageHanger: '%s'\n", p.ImageHanger)
		fmt.Println("------------------------------------")
	}
}
