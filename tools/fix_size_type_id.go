package main

import (
	"go-modaMayor/config"
	"go-modaMayor/internal/product"
	"log"
)

func main() {
	db := config.ConnectDatabase()

	// Obtener todos los productos sin size_type_id pero con variantes
	var products []product.Product
	if err := db.Preload("Variants").Where("size_type_id IS NULL").Find(&products).Error; err != nil {
		log.Fatalf("Error al obtener productos: %v", err)
	}

	log.Printf("Encontrados %d productos sin size_type_id", len(products))

	// Obtener size_types para mapear keys a IDs
	var sizeTypes []product.SizeType
	if err := db.Find(&sizeTypes).Error; err != nil {
		log.Fatalf("Error al obtener size_types: %v", err)
	}

	sizeTypeMap := make(map[string]uint)
	for _, st := range sizeTypes {
		sizeTypeMap[st.Key] = st.ID
	}

	log.Printf("Size types disponibles: %v", sizeTypeMap)

	updated := 0
	skipped := 0

	for _, p := range products {
		if len(p.Variants) == 0 {
			log.Printf("Producto %d '%s' - Sin variantes, usando 'unico'", p.ID, p.Name)
			if id, ok := sizeTypeMap["unico"]; ok {
				p.SizeTypeID = &id
				if err := db.Model(&p).Update("size_type_id", id).Error; err != nil {
					log.Printf("  ❌ Error al actualizar: %v", err)
					continue
				}
				updated++
				log.Printf("  ✅ Actualizado a size_type_id=%d (unico)", id)
			}
			continue
		}

		// Analizar variantes para determinar el tipo
		hasNumericSizes := false
		hasLetterSizes := false
		hasJeansSizes := false
		hasSpecialSizes := false

		for _, v := range p.Variants {
			size := v.Size
			if size == "" {
				continue
			}

			// Detectar patrones
			switch {
			case size == "XS" || size == "S" || size == "M" || size == "L" || size == "XL" || size == "XXL":
				hasLetterSizes = true
			case size >= "28" && size <= "52": // Rango típico de jeans
				hasJeansSizes = true
			case size >= "34" && size <= "50": // Rango típico numérico
				hasNumericSizes = true
			default:
				hasSpecialSizes = true
			}
		}

		// Determinar el tipo basándose en los patrones
		var sizeTypeKey string
		switch {
		case hasLetterSizes:
			sizeTypeKey = "letras"
		case hasJeansSizes:
			sizeTypeKey = "jeans"
		case hasNumericSizes:
			sizeTypeKey = "numerico"
		case hasSpecialSizes:
			sizeTypeKey = "especiales"
		default:
			log.Printf("Producto %d '%s' - No se pudo determinar tipo de talle, saltando", p.ID, p.Name)
			skipped++
			continue
		}

		if id, ok := sizeTypeMap[sizeTypeKey]; ok {
			p.SizeTypeID = &id
			if err := db.Model(&p).Update("size_type_id", id).Error; err != nil {
				log.Printf("Producto %d '%s' - ❌ Error al actualizar: %v", p.ID, p.Name, err)
				continue
			}
			updated++
			log.Printf("Producto %d '%s' - ✅ Actualizado a size_type_id=%d (%s)", p.ID, p.Name, id, sizeTypeKey)
		} else {
			log.Printf("Producto %d '%s' - ⚠️ Size type key '%s' no encontrado en BD", p.ID, p.Name, sizeTypeKey)
			skipped++
		}
	}

	log.Printf("\n=== RESUMEN ===")
	log.Printf("Total procesados: %d", len(products))
	log.Printf("Actualizados: %d", updated)
	log.Printf("Saltados: %d", skipped)
	log.Printf("===============\n")
}
