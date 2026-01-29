
package routes

import (
	"go-modaMayor/internal/address"
	"go-modaMayor/internal/audit"
	"go-modaMayor/internal/cart"
	"go-modaMayor/internal/category"
	"go-modaMayor/internal/faq"
	"go-modaMayor/internal/kit"
	"go-modaMayor/internal/notification"
	"go-modaMayor/internal/order"
	"go-modaMayor/internal/product"
	"go-modaMayor/internal/remito"
	"go-modaMayor/internal/settings/handler"
	"go-modaMayor/internal/user"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
	AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"}, // Permitir frontend en 3000 y 3001
	AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowHeaders:     []string{"Authorization", "Content-Type"},
	ExposeHeaders:    []string{"Content-Length"},
	AllowCredentials: true,
}))
// Auditoría por entidad e ID
	r.GET("/audit/logs/:entity/:id", user.AuthMiddleware(), user.RequireRole("admin"), audit.ListAuditLogsByEntity)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/products", product.GetProducts)
	r.GET("/products/:id", product.GetProduct)
	// Permitir que admin y encargados creen productos
	r.POST("/products", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.CreateProduct)
	// Crear producto completo: producto + variantes + stocks iniciales (solo admin)
	r.POST("/products/full", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateProductFull)

	// Admin: manage suppliers and size types/values
	r.GET("/suppliers", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListSuppliers)
	r.POST("/suppliers", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateSupplier)
	r.PUT("/suppliers/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateSupplier)
	r.DELETE("/suppliers/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteSupplier)

	// Admin: manage seasons (temporadas)
	r.GET("/seasons", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListSeasons)
	r.GET("/public/seasons", product.ListSeasons) // Público para el wizard
	r.GET("/seasons/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.GetSeason)
	r.POST("/seasons", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateSeason)
	r.PUT("/seasons/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateSeason)
	r.DELETE("/seasons/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteSeason)

	r.GET("/size-types", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListSizeTypes)
	r.POST("/size-types", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateSizeType)
	r.PUT("/size-types/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateSizeType)
	r.DELETE("/size-types/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteSizeType)

	r.GET("/size-values", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListSizeValues)
	r.POST("/size-values", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateSizeValue)
	r.PUT("/size-values/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateSizeValue)
	r.DELETE("/size-values/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteSizeValue)

	// Colors (admin-managed, listable by admin/encargado)
	r.GET("/colors", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListColors)
	r.POST("/colors", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateColor)
	r.PUT("/colors/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateColor)
	r.DELETE("/colors/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteColor)

	// Public colors for frontend consumption (used by wizard)
	r.GET("/public/colors", product.ListColors)

	// Usuarios
	r.POST("/register", user.Register)
	r.POST("/login", user.Login)
	r.POST("/forgot-password", user.ForgotPassword)
	r.POST("/reset-password", user.ResetPassword)

	// Pedidos (protegidos)
	r.POST("/orders", user.AuthMiddleware(), order.CreateOrder)
	r.GET("/orders/user/:user_id", user.AuthMiddleware(), order.ListOrdersByUser)
	r.POST("/checkout/:cartID", user.AuthMiddleware(), user.RequireRole("vendedor"), order.CheckoutCart)
	// Cliente solicita que su carrito sea asignado a una vendedora (crea orden en estado pendiente)
	r.POST("/checkout/:cartID/request-assignment", user.AuthMiddleware(), order.SubmitCartForAssignment)
	// Vendedor: listar y asignarse a órdenes
	r.GET("/orders/seller", user.AuthMiddleware(), user.RequireRole("vendedor"), order.ListOrdersForSeller)
	r.POST("/orders/:id/assign-self", user.AuthMiddleware(), user.RequireRole("vendedor"), order.AssignOrderSelf)
	// Admin: asignar orden manualmente a una vendedora
	r.POST("/orders/:id/assign", user.AuthMiddleware(), user.RequireRole("admin"), order.AssignOrderAdmin)

	// Rutas protegidas para admin (editar ahora permitido para encargados también)
	r.PUT("/products/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.UpdateProduct)
	// Permitir que admin o encargado actualicen descuentos
	r.PUT("/products/:id/discount", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.UpdateProductDiscount)
	r.DELETE("/products/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteProduct)
	r.GET("/users", user.AuthMiddleware(), user.RequireRole("admin"), user.ListUsers)
	r.GET("/users/:id", user.AuthMiddleware(), user.RequireRole("admin"), user.GetUser)
	r.PUT("/users/:id", user.AuthMiddleware(), user.RequireRole("admin"), user.UpdateUser)
	r.DELETE("/users/:id", user.AuthMiddleware(), user.RequireRole("admin"), user.DeleteUser)

	// Direcciones de usuarios (reorganizadas para evitar conflicto con /users/:id)
	r.GET("/addresses/user/:user_id", user.AuthMiddleware(), address.ListUserAddresses(db))
	r.POST("/addresses", user.AuthMiddleware(), address.CreateAddress(db))
	r.GET("/addresses/:id", user.AuthMiddleware(), address.GetAddress(db))
	r.PUT("/addresses/:id", user.AuthMiddleware(), address.UpdateAddress(db))
	r.DELETE("/addresses/:id", user.AuthMiddleware(), address.DeleteAddress(db))
	r.PUT("/addresses/:id/set-default", user.AuthMiddleware(), address.SetDefaultAddress(db))

	r.GET("/orders", user.AuthMiddleware(), user.RequireRole("admin"), order.ListAllOrders)
	r.PUT("/orders/:id/status", user.AuthMiddleware(), user.RequireAnyRole("admin", "vendedor"), order.UpdateOrderStatus)
	r.GET("/audit/logs", user.AuthMiddleware(), user.RequireRole("admin"), audit.ListAuditLogs)
	// Crear usuarios del sistema (solo admin)
	r.POST("/users", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), user.CreateUserWithRole)
	// Categorías (solo admin)
	r.POST("/categories", user.AuthMiddleware(), user.RequireRole("admin"), category.CreateCategory(db))
	r.GET("/categories", user.AuthMiddleware(), user.RequireRole("admin"), category.ListCategories(db))
	// Endpoint público para obtener categorías (usado por frontend)
	r.GET("/public/categories", category.ListCategories(db))
	r.PUT("/categories/:id", user.AuthMiddleware(), user.RequireRole("admin"), category.UpdateCategory(db))
	r.DELETE("/categories/:id", user.AuthMiddleware(), user.RequireRole("admin"), category.DeleteCategory(db))
	r.PUT("/products/:id/stock", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateStock)
	r.GET("/products/low-stock", user.AuthMiddleware(), user.RequireRole("admin"), product.LowStockProducts)
	r.Static("/uploads", "./uploads")
	r.POST("/products/:id/image", user.AuthMiddleware(), user.RequireRole("admin"), product.UploadProductImage)
	// Subir múltiples imágenes de producto (image_main, image_model, image_hanger)
	r.POST("/products/:id/images", user.AuthMiddleware(), user.RequireRole("admin"), product.UploadProductImages)

	// Variantes de producto (solo admin)
	r.POST("/products/:id/variants", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateVariant)
	// Generar variantes en bloque (admin)
	r.POST("/products/:id/variants/generate", user.AuthMiddleware(), user.RequireRole("admin"), product.GenerateVariants)
	r.GET("/products/:id/variants", user.AuthMiddleware(), product.GetProductVariants)
	r.PUT("/variants/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.UpdateVariant)
	r.DELETE("/variants/:id", user.AuthMiddleware(), user.RequireRole("admin"), product.DeleteVariant)
	// Subir imagen para una variante (multipart) -> field 'image'
	r.POST("/variants/:id/image", user.AuthMiddleware(), user.RequireRole("admin"), product.UploadVariantImage)

	// Propagar imagen por color para todas las variantes de un producto
	r.POST("/products/:id/variants/propagate-image", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.PropagateVariantImage)

	// Stock por variante (lectura permitida a admin/encargado/vendedor)
	r.POST("/variants/:id/stock", user.AuthMiddleware(), user.RequireRole("admin"), product.SetVariantStock)
	r.GET("/variants/:id/stock", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado", "vendedor"), product.GetVariantStock)

	// Stock por producto (agregar/actualizar múltiples ubicaciones) (solo admin)
	r.POST("/products/:id/stocks", user.AuthMiddleware(), user.RequireRole("admin"), product.AddProductStocks)

	// Listar stocks por ubicación (admin/encargado)
	r.GET("/location-stocks", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListLocationStocks)

	// Movimientos de stock (admin/encargado)
	r.GET("/stock-movements", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), product.ListStockMovements)
	r.POST("/stock-movements", user.AuthMiddleware(), user.RequireRole("admin"), product.CreateStockMovement)

	// Kits / Combos (admin/encargado can create/edit)
	r.POST("/kits", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), kit.CreateKit)
	r.GET("/kits", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), kit.ListKits)
	r.GET("/kits/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), kit.GetKit)
	r.PUT("/kits/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), kit.UpdateKit)
	r.DELETE("/kits/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), kit.DeleteKit)

	// Carrito (usuario logueado)
	r.GET("/cart", user.AuthMiddleware(), cart.GetCart)
	// Resumen del carrito con precios dinámicos según price tiers
	r.GET("/cart/summary", user.AuthMiddleware(), cart.GetCartSummary)
	// Calcular precio para invitados (usuarios no autenticados) - usa solo el tier base
	r.POST("/cart/guest-price", cart.CalculateGuestPrice)
	// Verificar disponibilidad de stock para items del carrito
	r.GET("/cart/check-stock", user.AuthMiddleware(), cart.CheckCartStock)
	// Vendedor: listar carritos asignados
	r.GET("/cart/seller", user.AuthMiddleware(), user.RequireRole("vendedor"), cart.GetCartsForSeller)
	// Debug: info extendida para vendedora (dev)
	r.GET("/cart/seller/debug", user.AuthMiddleware(), user.RequireRole("vendedor"), cart.GetCartsForSellerDebug)
	// Obtener carrito por ID (admin/owner/vendedor asignado)
	r.GET("/cart/:id", user.AuthMiddleware(), cart.GetCartByID)
	// Permitir agregar al carrito sin autenticación (opcional, manejado por frontend)
	r.POST("/cart/add", user.OptionalAuthMiddleware(), cart.AddToCart)
	r.PUT("/cart/update/:product_id", user.AuthMiddleware(), cart.UpdateCartItem)
	r.DELETE("/cart/remove/:product_id", user.AuthMiddleware(), cart.RemoveFromCart)
	r.DELETE("/cart/clear", user.AuthMiddleware(), cart.ClearCart)
	r.POST("/cart/transfer", cart.TransferCartToSeller)
	// Actualizar estado del carrito (ej: 'listo_para_pago')
	r.PUT("/cart/:id/status", user.AuthMiddleware(), cart.UpdateCartStatus)

	// Reportes (solo admin)
	r.GET("/reports/sales", user.AuthMiddleware(), user.RequireRole("admin"), order.SalesReport)
	r.GET("/reports/top-products", user.AuthMiddleware(), user.RequireRole("admin"), order.TopProductsReport)
	r.GET("/reports/sales-ranking", user.AuthMiddleware(), order.SalesRankingCurrentMonth)
	r.GET("/roles", user.AuthMiddleware(), user.RequireRole("admin"), user.GetRoles)
	r.GET("/notifications", user.AuthMiddleware(), notification.GetNotifications)
	r.PUT("/notifications/:id/read", user.AuthMiddleware(), notification.MarkAsRead)
	r.GET("/settings/pricing", user.AuthMiddleware(), user.RequireRole("admin"), handler.GetPricingConfig)
	r.PUT("/settings/pricing", user.AuthMiddleware(), user.RequireRole("admin"), handler.UpdatePricingConfig)

	// Price Tiers - Sistema de niveles de precio configurables
	r.GET("/settings/price-tiers", handler.GetPriceTiers)                     // Público (muestra solo activos)
	r.GET("/settings/price-tiers/calculate", handler.CalculatePricesForTiers) // Calcular precios
	r.GET("/settings/price-tiers/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.GetPriceTier)
	r.POST("/settings/price-tiers", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.CreatePriceTier)
	r.PUT("/settings/price-tiers/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdatePriceTier)
	r.DELETE("/settings/price-tiers/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.DeletePriceTier)
	r.PUT("/settings/price-tiers/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ReorderPriceTiers)
	r.POST("/settings/price-tiers/recalculate-products", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.RecalculateAllProductPrices)

	// Topbar: public read, admin/encargado update
	r.GET("/settings/topbar", handler.GetTopbar)
	r.PUT("/settings/topbar", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateTopbar)

	// Banners (homepage slides) - public & admin
	r.GET("/public/banners", handler.GetPublicBanners)
	r.GET("/settings/banners", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ListBanners)
	r.POST("/settings/banners", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.CreateBanner)
	r.PUT("/settings/banners/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateBanner)
	r.DELETE("/settings/banners/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.DeleteBanner)
	r.PUT("/settings/banners/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ReorderBanners)
	// Videos (home video blocks) - public & admin
	r.GET("/public/videos", handler.GetPublicVideos)
	r.GET("/settings/videos", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ListVideos)
	r.POST("/settings/videos", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.CreateVideo)
	r.PUT("/settings/videos/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateVideo)
	r.DELETE("/settings/videos/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.DeleteVideo)
	r.PUT("/settings/videos/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ReorderVideos)

	// Home sections (curated homepage entries) - public & admin
	r.GET("/public/home_sections", handler.GetPublicHomeSections)
	r.GET("/settings/home_sections", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ListHomeSections)
	r.POST("/settings/home_sections", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.CreateHomeSection)
	r.POST("/settings/home_sections/sync-from-tags", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.SyncHomeSectionsFromTags)
	r.PUT("/settings/home_sections/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateHomeSection)
	r.DELETE("/settings/home_sections/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.DeleteHomeSection)
	r.PUT("/settings/home_sections/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ReorderHomeSections)

	// Home section configurations (manage section settings) - public & admin
	r.GET("/public/home_section_configs", handler.GetPublicHomeSectionConfigs)
	r.GET("/settings/home_section_configs", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ListHomeSectionConfigs)
	r.GET("/settings/home_section_configs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.GetHomeSectionConfig)
	r.PUT("/settings/home_section_configs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateHomeSectionConfig)
	r.PUT("/settings/home_section_configs/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.ReorderHomeSectionConfigs)
	r.POST("/settings/home_section_configs", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.CreateHomeSectionConfig)
	r.DELETE("/settings/home_section_configs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.DeleteHomeSectionConfig)

	// Perfil del usuario autenticado
	r.GET("/me", user.AuthMiddleware(), user.GetProfile)
	r.PUT("/me", user.AuthMiddleware(), user.UpdateProfile)

	// Subcategorías (solo admin)
	r.GET("/subcategories", user.AuthMiddleware(), user.RequireRole("admin"), category.ListAllSubcategories(db))
	r.POST("/subcategories", user.AuthMiddleware(), user.RequireRole("admin"), category.CreateSubcategory(db))
	r.GET("/categories/:category_id/subcategories", user.AuthMiddleware(), user.RequireRole("admin"), category.ListSubcategories(db))
	// Public endpoint for subcategories
	r.GET("/public/categories/:category_id/subcategories", category.ListSubcategories(db))
	r.PUT("/subcategories/:id", user.AuthMiddleware(), user.RequireRole("admin"), category.UpdateSubcategory(db))
	r.DELETE("/subcategories/:id", user.AuthMiddleware(), user.RequireRole("admin"), category.DeleteSubcategory(db))

	// Public bestsellers snapshot
	r.GET("/public/bestsellers", order.GetLatestBestsellers)

	// FAQs - Preguntas frecuentes
	// Ruta pública (sin autenticación) - solo muestra FAQs activas
	r.GET("/faqs", faq.ListFAQs(db))
	// Rutas de administración (solo admin/encargado)
	r.GET("/admin/faqs", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.ListFAQs(db))
	r.POST("/admin/faqs", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.CreateFAQ(db))
	r.GET("/admin/faqs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.GetFAQ(db))
	r.PUT("/admin/faqs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.UpdateFAQ(db))
	r.DELETE("/admin/faqs/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.DeleteFAQ(db))
	r.PUT("/admin/faqs/reorder", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), faq.UpdateFAQOrder(db))

	// Contact settings (configuración de contacto)
	r.GET("/settings/contact", handler.GetContactSettings)
	r.PUT("/settings/contact", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), handler.UpdateContactSettings)

	// Remitos internos (traslados de stock entre ubicaciones)
	// Solo admin y encargado pueden ver y confirmar remitos
	r.GET("/remitos-internos/pendientes", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), remito.ListRemitosInternosPendientes)
	r.GET("/remitos-internos/historico", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), remito.ListRemitosInternosHistorico)
	r.GET("/remitos-internos/:id", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), remito.GetRemitoInterno)
	r.POST("/remitos-internos/:id/confirmar", user.AuthMiddleware(), user.RequireAnyRole("admin", "encargado"), remito.ConfirmarRecepcionRemito)
	r.GET("/carts/:cart_id/remitos-internos", user.AuthMiddleware(), user.RequireAnyRole("admin", "vendedora", "encargado"), remito.GetRemitosByCart)

	return r
}

// Ejemplo: para proteger otros endpoints solo para admin o vendedor, puedes hacer:
// r.GET("/orders", user.AuthMiddleware(), user.RequireRole("admin"), order.ListAllOrders)
