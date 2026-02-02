package main

import (
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	"strings"
)

func main() {
	// Conectar a la base de datos
	db := config.ConnectDatabase()

	var products []product.Product
	db.Find(&products)

	updatedCount := 0
	for _, p := range products {
		updated := false
		
		// Corregir ImageURL si empieza con /uploads/
		if strings.HasPrefix(p.ImageURL, "/uploads/") {
			p.ImageURL = strings.TrimPrefix(p.ImageURL, "/")
			updated = true
		}
		
		// Corregir ImageModel si empieza con /uploads/
		if strings.HasPrefix(p.ImageModel, "/uploads/") {
			p.ImageModel = strings.TrimPrefix(p.ImageModel, "/")
			updated = true
		}
		
		// Corregir ImageHanger si empieza con /uploads/
		if strings.HasPrefix(p.ImageHanger, "/uploads/") {
			p.ImageHanger = strings.TrimPrefix(p.ImageHanger, "/")
			updated = true
		}
		
		if updated {
			if err := db.Save(&p).Error; err != nil {
				fmt.Printf("Error actualizando producto %d: %v\n", p.ID, err)
			} else {
				fmt.Printf("Producto %d actualizado - ImageURL: %s\n", p.ID, p.ImageURL)
				updatedCount++
			}
		}
	}

	fmt.Printf("\nTotal de productos actualizados: %d\n", updatedCount)
}
