package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"strings"

	"go-modaMayor/config"
)

func main() {
	db := config.ConnectDatabase()
	data, err := ioutil.ReadFile("migrations/20251114_add_product_code.sql")
	if err != nil {
		log.Fatalf("No se pudo leer migration file: %v", err)
	}
	sql := string(data)
	parts := strings.Split(sql, ";")
	applied := int64(0)
	for _, p := range parts {
		s := strings.TrimSpace(p)
		if s == "" {
			continue
		}
		res := db.Exec(s)
		if res.Error != nil {
			log.Fatalf("Error ejecutando migration stmt: %v\nstmt: %s", res.Error, s)
		}
		if res.RowsAffected > 0 {
			applied += res.RowsAffected
		}
	}
	fmt.Printf("Migration aplicada ok. Statements ejecutados: %d\n", len(parts))
	fmt.Printf("RowsAffected sum: %d\n", applied)
}
