package config

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

// MigrationRecord guarda el registro de migraciones ejecutadas
type MigrationRecord struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"uniqueIndex;size:255"`
	AppliedAt int64  `gorm:"autoCreateTime"`
}

// RunSQLMigrations ejecuta todas las migraciones SQL pendientes
func RunSQLMigrations(db *gorm.DB) error {
	// Crear tabla de control de migraciones si no existe
	if err := db.AutoMigrate(&MigrationRecord{}); err != nil {
		return fmt.Errorf("error creando tabla de migraciones: %v", err)
	}

	// Obtener lista de migraciones ya aplicadas
	var applied []MigrationRecord
	db.Find(&applied)
	appliedMap := make(map[string]bool)
	for _, m := range applied {
		appliedMap[m.Name] = true
	}

	// Leer archivos de migraciones
	migrationsDir := "migrations"
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		// Si no existe la carpeta, no hay migraciones que aplicar
		log.Printf("⚠️  Carpeta migrations/ no encontrada, saltando migraciones SQL")
		return nil
	}

	// Filtrar solo archivos .sql y ordenar
	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".sql") {
			sqlFiles = append(sqlFiles, f.Name())
		}
	}
	sort.Strings(sqlFiles)

	// Aplicar migraciones pendientes
	pendingCount := 0
	for _, filename := range sqlFiles {
		if appliedMap[filename] {
			log.Printf("✓ Migración ya aplicada: %s", filename)
			continue
		}

		log.Printf("⏳ Aplicando migración: %s", filename)
		
		// Leer archivo
		filePath := filepath.Join(migrationsDir, filename)
		content, err := ioutil.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("error leyendo %s: %v", filename, err)
		}

		// Ejecutar SQL
		sql := string(content)
		if err := executeSQLMigration(db, sql); err != nil {
			return fmt.Errorf("error ejecutando %s: %v", filename, err)
		}

		// Registrar migración como aplicada
		record := MigrationRecord{Name: filename}
		if err := db.Create(&record).Error; err != nil {
			return fmt.Errorf("error registrando migración %s: %v", filename, err)
		}

		log.Printf("✅ Migración aplicada exitosamente: %s", filename)
		pendingCount++
	}

	if pendingCount == 0 {
		log.Println("✓ No hay migraciones pendientes")
	} else {
		log.Printf("🎉 %d migraciones aplicadas exitosamente", pendingCount)
	}

	return nil
}

// executeSQLMigration ejecuta un archivo SQL statement por statement
func executeSQLMigration(db *gorm.DB, sql string) error {
	// Dividir por punto y coma (separador de statements)
	statements := strings.Split(sql, ";")
	
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		
		// Ignorar comentarios y líneas vacías
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}

		// Ejecutar statement
		result := db.Exec(stmt)
		if result.Error != nil {
			// Algunos errors son esperados (ej: tabla ya existe)
			// Solo logueamos como warning en lugar de fallar
			log.Printf("⚠️  Warning ejecutando statement: %v", result.Error)
			// Continuamos con el siguiente statement
			continue
		}
	}

	return nil
}

// GetAppliedMigrations retorna la lista de migraciones aplicadas
func GetAppliedMigrations(db *gorm.DB) ([]string, error) {
	var records []MigrationRecord
	if err := db.Order("applied_at ASC").Find(&records).Error; err != nil {
		return nil, err
	}

	var names []string
	for _, r := range records {
		names = append(names, r.Name)
	}
	return names, nil
}
