package main

import (
	"fmt"
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	"os"
)

func main() {
	// Conectar a la base de datos de producción
	db := config.ConnectDatabase()

	var products []product.Product
	db.Order("id DESC").Limit(5).Find(&products)

	fmt.Println("Últimos 5 productos creados:")
	fmt.Println("=============================")
	for _, p := range products {
		fmt.Printf("ID: %d\n", p.ID)
		fmt.Printf("Nombre: %s\n", p.Name)
		fmt.Printf("ImageURL: %s\n", p.ImageURL)
		fmt.Printf("ImageModel: %s\n", p.ImageModel)
		fmt.Printf("ImageHanger: %s\n", p.ImageHanger)
		fmt.Println("-----------------------------")
	}
}
