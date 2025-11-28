"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import FilterCheckbox from "../../components/FilterCheckbox";
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
  
  // Estados para filtros móviles
  const [mobileFilterOpen, setMobileFilterOpen] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    colors: false,
    sizes: false,
    price: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Estados para "Ver más" en colores y talles
  const [showAllColorsInPanel, setShowAllColorsInPanel] = useState(false);
  const [showAllSizesInPanel, setShowAllSizesInPanel] = useState(false);
  const [visibleColorsCount, setVisibleColorsCount] = useState(5);
  const [visibleSizesCount, setVisibleSizesCount] = useState(5);
  const INITIAL_ITEMS = 5;
  const LOAD_MORE_STEP = 5;

  // Bloquear scroll del body cuando el panel está abierto
  useEffect(() => {
    if (mobileFilterOpen === 'panel') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  const searchParams = useSearchParams();

  // Initialize filters from query params so the UI highlights the proper category/subcategory
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
        // compute total stock for each product and sort so products with stock appear first
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
        // sort descending by total stock so products with stock appear first
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

  // load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'}/public/categories/${selectedCategory}/subcategories`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) {
          // Si la API devuelve 403 (o cualquier error), dejamos subcategorías vacías
          // para no romper la UI ni spamear la consola.
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setSubcategories([]);
          return;
        }
        setSubcategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubcategories([]));
  }, [selectedCategory]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetchCategories(token ?? undefined).then(setCategories).catch(() => setCategories([]));
  }, []);

  // reset page when filters/search change
  useEffect(() => setPage(1), [search, selectedCategory, selectedSubcategory]);

  // UI filters (client-side) built from returned products' variants
  // Now support multi-select (arrays) so user can check multiple colors/sizes
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  // price range filter (strings to allow empty input)
  const [minPrice, setMinPrice] = useState<string | number | null>(null);
  const [maxPrice, setMaxPrice] = useState<string | number | null>(null);
  // show only first N colors/sizes by default
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const MAX_VISIBLE = 10;

  // Clear client filters when category/subcategory changes
  useEffect(() => {
    setSelectedColors([]);
    setSelectedSizes([]);
  }, [selectedCategory, selectedSubcategory]);

  const grouped = useMemo(() => {
    // group products by category->subcategory if category info is present
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const cat = p.category?.name ?? "Sin categoría";
      const key = `${cat}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [products]);

  // Aggregate available colors and sizes from products' variants (for the left filters)
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

  // sort sizes: numeric ascending first, then non-numeric (alphabetical)
  const sortedSizes = useMemo(() => {
    const sizes = Array.from(availableFilters.sizes);
    const isNumeric = (s: string) => /^\d+(?:[.,]\d+)?$/.test(String(s).trim());
    const normNum = (s: string) => parseFloat(String(s).replace(',', '.'));
    const nums = sizes.filter(isNumeric).sort((a, b) => normNum(a) - normNum(b));
    const others = sizes.filter((s) => !isNumeric(s)).sort((a, b) => String(a).localeCompare(String(b)));
    return [...nums, ...others];
  }, [availableFilters.sizes]);

  // Counts for each filter option (how many products include that color/size)
  const colorCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      const seen = new Set<string>();
      const variants = p.variants ?? [];
      for (const v of variants) {
        if (!v.color) continue;
        const k = String(v.color);
        if (seen.has(k)) continue;
        seen.add(k);
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return m;
  }, [products]);

  const sizeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      const seen = new Set<string>();
      const variants = p.variants ?? [];
      for (const v of variants) {
        if (!v.size) continue;
        const k = String(v.size);
        if (seen.has(k)) continue;
        seen.add(k);
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return m;
  }, [products]);

  // Definir availableColors y availableSizes para los filtros móviles
  const availableColors = availableFilters.colors;
  const availableSizes = sortedSizes;

  // Apply client-side filters to the products displayed (multi-select)
  const filteredProducts = useMemo(() => {
    // Also apply price filtering (wholesale_price) together with color/size multi-selects
    return products.filter((p) => {
      // price check
      const price = p.wholesale_price !== undefined && p.wholesale_price !== null ? Number(p.wholesale_price) : NaN;
      if (!Number.isNaN(price)) {
        if (minPrice !== null && minPrice !== undefined && minPrice !== "" && price < Number(minPrice)) return false;
        if (maxPrice !== null && maxPrice !== undefined && maxPrice !== "" && price > Number(maxPrice)) return false;
      }

      // if no color/size selected, product passes (as long as price passed)
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

  // Helpers to show swatches in the filters: map common names and validate CSS colors
  const isValidCssColor = (value: string) => {
    if (typeof document === 'undefined') return false;
    try {
      const s = value?.toString().trim();
      if (!s) return false;
      const el = document.createElement('div');
      el.style.backgroundColor = '';
      el.style.backgroundColor = s;
      return !!el.style.backgroundColor;
    } catch {
      return false;
    }
  };

  const colorNameMap: Record<string, string> = {
    rojo: '#ff0000',
    rojooscuro: '#8b0000',
    azul: '#0000ff',
    azulmarino: '#000080',
    negro: '#000000',
    blanco: '#ffffff',
    verde: '#008000',
    amarillo: '#ffff00',
    gris: '#808080',
    marron: '#8b4513',
    naranja: '#ff7f00',
    rosa: '#ff69b4',
    violeta: '#8a2be2',
    beige: '#f5f5dc',
  };

  const colorHeuristic = (orig: string): string | undefined => {
    if (!orig) return undefined;
    const s = String(orig).toLowerCase();
    const bases: Record<string, string> = { rojo: '#ff0000', azul: '#0000ff', verde: '#008000', negro: '#000000', blanco: '#ffffff', gris: '#808080', marron: '#8b4513', naranja: '#ff7f00', rosa: '#ff69b4', violeta: '#8a2be2', beige: '#f5f5dc', amarillo: '#ffff00' };
    let found: string | undefined;
    for (const k of Object.keys(bases)) if (s.includes(k)) { found = bases[k]; break; }
    if (!found) return undefined;
    if (/oscuro|dark/.test(s)) {
      const h = found.replace('#','');
      const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0,2),16) * 0.75)));
      const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2,4),16) * 0.75)));
      const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4,6),16) * 0.75)));
      const toHex = (v:number)=>v.toString(16).padStart(2,'0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    if (/claro|light/.test(s)) {
      const h = found.replace('#','');
      const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0,2),16) * 1.2)));
      const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2,4),16) * 1.2)));
      const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4,6),16) * 1.2)));
      const toHex = (v:number)=>v.toString(16).padStart(2,'0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return found;
  };

  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return null;
    const c = categories.find((cat) => (cat.id ?? cat.ID) === selectedCategory);
    return c?.name ?? null;
  }, [categories, selectedCategory]);

  const currentSubcategoryName = useMemo(() => {
    if (!selectedSubcategory) return null;
    const s = subcategories.find((sub: any) => (sub.id ?? sub.ID) === selectedSubcategory);
    return s?.name ?? null;
  }, [subcategories, selectedSubcategory]);

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-4 title-gradient">Catálogo de productos</h1>

      {/* Indicador de contexto de categoría actual (útil en mobile) */}
      {(currentCategoryName || currentSubcategoryName) && (
        <div className="mb-4 text-sm text-gray-700 flex flex-wrap items-center gap-1">
          <span className="font-semibold">Mostrando:</span>
          {currentCategoryName && <span>{currentCategoryName}</span>}
          {currentSubcategoryName && (
            <>
              <span>/</span>
              <span>{currentSubcategoryName}</span>
            </>
          )}
        </div>
      )}

      {/* Barra superior móvil con búsqueda y botón filtrar */}
      <div className="md:hidden mb-4">
        <div className="flex gap-2">
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar productos..." 
            className="input-themed flex-1"
          />
          <button
            onClick={() => setMobileFilterOpen('panel')}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg font-semibold whitespace-nowrap flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtrar
            {(selectedCategory || selectedColors.length > 0 || selectedSizes.length > 0) && (
              <span className="bg-white text-pink-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {(selectedCategory ? 1 : 0) + selectedColors.length + selectedSizes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel lateral de filtros (Modal Drawer) */}
      {mobileFilterOpen === 'panel' && (
        <div className="md:hidden fixed inset-0 z-[999] flex justify-end">
          {/* Overlay oscuro */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileFilterOpen(null)}
          />
          {/* Panel deslizante */}
          <div
            className="relative w-[85%] max-w-sm bg-white shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Header del panel */}
            <div className="bg-gradient-to-r from-yellow-500 to-pink-500 text-white p-4 flex items-center justify-between shadow-md flex-shrink-0">
              <h2 className="text-xl font-bold">Filtrar</h2>
              <button 
                onClick={() => setMobileFilterOpen(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido de filtros con acordeón - scrollable */}
            <div 
              className="divide-y divide-gray-200 flex-1 overflow-y-auto overflow-x-hidden px-0"
              style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}
            >
              {/* Categorías */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('categories')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base font-bold text-gray-800">Categorías</h3>
                  <svg 
                    className={`w-5 h-5 transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.categories && (
                  <div className="px-4 pb-4 space-y-1">
                    <button
                      onClick={() => { setSelectedCategory(undefined); setSelectedSubcategory(undefined); }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedCategory === undefined ? 'bg-pink-100 font-semibold text-pink-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      Todas
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id ?? c.ID}
                        onClick={() => { setSelectedCategory(c.id ?? c.ID); setSelectedSubcategory(undefined); }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedCategory === (c.id ?? c.ID) ? 'bg-pink-100 font-semibold text-pink-700' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subcategorías */}
              {selectedCategory && subcategories.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('subcategories')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-base font-bold text-gray-800">Subcategorías</h3>
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedSections.subcategories ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.subcategories && (
                    <div className="px-4 pb-4 space-y-1">
                      <button
                        onClick={() => setSelectedSubcategory(undefined)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSubcategory === undefined ? 'bg-pink-100 font-semibold text-pink-700' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        Todas
                      </button>
                      {subcategories.map((s) => (
                        <button
                          key={s.id ?? s.ID}
                          onClick={() => setSelectedSubcategory(s.id ?? s.ID)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSubcategory === (s.id ?? s.ID) ? 'bg-pink-100 font-semibold text-pink-700' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Colores */}
              {availableColors.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('colors')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-base font-bold text-gray-800">
                      Color {selectedColors.length > 0 && <span className="text-pink-600 text-sm">({selectedColors.length})</span>}
                    </h3>
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedSections.colors ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.colors && (
                    <div className="px-4 pb-4 space-y-2">
                      {availableColors.slice(0, visibleColorsCount).map((color) => {
                        const normalizedColor = String(color || '').trim().toLowerCase().replace(/\s+/g, '');
                        const cssValue = colorNameMap[normalizedColor] || colorHeuristic(String(color)) || (isValidCssColor(String(color)) ? String(color) : undefined);
                        const isChecked = selectedColors.includes(color);
                        
                        return (
                          <label key={color} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColors([...selectedColors, color]);
                                } else {
                                  setSelectedColors(selectedColors.filter((c) => c !== color));
                                }
                              }}
                              className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                            />
                            {cssValue && (
                              <span 
                                className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" 
                                style={{ backgroundColor: cssValue }}
                              />
                            )}
                            <span className="text-sm text-gray-700 flex-1">{color}</span>
                            <span className="text-xs text-gray-500">({colorCounts.get(color) || 0})</span>
                          </label>
                        );
                      })}
                      {visibleColorsCount < availableColors.length && (
                        <button
                          onClick={() => setVisibleColorsCount(prev => Math.min(prev + LOAD_MORE_STEP, availableColors.length))}
                          className="w-full text-center py-2 text-sm text-pink-600 hover:text-pink-700 font-semibold hover:bg-pink-50 rounded-lg transition-colors"
                        >
                          + Ver más ({Math.min(LOAD_MORE_STEP, availableColors.length - visibleColorsCount)})
                        </button>
                      )}
                      {visibleColorsCount > INITIAL_ITEMS && (
                        <button
                          onClick={() => setVisibleColorsCount(INITIAL_ITEMS)}
                          className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          - Ver menos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Talles */}
              {availableSizes.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('sizes')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-base font-bold text-gray-800">
                      Talle {selectedSizes.length > 0 && <span className="text-pink-600 text-sm">({selectedSizes.length})</span>}
                    </h3>
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedSections.sizes ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.sizes && (
                    <div className="px-4 pb-4 space-y-2">
                      {availableSizes.slice(0, visibleSizesCount).map((size) => {
                        const isChecked = selectedSizes.includes(size);
                        return (
                          <label key={size} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSizes([...selectedSizes, size]);
                                } else {
                                  setSelectedSizes(selectedSizes.filter((s) => s !== size));
                                }
                              }}
                              className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">{size}</span>
                            <span className="text-xs text-gray-500">({sizeCounts.get(size) || 0})</span>
                          </label>
                        );
                      })}
                      {visibleSizesCount < availableSizes.length && (
                        <button
                          onClick={() => setVisibleSizesCount(prev => Math.min(prev + LOAD_MORE_STEP, availableSizes.length))}
                          className="w-full text-center py-2 text-sm text-pink-600 hover:text-pink-700 font-semibold hover:bg-pink-50 rounded-lg transition-colors"
                        >
                          + Ver más ({Math.min(LOAD_MORE_STEP, availableSizes.length - visibleSizesCount)})
                        </button>
                      )}
                      {visibleSizesCount > INITIAL_ITEMS && (
                        <button
                          onClick={() => setVisibleSizesCount(INITIAL_ITEMS)}
                          className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          - Ver menos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Precio */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('price')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base font-bold text-gray-800">Precio</h3>
                  <svg 
                    className={`w-5 h-5 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.price && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Desde"
                        value={minPrice ?? ''}
                        onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                        className="input-themed flex-1 text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Hasta"
                        value={maxPrice ?? ''}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                        className="input-themed flex-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botones - fixed al fondo */}
            <div className="bg-white border-t-2 border-gray-200 p-4 flex gap-3 shadow-lg flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSelectedSubcategory(undefined);
                  setSelectedColors([]);
                  setSelectedSizes([]);
                  setMinPrice(null);
                  setMaxPrice(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setMobileFilterOpen(null)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <aside className="hidden md:block w-64">
          <div className="mb-6">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Buscar productos..." 
              className="input-themed w-full"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">Categorías</h3>
            <ul className="text-sm space-y-1">
              <li className={`p-2 rounded-lg cursor-pointer transition-all ${selectedCategory === undefined ? 'border-l-4 border-pink-500 pl-3 font-semibold bg-gradient-to-r from-yellow-50 to-pink-50' : 'hover:bg-gray-50'}`} onClick={() => { setSelectedCategory(undefined); setSelectedSubcategory(undefined); }}>Todas</li>
              {categories.map((c) => (
                <li key={c.id ?? c.ID} className={`p-2 rounded-lg cursor-pointer transition-all ${selectedCategory === (c.id ?? c.ID) ? 'border-l-4 border-pink-500 pl-3 font-semibold bg-gradient-to-r from-yellow-50 to-pink-50' : 'hover:bg-gray-50'}`} onClick={() => { setSelectedCategory(c.id ?? c.ID); setSelectedSubcategory(undefined); }}>{c.name}</li>
              ))}
            </ul>
            {selectedCategory && subcategories.length > 0 && (
              <div className="mt-4">
                <h4 className="text-base font-semibold mb-2 text-pink-600">Subcategorías</h4>
                <ul className="text-sm space-y-1">
                  <li className={`p-2 rounded-lg cursor-pointer transition-all ${selectedSubcategory === undefined ? 'border-l-4 border-pink-500 pl-3 font-semibold bg-gradient-to-r from-yellow-50 to-pink-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedSubcategory(undefined)}>Todas</li>
                  {subcategories.map((s) => (
                    <li key={s.id ?? s.ID} className={`p-2 rounded-lg cursor-pointer transition-all ${selectedSubcategory === (s.id ?? s.ID) ? 'border-l-4 border-pink-500 pl-3 font-semibold bg-gradient-to-r from-yellow-50 to-pink-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedSubcategory(s.id ?? s.ID)}>{s.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Filters: Color and Talle (client-side) */}
            <div className="mt-6">
              <h4 className="text-lg font-bold mb-3 bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">Filtros</h4>
              <div className="mb-4">
                <button 
                  onClick={() => { setSelectedColors([]); setSelectedSizes([]); }} 
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium hover:underline"
                >
                  ✕ Limpiar filtros
                </button>
              </div>
              <div className="mb-4">
                {/* Price range */}
                <div className="mb-4">
                  <div className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-2">💰 Precio</div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      placeholder="Desde"
                      value={minPrice ?? ''}
                      onChange={(e) => setMinPrice(e.target.value === '' ? null : e.target.value)}
                      className="input-themed w-1/2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Hasta"
                      value={maxPrice ?? ''}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? null : e.target.value)}
                      className="input-themed w-1/2 text-sm"
                    />
                  </div>
                </div>

                <div className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-2">🎨 Color</div>
                <div className="flex flex-col gap-2">
                  <div>
                    <button 
                      onClick={() => { setSelectedColors([]); setShowAllColors(false); }} 
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${selectedColors.length === 0 ? 'bg-gradient-to-r from-yellow-500 to-pink-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllColors ? availableFilters.colors : availableFilters.colors.slice(0, MAX_VISIBLE)).map((col) => {
                      const key = String(col);
                      const norm = String(key).toLowerCase().replace(/\s+/g, '');
                      const exact = colorNameMap[norm];
                      const heuristic = colorHeuristic(String(key));
                      const candidate = exact ?? heuristic ?? String(key);
                      const valid = isValidCssColor(candidate) ? candidate : undefined;
                      const checked = selectedColors.includes(col);
                      const toggleColor = (c: string) => setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
                      return (
                        <FilterCheckbox
                          key={col}
                          checked={checked}
                          onChange={() => toggleColor(col)}
                          label={col}
                          count={colorCounts.get(col) ?? 0}
                          colorCandidate={valid}
                          variant="color"
                        />
                      );
                    })}
                  </div>
                  {availableFilters.colors.length > MAX_VISIBLE && (
                    <div>
                      <button 
                        onClick={() => setShowAllColors((s) => !s)} 
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium hover:underline"
                      >
                        {showAllColors ? '↑ Ver menos' : `↓ Ver todos (${availableFilters.colors.length})`}
                      </button>
                    </div>
                  )}
                </div>
                </div>
              <div>
                <div className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-2">📏 Talle</div>
                <div className="flex flex-col gap-2">
                  <div>
                    <button 
                      onClick={() => { setSelectedSizes([]); setShowAllSizes(false); }} 
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${selectedSizes.length === 0 ? 'bg-gradient-to-r from-yellow-500 to-pink-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllSizes ? sortedSizes : sortedSizes.slice(0, MAX_VISIBLE)).map((s) => {
                      const checked = selectedSizes.includes(s);
                      const toggleSize = (v: string) => setSelectedSizes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
                      return (
                        <FilterCheckbox
                          key={s}
                          checked={checked}
                          onChange={() => toggleSize(s)}
                          label={s}
                          count={sizeCounts.get(s) ?? 0}
                          variant="size"
                        />
                      );
                    })}
                  </div>
                  {sortedSizes.length > MAX_VISIBLE && (
                    <div>
                      <button 
                        onClick={() => setShowAllSizes((s) => !s)} 
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium hover:underline"
                      >
                        {showAllSizes ? '↑ Ver menos' : `↓ Ver todos (${sortedSizes.length})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          {/* Category title when a category is selected */}
          {selectedCategory !== undefined && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{categories.find(c => (c.id ?? c.ID) === selectedCategory)?.name ?? 'Categoría'}</h2>
              <div className="text-sm text-gray-600">Filtros aplicados: {selectedColors.length ? `Color: ${selectedColors.join(', ')}` : ''} {selectedSizes.length ? `${selectedColors.length ? '· ' : ''}Talle: ${selectedSizes.join(', ')}` : ''}</div>
            </div>
          )}
          {loading && <div>Cargando productos...</div>}
          {error && <div className="text-red-500">{error}</div>}

          {!loading && !error && products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 mb-4">No hay productos disponibles.</div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => window.location.reload()}>Volver a cargar</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id || prod.ID}
                  id={prod.id || prod.ID}
                  name={prod.name}
                  wholesale_price={prod.wholesale_price}
                  image_url={prod.image_url}
                  description={prod.description}
                  variants={prod.variants}
                  location_stocks={prod.location_stocks ?? prod.LocationStocks ?? []}
                  discount_type={prod.discount_type ?? prod.DiscountType ?? (prod.variants && prod.variants.discount_type) ?? undefined}
                  discount_value={prod.discount_value ?? prod.DiscountValue ?? (prod.variants && prod.variants.discount_value) ?? undefined}
                />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">{total ? `${(page-1)*limit + 1} - ${Math.min(page*limit, total)} de ${total}` : ''}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
              <button disabled={total !== undefined && page*limit >= (total ?? 0)} onClick={() => setPage((p) => p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
