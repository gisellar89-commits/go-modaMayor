"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import { fetchProductsPaged, fetchCategories, Product, Category } from "../../utils/api";

export default function ProductosClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  // Estados para los dropdowns de filtros
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  const searchParams = useSearchParams();

  // Initialize filters from query params
  useEffect(() => {
    if (!searchParams) return;
    const cat = searchParams.get("category");
    const sub = searchParams.get("subcategory");
    const q = searchParams.get("search");
    if (cat) setSelectedCategory(Number(cat));
    if (sub) setSelectedSubcategory(Number(sub));
    if (q !== null && q !== undefined) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchProductsPaged({ search, page, limit, category: selectedCategory, subcategory: selectedSubcategory })
      .then((res) => {
        const computeTotalStock = (p: any) => {
          let total = 0;
          if (Array.isArray(p.location_stocks) && p.location_stocks.length > 0) {
            for (const ls of p.location_stocks) {
              const q = ls?.quantity ?? ls?.qty ?? ls?.stock ?? ls?.available ?? 0;
              total += Number(q || 0);
            }
            return total;
          }
          const variants = p.variants ?? [];
          for (const v of variants) {
            if (Array.isArray(v?.location_stocks)) {
              for (const ls of v.location_stocks) {
                const q = ls?.quantity ?? ls?.qty ?? ls?.stock ?? ls?.available ?? 0;
                total += Number(q || 0);
              }
            } else {
              const q = v?.stock ?? v?.quantity ?? v?.available ?? 0;
              total += Number(q || 0);
            }
          }
          return total;
        };

        const itemsWithStock = (res.items || []).map((p: any) => ({ ...(p || {}), _totalStock: computeTotalStock(p) }));
        itemsWithStock.sort((a: any, b: any) => {
          const sa = Number(a._totalStock || 0);
          const sb = Number(b._totalStock || 0);
          if (sa === sb) return 0;
          return sb - sa;
        });
        setProducts(itemsWithStock);
        setTotal(res.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, page, limit, selectedCategory, selectedSubcategory]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'}/categories/${selectedCategory}/subcategories`, { 
      headers: token ? { Authorization: `Bearer ${token}` } : {} 
    })
      .then((res) => res.json())
      .then((data) => setSubcategories(Array.isArray(data) ? data : []))
      .catch(() => setSubcategories([]));
  }, [selectedCategory]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetchCategories(token ?? undefined).then(setCategories).catch(() => setCategories([]));
  }, []);

  // Reset page when filters/search change
  useEffect(() => setPage(1), [search, selectedCategory, selectedSubcategory]);

  // Client-side filters
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Clear client filters when category/subcategory changes
  useEffect(() => {
    setSelectedColors([]);
    setSelectedSizes([]);
  }, [selectedCategory, selectedSubcategory]);

  // Aggregate available colors and sizes from products' variants
  const availableFilters = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    for (const p of products) {
      const variants = p.variants ?? [];
      for (const v of variants) {
        if (v.color) colors.add(String(v.color));
        if (v.size) sizes.add(String(v.size));
      }
    }
    return { colors: Array.from(colors).filter(Boolean), sizes: Array.from(sizes).filter(Boolean) };
  }, [products]);

  // Sort sizes
  const sortedSizes = useMemo(() => {
    const sizes = Array.from(availableFilters.sizes);
    const isNumeric = (s: string) => /^\d+(?:[.,]\d+)?$/.test(String(s).trim());
    const normNum = (s: string) => parseFloat(String(s).replace(',', '.'));
    const nums = sizes.filter(isNumeric).sort((a, b) => normNum(a) - normNum(b));
    const others = sizes.filter((s) => !isNumeric(s)).sort((a, b) => String(a).localeCompare(String(b)));
    return [...nums, ...others];
  }, [availableFilters.sizes]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Price check
      const price = p.wholesale_price !== undefined && p.wholesale_price !== null ? Number(p.wholesale_price) : NaN;
      if (!Number.isNaN(price)) {
        if (minPrice && price < Number(minPrice)) return false;
        if (maxPrice && price > Number(maxPrice)) return false;
      }

      // Color/size check
      if (selectedColors.length === 0 && selectedSizes.length === 0) return true;

      const variants = p.variants ?? [];
      if (variants.length === 0) return false;
      return variants.some((v: any) => {
        const color = v.color ? String(v.color) : "";
        const size = v.size ? String(v.size) : "";
        const okColor = selectedColors.length === 0 ? true : selectedColors.includes(color);
        const okSize = selectedSizes.length === 0 ? true : selectedSizes.includes(size);
        return okColor && okSize;
      });
    });
  }, [products, selectedColors, selectedSizes, minPrice, maxPrice]);

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedSubcategory ? 1 : 0) + 
    selectedColors.length + 
    selectedSizes.length + 
    (minPrice || maxPrice ? 1 : 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header with search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 title-gradient">Catálogo de productos</h1>
          
          {/* Search bar */}
          <div className="mb-4">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Buscar productos..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Categoría filter */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                  selectedCategory 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                <span>Categoría</span>
                {selectedCategory && <span className="font-bold">✓</span>}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCategoryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(undefined);
                          setSelectedSubcategory(undefined);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                          !selectedCategory ? 'bg-pink-50 font-semibold text-pink-600' : ''
                        }`}
                      >
                        Todas las categorías
                      </button>
                      {categories.map((cat) => (
                        <div key={cat.id ?? cat.ID}>
                          <button
                            onClick={() => {
                              const catId = cat.id ?? cat.ID;
                              setSelectedCategory(catId);
                              setSelectedSubcategory(undefined);
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                              selectedCategory === (cat.id ?? cat.ID) ? 'bg-pink-50 font-semibold text-pink-600' : ''
                            }`}
                          >
                            {cat.name}
                          </button>
                          
                          {/* Subcategorías */}
                          {selectedCategory === (cat.id ?? cat.ID) && subcategories.length > 0 && (
                            <div className="ml-4 border-l-2 border-gray-200">
                              {subcategories.map((sub) => (
                                <button
                                  key={sub.ID ?? sub.id}
                                  onClick={() => {
                                    setSelectedSubcategory(sub.ID ?? sub.id);
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                                    selectedSubcategory === (sub.ID ?? sub.id) ? 'bg-pink-50 font-semibold text-pink-600' : 'text-gray-600'
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Color filter */}
            <div className="relative">
              <button
                onClick={() => setShowColorDropdown(!showColorDropdown)}
                className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                  selectedColors.length > 0 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                <span>Color</span>
                {selectedColors.length > 0 && <span className="bg-white text-pink-600 px-2 py-0.5 rounded-full text-xs font-bold">{selectedColors.length}</span>}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showColorDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowColorDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 max-h-96 overflow-y-auto">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">Colores</span>
                        {selectedColors.length > 0 && (
                          <button
                            onClick={() => setSelectedColors([])}
                            className="text-xs text-pink-600 hover:text-pink-700"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {availableFilters.colors.map((color) => (
                          <label
                            key={color}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColors.includes(color)}
                              onChange={() => toggleColor(color)}
                              className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm">{color}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Size filter */}
            <div className="relative">
              <button
                onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                  selectedSizes.length > 0 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                <span>Talle</span>
                {selectedSizes.length > 0 && <span className="bg-white text-pink-600 px-2 py-0.5 rounded-full text-xs font-bold">{selectedSizes.length}</span>}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSizeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSizeDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 max-h-96 overflow-y-auto">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">Talles</span>
                        {selectedSizes.length > 0 && (
                          <button
                            onClick={() => setSelectedSizes([])}
                            className="text-xs text-pink-600 hover:text-pink-700"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {sortedSizes.map((size) => (
                          <label
                            key={size}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSizes.includes(size)}
                              onChange={() => toggleSize(size)}
                              className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Price filter */}
            <div className="relative">
              <button
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                  minPrice || maxPrice 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                <span>Precio</span>
                {(minPrice || maxPrice) && <span className="font-bold">✓</span>}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPriceDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowPriceDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 p-4">
                    <div className="mb-3">
                      <span className="font-semibold text-gray-700 block mb-3">Rango de precio</span>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Mínimo"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <input
                          type="number"
                          placeholder="Máximo"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setMinPrice("");
                            setMaxPrice("");
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setShowPriceDropdown(false)}
                          className="flex-1 px-3 py-2 text-sm bg-pink-500 text-white rounded hover:bg-pink-600"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clear all filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Limpiar filtros ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="container mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No se encontraron productos</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                Mostrando <span className="font-semibold">{filteredProducts.length}</span> productos
                {total && ` de ${total} totales`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id ?? product.ID} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {total && total > limit && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2">
                  Página {page} de {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
