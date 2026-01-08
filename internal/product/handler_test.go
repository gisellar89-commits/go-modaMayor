package product

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"go-modaMayor/config"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// setupTestDB crea una DB sqlite en memoria, hace AutoMigrate y setea config.DB
func setupTestDB(t *testing.T) *gorm.DB {
	os.Setenv("AUTO_MIGRATE", "false")
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	// Automigrate required models
	err = db.AutoMigrate(&Product{}, &ProductVariant{}, &LocationStock{}, &SizeType{}, &SizeValue{}, &Supplier{}, &Color{})
	if err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}
	config.DB = db
	return db
}

func TestAddProductStocks_ExceedTotalStock(t *testing.T) {
	db := setupTestDB(t)
	// crear product con total_stock = 5
	prod := Product{Name: "P", TotalStock: func(i int) *int { v := i; return &v }(5)}
	db.Create(&prod)
	// crear una variante
	pv := ProductVariant{ProductID: prod.ID, SKU: "sku1"}
	db.Create(&pv)
	// existing stock: variante en deposito = 2
	db.Create(&LocationStock{ProductID: prod.ID, VariantID: &pv.ID, Location: "deposito", Stock: 2, Reserved: 0})

	// ahora intentamos agregar stocks que suman 5 más el existente -> excede
	// Enviar: variant deposito set to 4, and new location mendoza = 4 => total would be 4+4 = 8 (existing 2 replaced)
	input := AddStocksInput{
		Stocks: []StockItemInput{
			{VariantID: &pv.ID, Location: "deposito", Quantity: 4},
			{VariantID: &pv.ID, Location: "mendoza", Quantity: 4},
		},
	}
	b, _ := json.Marshal(input)

	// Preparar context
	router := gin.Default()
	router.POST("/products/:id/stocks", func(c *gin.Context) { AddProductStocks(c) })

	req := httptest.NewRequest(http.MethodPost, "/products/"+fmt.Sprintf("%d", prod.ID)+"/stocks", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code == http.StatusOK {
		t.Fatalf("expected failure 400 but got 200 OK")
	}
}

func TestSetVariantStock_NotBelowReserved(t *testing.T) {
	db := setupTestDB(t)
	prod := Product{Name: "P2", TotalStock: func(i int) *int { v := i; return &v }(10)}
	db.Create(&prod)
	pv := ProductVariant{ProductID: prod.ID, SKU: "sku2"}
	db.Create(&pv)
	// existing stock with reserved = 3
	db.Create(&LocationStock{ProductID: prod.ID, VariantID: &pv.ID, Location: "deposito", Stock: 5, Reserved: 3})

	// Attempt to set stock to 2 (below reserved 3) -> should be rejected
	input := VariantStockInput{Location: "deposito", Stock: 2}
	b, _ := json.Marshal(input)

	router := gin.Default()
	router.POST("/variants/:id/stock", func(c *gin.Context) { SetVariantStock(c) })

	req := httptest.NewRequest(http.MethodPost, "/variants/"+fmt.Sprintf("%d", pv.ID)+"/stock", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code == http.StatusOK || w.Code == http.StatusCreated {
		t.Fatalf("expected failure when lowering below reserved, got %d", w.Code)
	}
}
