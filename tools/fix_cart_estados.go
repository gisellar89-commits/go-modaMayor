package main

import (
	"fmt"
	"go-modaMayor/config"
	"log"
)

// Script para corregir carritos con estados bloqueados
// Ejecutar con: go run tools/fix_cart_estados.go
func main() {
	// Conectar a la base de datos usando la configuración existente
	db := config.ConnectDatabase()
	fmt.Println("✅ Conectado a la base de datos")

	// Actualizar carritos sin estado o con estados inválidos a 'pendiente'
	result := db.Exec(`
		UPDATE carts 
		SET estado = 'pendiente', updated_at = NOW()
		WHERE estado IS NULL 
		   OR estado = '' 
		   OR estado NOT IN ('pendiente', 'edicion', 'completado', 'pagado', 'listo_para_pago', 'cancelado')
	`)

	if result.Error != nil {
		log.Fatalf("Error al actualizar carritos: %v", result.Error)
	}

	fmt.Printf("✅ Actualización completada. %d carritos actualizados.\n", result.RowsAffected)

	// Mostrar resumen de estados actuales
	var counts []struct {
		Estado string
		Count  int64
	}

	db.Raw(`
		SELECT COALESCE(estado, 'NULL') as estado, COUNT(*) as count 
		FROM carts 
		GROUP BY estado 
		ORDER BY count DESC
	`).Scan(&counts)

	fmt.Println("\n📊 Resumen de estados de carritos:")
	for _, c := range counts {
		fmt.Printf("   %s: %d\n", c.Estado, c.Count)
	}
}
