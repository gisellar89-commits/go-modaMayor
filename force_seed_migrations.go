package main

import (
	"fmt"
	"log"

	"go-modaMayor/config"
)

// Este script fuerza la ejecución de las migraciones de seed
// incluso si ya están marcadas como ejecutadas
func main() {
	db := config.ConnectDatabase()

	log.Println("🔧 Forzando ejecución de seeds...")

	// Eliminar registros de migraciones de seed para forzar re-ejecución
	migrations := []string{
		"20251110_seed_common_colors.sql",
		"20251111_seed_size_types_and_values.sql",
	}

	for _, migName := range migrations {
		result := db.Exec("DELETE FROM migration_records WHERE name = ?", migName)
		if result.Error != nil {
			log.Printf("⚠️  Error eliminando registro de %s: %v", migName, result.Error)
		} else {
			log.Printf("✓ Eliminado registro de: %s", migName)
		}
	}

	log.Println("\n🔄 Ahora ejecuta el servidor para que aplique las migraciones automáticamente")
	log.Println("O ejecuta: go run cmd/main.go")

	fmt.Println("\n✅ Registros de migraciones eliminados. Las seeds se ejecutarán en el próximo inicio.")
}
