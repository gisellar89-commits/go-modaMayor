package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

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

	// Eliminar los registros de migraciones que no se ejecutaron realmente
	migrations := []string{
		"20251116_create_home_section_configs.sql",
		"20251220_add_deleted_at_home_section_configs.sql",
	}

	for _, migration := range migrations {
		res := db.Exec("DELETE FROM migration_records WHERE name = ?", migration)
		if res.Error != nil {
			log.Printf("❌ Error eliminando registro %s: %v\n", migration, res.Error)
		} else {
			log.Printf("✅ Eliminado registro: %s (rows: %d)\n", migration, res.RowsAffected)
		}
	}

	// Ahora insertar los registros correctamente
	for _, migration := range migrations {
		res := db.Exec("INSERT INTO migration_records (name) VALUES (?) ON CONFLICT (name) DO NOTHING", migration)
		if res.Error != nil {
			log.Printf("❌ Error insertando registro %s: %v\n", migration, res.Error)
		} else {
			log.Printf("✅ Registrado: %s\n", migration)
		}
	}

	log.Println("\n🎉 Registros de migraciones corregidos")
}
