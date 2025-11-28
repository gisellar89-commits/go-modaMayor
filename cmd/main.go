package main

import (
	"os"
	"time"

	"go-modaMayor/config"
	"go-modaMayor/internal/audit"
	"go-modaMayor/internal/cart"
	"go-modaMayor/internal/category"
	"go-modaMayor/internal/kit"
	"go-modaMayor/internal/notification"
	"go-modaMayor/internal/order"
	"go-modaMayor/internal/product"
	"go-modaMayor/internal/settings"
	"go-modaMayor/internal/user"
	"go-modaMayor/routes"
)

func main() {
	// 1. Conectar y obtener la instancia de GORM
	db := config.ConnectDatabase()

	// 2. Ejecutar migración de modelos sólo si AUTO_MIGRATE=true
	if os.Getenv("AUTO_MIGRATE") == "true" {
		// 2. Ejecutar migración de modelos
		if err := db.AutoMigrate(&product.Product{}); err != nil {
			panic("Falló migración Product: " + err.Error())
		}
		if err := db.AutoMigrate(&product.LocationStock{}); err != nil {
			panic("Falló migración LocationStock: " + err.Error())
		}
		if err := db.AutoMigrate(&user.User{}); err != nil {
			panic("Falló migración User: " + err.Error())
		}
		if err := db.AutoMigrate(&order.Order{}); err != nil {
			panic("Falló migración Order: " + err.Error())
		}
		if err := db.AutoMigrate(&order.OrderItem{}); err != nil {
			panic("Falló migración OrderItem: " + err.Error())
		}
		if err := db.AutoMigrate(&audit.AuditLog{}); err != nil {
			panic("Falló migración AuditLog: " + err.Error())
		}
		if err := db.AutoMigrate(&category.Category{}); err != nil {
			panic("Falló migración Category: " + err.Error())
		}
		if err := db.AutoMigrate(&cart.Cart{}); err != nil {
			panic("Falló migración Cart: " + err.Error())
		}
		if err := db.AutoMigrate(&cart.CartItem{}); err != nil {
			panic("Falló migración CartItem: " + err.Error())
		}
		if err := db.AutoMigrate(&product.ProductVariant{}); err != nil {
			panic("Falló migración ProductVariant: " + err.Error())
		}

		// New product-related migrations (suppliers and sizing)
		if err := db.AutoMigrate(&product.Supplier{}); err != nil {
			panic("Falló migración Supplier: " + err.Error())
		}
		if err := db.AutoMigrate(&product.SizeType{}); err != nil {
			panic("Falló migración SizeType: " + err.Error())
		}
		if err := db.AutoMigrate(&product.SizeValue{}); err != nil {
			panic("Falló migración SizeValue: " + err.Error())
		}
		if err := db.AutoMigrate(&product.Color{}); err != nil {
			panic("Falló migración Color: " + err.Error())
		}
		if err := db.AutoMigrate(&product.StockMovement{}); err != nil {
			panic("Falló migración StockMovement: " + err.Error())
		}
		// Topbar settings migration
		if err := db.AutoMigrate(&settings.Topbar{}); err != nil {
			panic("Falló migración Topbar: " + err.Error())
		}
		// Banners migration (homepage slides)
		if err := db.AutoMigrate(&settings.Banner{}); err != nil {
			panic("Falló migración Banner: " + err.Error())
		}
		// Videos migration (home video blocks)
		if err := db.AutoMigrate(&settings.Video{}); err != nil {
			panic("Falló migración Video: " + err.Error())
		}
		// Home sections (curated homepage entries)
		if err := db.AutoMigrate(&settings.HomeSectionEntry{}); err != nil {
			panic("Falló migración HomeSectionEntry: " + err.Error())
		}
		// Bestseller snapshots
		if err := db.AutoMigrate(&order.BestsellerSnapshot{}); err != nil {
			panic("Falló migración BestsellerSnapshot: " + err.Error())
		}
		// Round-robin state for seller assignment
		if err := db.AutoMigrate(&order.RoundRobinState{}); err != nil {
			panic("Falló migración RoundRobinState: " + err.Error())
		}
		// Migrations for kits/combos
		if err := db.AutoMigrate(&kit.Kit{}); err != nil {
			panic("Falló migración Kit: " + err.Error())
		}
		if err := db.AutoMigrate(&kit.KitItem{}); err != nil {
			panic("Falló migración KitItem: " + err.Error())
		}
		// Notifications migration
		if err := db.AutoMigrate(&notification.Notification{}); err != nil {
			panic("Falló migración Notification: " + err.Error())
		}
	}

	// 3. Crear usuario admin si no existe
	var admin user.User
	db.Where("role = ?", "admin").First(&admin)
	if admin.ID == 0 {
		admin = user.User{
			Name:     "Administrador",
			Email:    "admin@modamayor.com",
			Password: "admin123", // Cambia esto luego por seguridad
			Role:     "admin",
		}
		db.Create(&admin)
	}

	// 3. Guardar DB global para handlers
	config.DB = db

	// 4. Levantar el servidor
	router := routes.SetupRouter(db)

	// Start background snapshotter (runs every hour)
	order.StartBestsellerSnapshotter(time.Hour)

	router.Run(":8080")
}
