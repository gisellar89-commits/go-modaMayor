  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

interface LocationStock {
  ID: number;
  product_id: number;
  variant_id?: number;
  location: string;
  stock: number;
  reserved: number;
}

interface StockMovement {
  ID: number;
  CreatedAt: string;
  product_id: number;
  variant_id?: number;
  location: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference?: string;
  user_id?: number;
  user_name?: string;
  notes?: string;
}

interface ProductVariant {
  ID: number;
  product_id: number;
  color: string;
  size: string;
  sku: string;
  color_hex?: string;
  stocks?: LocationStock[];
}

interface Product {
  ID: number;
  name: string;
  description?: string;
  sku: string;
  category_id?: number;
  subcategory_id?: number;
  supplier_id?: number;
  image_url?: string;
  variants?: ProductVariant[];
  stocks?: LocationStock[];
}

interface Category {
  ID: number;
  name: string;
}

interface Supplier {
  ID: number;
  name: string;
}

export default function InventarioPage() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Permisos basados en rol
  const canEdit = auth?.user?.role === "admin" || auth?.user?.role === "encargado";
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("deposito");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedSupplier, setSelectedSupplier] = useState<number | "all">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "reserved">("all");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const locations = ["deposito", "mendoza", "salta"];
  
  // Expansión de productos con variantes
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  
  // Estado para feedback de escaneo
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  
  // Modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailVariant, setDetailVariant] = useState<ProductVariant | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<"locations" | "movements">("locations");
  
  // Movimientos de stock
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  
  // Edición inline
  const [editingStock, setEditingStock] = useState<{
    variant_id?: number;
    product_id: number;
    location: string;
    value: number;
  } | null>(null);

  useEffect(() => {
    loadInventory();
    loadCategories();
    loadSuppliers();
    // Leer parámetro de búsqueda de la URL
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    // Leer parámetro de filtro de stock de la URL
    const filterParam = searchParams.get('filter');
    if (filterParam === 'low') {
      setStockFilter('low');
    } else if (filterParam === 'out') {
      setStockFilter('out');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (e) {
      console.error("Error cargando categorías:", e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/suppliers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data || []);
      }
    } catch (e) {
      console.error("Error cargando proveedores:", e);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Cargar productos con variantes y stocks
      const resProducts = await fetch(`${API_URL}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resProducts.ok) throw new Error("Error cargando productos");
      const responseData = await resProducts.json();
      
      // El endpoint devuelve {items: [], total: number}
      const productsData = responseData.items || [];
      
      if (!Array.isArray(productsData)) {
        console.error("productsData no es un array:", productsData);
        setProducts([]);
        return;
      }
      
      // Cargar stocks para cada producto
      const enrichedProducts = await Promise.all(
        productsData.map(async (product: Product) => {
          // Cargar variantes
          const resVariants = await fetch(`${API_URL}/products/${product.ID}/variants`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          let variants: ProductVariant[] = [];
          if (resVariants.ok) {
            variants = await resVariants.json();
            
            // Si tiene variantes, cargar stocks para cada una
            if (variants.length > 0) {
              const variantsWithStocks = await Promise.all(
                variants.map(async (variant) => {
                  const resStocks = await fetch(
                    `${API_URL}/location-stocks?variant_id=${variant.ID}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {}, }
                  );
                  if (resStocks.ok) {
                    const stocks = await resStocks.json();
                    return { ...variant, stocks: stocks || [] };
                  }
                  return { ...variant, stocks: [] };
                })
              );
              
              return { ...product, variants: variantsWithStocks };
            }
          }
          
          // Si no tiene variantes, cargar stocks del producto directamente (con variant_id NULL)
          const resStocks = await fetch(
            `${API_URL}/location-stocks?product_id=${product.ID}&variant_id=null`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {}, }
          );
          if (resStocks.ok) {
            const stocks = await resStocks.json();
            return { ...product, stocks: stocks || [], variants: [] };
          }
          
          return { ...product, stocks: [], variants: [] };
        })
      );
      
      setProducts(enrichedProducts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockForLocation = (stocks: LocationStock[] | undefined, location: string): number => {
    if (!stocks) return 0;
    const locationStock = stocks.find(s => s.location === location);
    return locationStock?.stock || 0;
  };

  const getReservedForLocation = (stocks: LocationStock[] | undefined, location: string): number => {
    if (!stocks) return 0;
    const locationStock = stocks.find(s => s.location === location);
    return locationStock?.reserved || 0;
  };

  const getTotalStockForProduct = (product: Product, location: string): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => 
        sum + getStockForLocation(variant.stocks, location), 0
      );
    }
    return getStockForLocation(product.stocks, location);
  };

  const toggleProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const openDetailModal = (variant: ProductVariant | null, product: Product) => {
    setDetailVariant(variant);
    setDetailProduct(product);
    setActiveTab("locations");
    setShowDetailModal(true);
    loadMovements(variant?.ID, product.ID);
  };

  const loadMovements = async (variantId?: number, productId?: number) => {
    try {
      setLoadingMovements(true);
      const token = localStorage.getItem("token");
      
      let url = `${API_URL}/stock-movements?`;
      const params = [];
      if (productId) params.push(`product_id=${productId}`);
      if (variantId) params.push(`variant_id=${variantId}`);
      params.push("limit=50"); // Últimos 50 movimientos
      url += params.join("&");
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!res.ok) throw new Error("Error cargando movimientos");
      const data = await res.json();
      setMovements(data || []);
    } catch (e: any) {
      console.error("Error cargando movimientos:", e);
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleUpdateStock = async (
    variantId: number | undefined,
    productId: number,
    location: string,
    newStock: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      const payload = variantId
        ? { variant_id: variantId, location, quantity: newStock }
        : { product_id: productId, location, quantity: newStock };
      
      const res = await fetch(`${API_URL}/products/${productId}/stocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ stocks: [payload] })
      });
      
      if (!res.ok) throw new Error("Error actualizando stock");
      
      setSuccess("Stock actualizado exitosamente");
      setEditingStock(null);
      loadInventory();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getStockForLocationAllVariants = (product: Product, location: string): number => {
    let total = 0;
    
    // Sumar stock de variantes
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        total += getStockForLocation(variant.stocks, location);
      });
    } else {
      // Producto sin variantes
      total = getStockForLocation(product.stocks, location);
    }
    
    return total;
  };

  const filteredProducts = products.filter(product => {
    // Filtro de búsqueda con validación de campos opcionales
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const productCode = `PROD-${String(product.ID).padStart(5, '0')}`.toLowerCase();
      const matchesSearch = 
        productCode.includes(query) ||
        String(product.ID).includes(query) ||
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        product.variants?.some(v => v.sku && v.sku.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Filtro de categoría
    if (selectedCategory !== "all" && product.category_id !== selectedCategory) {
      return false;
    }
    
    // Filtro de proveedor
    if (selectedSupplier !== "all" && product.supplier_id !== selectedSupplier) {
      return false;
    }
    
    // Filtro de stock
    if (stockFilter !== "all") {
      const totalStock = getStockForLocationAllVariants(product, selectedLocation);
      
      if (stockFilter === "out" && totalStock > 0) {
        return false;
      }
      
      if (stockFilter === "low" && (totalStock === 0 || totalStock > lowStockThreshold)) {
        return false;
      }
      
      if (stockFilter === "reserved") {
        // Verificar si el producto o alguna de sus variantes tiene stock reservado en la ubicación seleccionada
        let hasReserved = false;
        
        if (product.variants && product.variants.length > 0) {
          // Producto con variantes: revisar cada variante
          hasReserved = product.variants.some(variant => {
            const reserved = getReservedForLocation(variant.stocks, selectedLocation);
            return reserved > 0;
          });
        } else {
          // Producto sin variantes: revisar sus stocks directos
          const reserved = getReservedForLocation(product.stocks, selectedLocation);
          hasReserved = reserved > 0;
        }
        
        if (!hasReserved) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Ordenar por stock ascendente cuando el filtro es "low"
    if (stockFilter === "low") {
      const stockA = getStockForLocationAllVariants(a, selectedLocation);
      const stockB = getStockForLocationAllVariants(b, selectedLocation);
      return stockA - stockB; // Ascendente: menor stock primero
    }
    // Ordenar por stock ascendente cuando el filtro es "out"
    if (stockFilter === "out") {
      const stockA = getStockForLocationAllVariants(a, selectedLocation);
      const stockB = getStockForLocationAllVariants(b, selectedLocation);
      return stockA - stockB;
    }
    // Sin ordenamiento especial para "all"
    return 0;
  });

  // Función para manejar escaneo de código (detección de Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      
      // Si hay exactamente 1 producto filtrado, expandirlo automáticamente
      if (filteredProducts.length === 1) {
        const product = filteredProducts[0];
        setExpandedProducts(new Set([product.ID]));
        setScanFeedback(`✓ Producto encontrado: ${product.name}`);
        
        // Limpiar feedback después de 2 segundos
        setTimeout(() => setScanFeedback(null), 2000);
        return;
      }
      
      // Si hay múltiples productos pero solo 1 tiene la variante que coincide
      if (filteredProducts.length > 1 && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        let matchingProduct: Product | null = null;
        let matchCount = 0;
        
        for (const product of filteredProducts) {
          const hasMatchingVariant = product.variants?.some(v => 
            v.sku && v.sku.toLowerCase().includes(query)
          );
          
          if (hasMatchingVariant) {
            matchingProduct = product;
            matchCount++;
          }
        }
        
        // Si solo 1 producto tiene variantes que coinciden, expandirlo
        if (matchCount === 1 && matchingProduct) {
          setExpandedProducts(new Set([matchingProduct.ID]));
          setScanFeedback(`✓ Variante encontrada en: ${matchingProduct.name}`);
          
          // Limpiar feedback después de 2 segundos
          setTimeout(() => setScanFeedback(null), 2000);
        }
      }
    }
  };

  if (loading) return <div className="p-6">Cargando inventario...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="text-sm text-gray-600">
          Buscar por nombre, SKU o tags · Seleccionar ubicación para edición rápida
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Feedback de escaneo */}
      {scanFeedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {scanFeedback}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por código, nombre, SKU... (presiona Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Ubicación */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.ID} value={cat.ID}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Proveedor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los proveedores</option>
              {suppliers.map(sup => (
                <option key={sup.ID} value={sup.ID}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Nivel de stock */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nivel de stock
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "out" | "reserved")}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los productos</option>
              <option value="low">Stock bajo (≤ {lowStockThreshold})</option>
              <option value="out">Sin stock</option>
              <option value="reserved">🔒 Con stock reservado</option>
            </select>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedSupplier("all");
                setStockFilter("all");
              }}
              className="border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 text-sm"
            >
              Limpiar filtros
            </button>
            {canEdit && (
              <button className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 text-sm">
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center text-sm font-medium text-gray-700">
          <div className="w-1/4">Producto</div>
          <div className="w-32">Código</div>
          <div className="w-32">Stock ({selectedLocation.toUpperCase()})</div>
          <div className="flex-1">Variantes</div>
          <div className="w-32">SKU</div>
          <div className="w-20 text-center">Detalle</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {filteredProducts.map((product) => {
            const hasVariants = product.variants && product.variants.length > 0;
            const isExpanded = expandedProducts.has(product.ID);
            const totalStock = getTotalStockForProduct(product, selectedLocation);

            return (
              <div key={product.ID}>
                {/* Product Row */}
                <div className="px-4 py-4 hover:bg-gray-50 flex items-center">
                  <div className="w-1/4 flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url.startsWith('/') ? `${API_URL}${product.image_url}` : product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.description || "Sin descripción"}</div>
                    </div>
                  </div>
                  
                  <div className="w-32 text-sm text-gray-700">PROD-{String(product.ID).padStart(5, '0')}</div>
                  
                  <div className="w-32">
                    {canEdit ? (
                      <input
                        type="number"
                        value={totalStock}
                        readOnly={hasVariants}
                        onChange={(e) => {
                          if (!hasVariants) {
                            setEditingStock({
                              product_id: product.ID,
                              location: selectedLocation,
                              value: Number(e.target.value)
                            });
                          }
                        }}
                        onBlur={() => {
                          if (editingStock && !hasVariants) {
                            handleUpdateStock(
                              undefined,
                              product.ID,
                              selectedLocation,
                              editingStock.value
                            );
                          }
                        }}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{totalStock}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {hasVariants ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {product.variants!.length} variantes
                        </span>
                        <button
                          onClick={() => toggleProductExpansion(product.ID)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {isExpanded ? "▲ Ocultar" : "▼ Ver"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin variantes</span>
                    )}
                  </div>
                  
                  <div className="w-32 text-sm text-gray-700">
                    {hasVariants 
                      ? `${product.variants!.length} SKUs` 
                      : product.variants?.[0]?.sku || "—"}
                  </div>
                  
                  <div className="w-20 text-center">
                    {!hasVariants && (
                      <button 
                        onClick={() => openDetailModal(null, product)}
                        className="w-9 h-9 border border-gray-300 rounded hover:bg-gray-50"
                        title="Ver detalle por ubicación"
                      >
                        ⟳
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Variants */}
                {isExpanded && hasVariants && (
                  <div className="bg-gray-50 px-16 py-4 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-3">Variantes</div>
                    <div className="space-y-2">
                      {product.variants!.map((variant) => {
                        const stock = getStockForLocation(variant.stocks, selectedLocation);
                        const reserved = getReservedForLocation(variant.stocks, selectedLocation);
                        const available = stock - reserved;

                        return (
                          <div key={variant.ID} className="flex items-center gap-4 py-2">
                            <div className="w-48 flex items-center gap-2">
                              {variant.color_hex && (
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: variant.color_hex }}
                                />
                              )}
                              <span className="text-sm text-gray-700">
                                {variant.color} / {variant.size}
                              </span>
                            </div>
                            
                            <div className="w-48 text-xs text-gray-500">SKU: {variant.sku}</div>
                            
                            <div className="w-32">
                              <span className="text-xs text-gray-600 mr-2">{selectedLocation.toUpperCase()}:</span>
                              {canEdit ? (
                                <input
                                  type="number"
                                  value={stock}
                                  onChange={(e) => {
                                    setEditingStock({
                                      variant_id: variant.ID,
                                      product_id: product.ID,
                                      location: selectedLocation,
                                      value: Number(e.target.value)
                                    });
                                  }}
                                  onBlur={() => {
                                    if (editingStock?.variant_id === variant.ID) {
                                      handleUpdateStock(
                                        variant.ID,
                                        product.ID,
                                        selectedLocation,
                                        editingStock.value
                                      );
                                    }
                                  }}
                                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <span className="text-sm text-gray-700">{stock}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 text-xs">
                              {reserved > 0 ? (
                                <div className="inline-flex items-center gap-1 bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded">
                                  <span className="font-semibold">🔒 Reservada: {reserved}</span>
                                  <span className="text-yellow-600">· Disponible: {available}</span>
                                </div>
                              ) : (
                                <span className="text-gray-600">
                                  Reservada: {reserved} · Disponible: {available}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {canEdit && (
                                <button className="w-8 h-8 border border-gray-300 rounded hover:bg-white text-sm">
                                  ✎
                                </button>
                              )}
                              <button
                                onClick={() => openDetailModal(variant, product)}
                                className="w-8 h-8 border border-gray-300 rounded hover:bg-white text-sm"
                                title="Ver detalle"
                              >
                                ⟳
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Detalle de stock — {detailProduct.name}
                {detailVariant && ` · ${detailVariant.color} / ${detailVariant.size}`}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {detailVariant ? `SKU: ${detailVariant.sku}` : `Código: PROD-${String(detailProduct.ID).padStart(5, '0')}`}
              </p>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 flex gap-2 border-b">
              <button
                onClick={() => setActiveTab("locations")}
                className={`px-6 py-2 rounded-t ${
                  activeTab === "locations"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Ubicaciones
              </button>
              <button
                onClick={() => setActiveTab("movements")}
                className={`px-6 py-2 rounded-t ${
                  activeTab === "movements"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Movimientos
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "locations" && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center text-sm font-medium text-gray-700">
                    <div className="flex-1">Ubicación</div>
                    <div className="w-32">Cantidad</div>
                    <div className="w-32">Reservada</div>
                    <div className="w-32">Disponible</div>
                    <div className="w-24">Acciones</div>
                  </div>
                  
                  {/* Rows */}
                  <div className="divide-y divide-gray-100">
                    {locations.map((location) => {
                      const stocks = detailVariant ? detailVariant.stocks : detailProduct.stocks;
                      const stock = getStockForLocation(stocks, location);
                      const reserved = getReservedForLocation(stocks, location);
                      const available = stock - reserved;

                      return (
                        <div key={location} className="px-4 py-3 flex items-center bg-white">
                          <div className="flex-1 text-sm text-gray-700 capitalize">
                            {location} — {location === "deposito" ? "Almacén central" : `Sucursal ${location}`}
                          </div>
                          <div className="w-32">
                            {canEdit ? (
                              <input
                                type="number"
                                value={stock}
                                onChange={(e) => {
                                  setEditingStock({
                                    variant_id: detailVariant?.ID,
                                    product_id: detailProduct.ID,
                                    location,
                                    value: Number(e.target.value)
                                  });
                                }}
                                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-700">{stock}</span>
                            )}
                          </div>
                          <div className="w-32 text-sm text-gray-600">
                            Reservada: {reserved}
                          </div>
                          <div className="w-32 text-sm text-gray-600">
                            Disponible: {available}
                          </div>
                          <div className="w-24">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  if (editingStock?.location === location) {
                                    handleUpdateStock(
                                      detailVariant?.ID,
                                      detailProduct.ID,
                                      location,
                                      editingStock.value
                                    );
                                  }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                Ajustar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "movements" && (
                <div>
                  {loadingMovements ? (
                    <div className="text-center py-12 text-gray-500">
                      Cargando movimientos...
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No hay movimientos registrados para esta variante
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                        <div className="col-span-2">Fecha</div>
                        <div className="col-span-2">Usuario</div>
                        <div className="col-span-1">Ubicación</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-1 text-center">Cantidad</div>
                        <div className="col-span-1 text-center">Anterior</div>
                        <div className="col-span-1 text-center">Nuevo</div>
                        <div className="col-span-2">Motivo</div>
                      </div>
                      
                      {/* Rows */}
                      <div className="divide-y divide-gray-100">
                        {movements.map((movement) => {
                          const isPositive = movement.quantity > 0;
                          const movementTypeLabels: Record<string, string> = {
                            adjustment: "Ajuste",
                            initial: "Stock inicial",
                            sale: "Venta",
                            return: "Devolución",
                            transfer: "Transferencia"
                          };
                          
                          return (
                            <div key={movement.ID} className="px-4 py-3 grid grid-cols-12 gap-4 bg-white hover:bg-gray-50">
                              <div className="col-span-2 text-sm text-gray-700">
                                {new Date(movement.CreatedAt).toLocaleString("es-AR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                              <div className="col-span-2 text-sm text-gray-700">
                                {movement.user_name || "Sistema"}
                              </div>
                              <div className="col-span-1 text-sm text-gray-600 capitalize">
                                {movement.location}
                              </div>
                              <div className="col-span-2 text-sm">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  movement.movement_type === "sale" ? "bg-red-100 text-red-800" :
                                  movement.movement_type === "return" ? "bg-green-100 text-green-800" :
                                  movement.movement_type === "initial" ? "bg-blue-100 text-blue-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {movementTypeLabels[movement.movement_type] || movement.movement_type}
                                </span>
                              </div>
                              <div className={`col-span-1 text-sm text-center font-medium ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}>
                                {isPositive ? "+" : ""}{movement.quantity}
                              </div>
                              <div className="col-span-1 text-sm text-gray-600 text-center">
                                {movement.previous_stock}
                              </div>
                              <div className="col-span-1 text-sm text-gray-700 text-center font-medium">
                                {movement.new_stock}
                              </div>
                              <div className="col-span-2 text-sm text-gray-600">
                                {movement.reason || movement.notes || "—"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cerrar
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setSuccess("Cambios guardados");
                    setShowDetailModal(false);
                    loadInventory();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
