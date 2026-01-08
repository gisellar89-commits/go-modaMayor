package product

import (
	"fmt"
	"go-modaMayor/config"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Crear variante
func CreateVariant(c *gin.Context) {
	var input ProductVariant
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Obtener el id del producto desde la ruta
	productID := c.Param("id")
	// Convertir a uint
	var pid uint
	if _, err := fmt.Sscan(productID, &pid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}
	input.ProductID = pid
	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

// Listar variantes de un producto
func ListVariantsByProduct(c *gin.Context) {
	productID := c.Param("product_id")
	var variants []ProductVariant
	if err := config.DB.Where("product_id = ?", productID).Find(&variants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, variants)
}

// Editar variante
func UpdateVariant(c *gin.Context) {
	id := c.Param("id")
	var variant ProductVariant
	if err := config.DB.First(&variant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Variante no encontrada"})
		return
	}
	var input ProductVariant
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := config.DB.Model(&variant).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, variant)
}

// Eliminar variante
func DeleteVariant(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&ProductVariant{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Variante eliminada"})
}

// UploadVariantImage recibe un multipart/form-data con campo 'image', guarda el archivo
// en ./uploads y actualiza el campo ImageURL de la variante.
func UploadVariantImage(c *gin.Context) {
	id := c.Param("id")
	var variant ProductVariant
	if err := config.DB.First(&variant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Variante no encontrada"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió archivo 'image'"})
		return
	}

	// Asegurar carpeta uploads
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Nombre seguro: variant_<id>_<original>
	filename := fmt.Sprintf("variant_%s_%s", id, filepath.Base(file.Filename))
	destPath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Guardar URL relativa
	variant.ImageURL = "/" + filepath.ToSlash(filepath.Join(uploadDir, filename))
	if err := config.DB.Save(&variant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, variant)
}

// PropagateVariantImage permite subir una imagen (multipart field 'image') o
// recibir un JSON { "color": "...", "image_url": "..." } y propagar el
// image_url a todas las variantes del producto que tengan el mismo color
// (comparación normalizada: LOWER(TRIM(color))). Devuelve el conteo y los
// ids actualizados.
func PropagateVariantImage(c *gin.Context) {
	// Obtener id del producto
	productID := c.Param("id")

	// Intentar bind JSON primero (color + image_url)
	var payload struct {
		Color    string `json:"color"`
		ImageURL string `json:"image_url"`
	}
	var color string
	var imageURL string

	if err := c.ShouldBindJSON(&payload); err == nil && payload.ImageURL != "" {
		color = payload.Color
		imageURL = payload.ImageURL
	} else {
		// Si no vino JSON con image_url, intentar multipart: campo 'image' y postform 'color'
		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Proporciona 'image' (multipart) o JSON con 'image_url' y 'color'"})
			return
		}
		color = c.PostForm("color")

		// Guardar archivo en uploads similar a UploadVariantImage
		uploadDir := "uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Nombre: propagate_product_<id>_<original>
		filename := fmt.Sprintf("propagate_product_%s_%s", productID, filepath.Base(file.Filename))
		destPath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, destPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		imageURL = "/" + filepath.ToSlash(filepath.Join(uploadDir, filename))
	}

	// Normalizar color para la consulta
	normColor := strings.TrimSpace(strings.ToLower(color))

	// Ejecutar en transacción: buscar variantes del producto y luego filtrar
	// por color normalizado en Go, para evitar problemas de portabilidad SQL.
	var updatedIDs []uint
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var variants []ProductVariant
		if err := tx.Where("product_id = ?", productID).Find(&variants).Error; err != nil {
			return err
		}
		if len(variants) == 0 {
			// No hay variantes para este producto
			return nil
		}
		ids := make([]uint, 0, len(variants))
		for _, v := range variants {
			if strings.TrimSpace(strings.ToLower(v.Color)) == normColor {
				ids = append(ids, v.ID)
			}
		}
		if len(ids) == 0 {
			// No hay variantes con el color solicitado
			return nil
		}
		// Actualizar image_url para esas variantes
		if err := tx.Model(&ProductVariant{}).Where("id IN ?", ids).Update("image_url", imageURL).Error; err != nil {
			return err
		}
		updatedIDs = ids
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"product_id": productID, "color": normColor, "image_url": imageURL, "updated_count": len(updatedIDs), "updated_ids": updatedIDs})
}

// GenerateVariantsInput permite crear combinaciones color x size en bloque.
type GenerateVariantsInput struct {
	Colors    []string `json:"colors"`
	Sizes     []string `json:"sizes"`
	SKUPrefix string   `json:"sku_prefix"` // opcional, se usa como prefijo para el SKU generado
}

// GenerateVariants crea variantes combinando colores y talles (si aplica). Ignora duplicados existentes.
// Ruta: POST /products/:id/variants/generate
func GenerateVariants(c *gin.Context) {
	productID := c.Param("id")
	var pid uint
	if _, err := fmt.Sscan(productID, &pid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	var input GenerateVariantsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalizar arrays: quitar duplicados y espacios
	uniq := func(arr []string) []string {
		seen := make(map[string]bool)
		out := make([]string, 0, len(arr))
		for _, v := range arr {
			s := strings.TrimSpace(v)
			if s == "" {
				continue
			}
			if !seen[s] {
				seen[s] = true
				out = append(out, s)
			}
		}
		return out
	}

	colors := uniq(input.Colors)
	sizes := uniq(input.Sizes)

	if len(colors) == 0 && len(sizes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Proporciona al menos colores o talles para generar variantes"})
		return
	}

	// Obtener producto para validar pertenencia
	var product Product
	if err := config.DB.First(&product, pid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	created := make([]ProductVariant, 0)
	skipped := 0

	// Transacción para crear variantes
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		// Si sizes vacíos, sólo iterar colors; si colors vacíos, sólo iterar sizes
		if len(colors) > 0 && len(sizes) > 0 {
			for _, col := range colors {
				for _, sz := range sizes {
					// Si ya existe, saltar
					var exists ProductVariant
					q := tx.Where("product_id = ? AND color = ? AND size = ?", product.ID, col, sz).First(&exists)
					if q.Error == nil {
						skipped++
						continue
					}
					if q.Error != nil && q.Error != gorm.ErrRecordNotFound {
						return q.Error
					}
					// Generar SKU simple: prefix + pid + color + size (sanitizado)
					sku := fmt.Sprintf("%s-%d-%s-%s", input.SKUPrefix, product.ID, sanitizeSKU(col), sanitizeSKU(sz))
					// Asegurar unicidad del SKU; si choca, añadir sufijo incremental
					baseSKU := sku
					suffix := 1
					for {
						var bySKU ProductVariant
						if err := tx.Where("sku = ?", sku).First(&bySKU).Error; err == gorm.ErrRecordNotFound {
							break
						} else if err != nil {
							return err
						}
						sku = fmt.Sprintf("%s-%d", baseSKU, suffix)
						suffix++
					}
					pv := ProductVariant{ProductID: product.ID, Color: col, Size: sz, SKU: sku}
					if err := tx.Create(&pv).Error; err != nil {
						return err
					}
					created = append(created, pv)
				}
			}
		} else if len(colors) > 0 {
			for _, col := range colors {
				var exists ProductVariant
				q := tx.Where("product_id = ? AND color = ?", product.ID, col).First(&exists)
				if q.Error == nil {
					skipped++
					continue
				}
				if q.Error != nil && q.Error != gorm.ErrRecordNotFound {
					return q.Error
				}
				sku := fmt.Sprintf("%s-%d-%s", input.SKUPrefix, product.ID, sanitizeSKU(col))
				baseSKU := sku
				suffix := 1
				for {
					var bySKU ProductVariant
					if err := tx.Where("sku = ?", sku).First(&bySKU).Error; err == gorm.ErrRecordNotFound {
						break
					} else if err != nil {
						return err
					}
					sku = fmt.Sprintf("%s-%d", baseSKU, suffix)
					suffix++
				}
				pv := ProductVariant{ProductID: product.ID, Color: col, SKU: sku}
				if err := tx.Create(&pv).Error; err != nil {
					return err
				}
				created = append(created, pv)
			}
		} else {
			// only sizes
			for _, sz := range sizes {
				var exists ProductVariant
				q := tx.Where("product_id = ? AND size = ?", product.ID, sz).First(&exists)
				if q.Error == nil {
					skipped++
					continue
				}
				if q.Error != nil && q.Error != gorm.ErrRecordNotFound {
					return q.Error
				}
				sku := fmt.Sprintf("%s-%d-%s", input.SKUPrefix, product.ID, sanitizeSKU(sz))
				baseSKU := sku
				suffix := 1
				for {
					var bySKU ProductVariant
					if err := tx.Where("sku = ?", sku).First(&bySKU).Error; err == gorm.ErrRecordNotFound {
						break
					} else if err != nil {
						return err
					}
					sku = fmt.Sprintf("%s-%d", baseSKU, suffix)
					suffix++
				}
				pv := ProductVariant{ProductID: product.ID, Size: sz, SKU: sku}
				if err := tx.Create(&pv).Error; err != nil {
					return err
				}
				created = append(created, pv)
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"created": created, "skipped": skipped})
}

// sanitizeSKU normaliza cadenas para generar SKUs simples: elimina espacios y pone mayúsculas
func sanitizeSKU(s string) string {
	out := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(s), " ", "-"))
	// eliminar caracteres no alfanuméricos excepto guion
	filtered := make([]rune, 0, len(out))
	for _, r := range out {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' {
			filtered = append(filtered, r)
		}
	}
	return string(filtered)
}
