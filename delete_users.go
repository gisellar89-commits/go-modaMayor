package main

import (
	"fmt"
	"go-modaMayor/config"
)

func main() {
	config.DB = config.ConnectDatabase()
	result := config.DB.Exec("DELETE FROM users")
	if result.Error != nil {
		fmt.Println("Error al eliminar usuarios:", result.Error)
		return
	}
	fmt.Printf("Usuarios eliminados: %d\n", result.RowsAffected)
}
