package main

import (
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
)

func main() {
	db := config.ConnectDatabase()

	var products []product.Product
	db.Order("id DESC").Limit(10).Find(&products)

	fmt.Println("Últimos 10 productos en producción:")
	fmt.Println("====================================")
	for _, p := range products {
		fmt.Printf("ID: %d | Nombre: %s\n", p.ID, p.Name)
		fmt.Printf("  ImageURL: '%s'\n", p.ImageURL)
		fmt.Printf("  ImageModel: '%s'\n", p.ImageModel)
		fmt.Printf("  ImageHanger: '%s'\n", p.ImageHanger)
		fmt.Println("------------------------------------")
	}
}
