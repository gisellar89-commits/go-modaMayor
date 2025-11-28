//go:build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"

	"go-modaMayor/config"

	_ "github.com/lib/pq"
)

func main() {
	// reuse existing DB connection (reads .env)
	db := config.ConnectDatabase()

	// get generic sql.DB from gorm
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("error getting sql.DB: %v", err)
	}

	checkTableColumns(sqlDB, "location_stocks")
	checkTableColumns(sqlDB, "cart_items")
}

func checkTableColumns(db *sql.DB, table string) {
	fmt.Printf("\nColumnas en tabla %s:\n", table)
	rows, err := db.Query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", table)
	if err != nil {
		fmt.Printf("  error consultando columnas: %v\n", err)
		return
	}
	defer rows.Close()
	var name, dtype string
	found := false
	for rows.Next() {
		if err := rows.Scan(&name, &dtype); err != nil {
			fmt.Printf("  scan error: %v\n", err)
			return
		}
		fmt.Printf("  - %s (%s)\n", name, dtype)
		found = true
	}
	if !found {
		fmt.Printf("  (tabla no encontrada o sin columnas)\n")
	}
}
