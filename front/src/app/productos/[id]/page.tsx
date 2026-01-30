"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchProductById, Product, LocationStock, resolveImageUrl, API_BASE } from "../../../utils/api";
import Link from "next/link";
import useCart from "../../../hooks/useCart";
import { addToGuestCart, calculateGuestPrice } from "../../../utils/guestCart";

export default function DetalleProductoPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? false;
  const router = useRouter();
  const { fetchCart, setCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  // Carousel state: index into galleryImages
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') ?? undefined : undefined;
    const pid = Array.isArray(id) ? id[0] : id;
    fetchProductById(pid, token)
      .then((p) => setProduct(p))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const talles = product && product.variants ? Array.from(new Set((product.variants || []).map((v: any) => String(v.size)).filter(Boolean))) : [];
  const colores = product && product.variants ? Array.from(new Set((product.variants || []).map((v: any) => String(v.color)).filter(Boolean))) : [];
  const variantType = product?.variant_type || "sin_variantes";

  // Debug log
  console.log('DEBUG - Variants info:', {
    hasProduct: !!product,
    variantsLength: product?.variants?.length,
    talles,
    colores,
    variantType,
    selectedSize,
    selectedColor
  });

  // Auto-seleccionar si solo hay una opción disponible
  useEffect(() => {
    if (talles.length === 1 && !selectedSize) {
      console.log('Auto-seleccionando único talle:', talles[0]);
      setSelectedSize(String(talles[0]));
    }
    if (colores.length === 1 && !selectedColor) {
      console.log('Auto-seleccionando único color:', colores[0]);
      setSelectedColor(String(colores[0]));
    }
  }, [talles, colores, selectedSize, selectedColor]);

  // Limpiar el mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (addStatus) {
      const timer = setTimeout(() => {
        setAddStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [addStatus]);

  const varianteSeleccionada = (product?.variants || []).find((v: any) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor));

  // Calcular stock de depósito y otras ubicaciones SOLO para la variante seleccionada
  let depositoStock = null;
  let otrasUbicaciones: any[] = [];
  if (product && product.location_stocks && product.location_stocks.length > 0 && varianteSeleccionada) {
    const variantId = varianteSeleccionada.ID || varianteSeleccionada.id;
    depositoStock = (product.location_stocks as LocationStock[]).find(
      (s) => s.location === "deposito" && s.variant_id === variantId
    );
    otrasUbicaciones = (product.location_stocks as LocationStock[]).filter(
      (s) => s.location !== "deposito" && s.variant_id === variantId && (s.stock ?? 0) > 0
    );
  }

  // Determinar qué talles tienen stock en depósito (para habilitar/deshabilitar botones)
  const tallesDisponibles = React.useMemo(() => {
    if (!product?.variants || !product?.location_stocks) return [];
    
    return talles.map((size) => {
      // Encontrar todas las variantes de este talle
      const variantesDelTalle = product.variants!.filter((v: any) => v.size === size);
      
      // Verificar si alguna variante de este talle tiene stock en depósito
      const tieneStock = variantesDelTalle.some((v: any) => {
        const variantId = v.ID || v.id;
        const stockDeposito = (product.location_stocks as LocationStock[]).find(
          (s) => s.location === "deposito" && s.variant_id === variantId && (s.stock ?? 0) > 0
        );
        return !!stockDeposito;
      });
      
      return { size, habilitado: tieneStock };
    });
  }, [product, talles]);

  // Determinar qué colores tienen stock en depósito
  const coloresDisponibles = React.useMemo(() => {
    if (!product?.variants || !product?.location_stocks) return [];
    
    return colores.map((color) => {
      // Encontrar todas las variantes de este color
      const variantesDelColor = product.variants!.filter((v: any) => v.color === color);
      
      // Verificar si alguna variante de este color tiene stock en depósito
      const tieneStock = variantesDelColor.some((v: any) => {
        const variantId = v.ID || v.id;
        const stockDeposito = (product.location_stocks as LocationStock[]).find(
          (s) => s.location === "deposito" && s.variant_id === variantId && (s.stock ?? 0) > 0
        );
        return !!stockDeposito;
      });
      
      return { color, habilitado: tieneStock };
    });
  }, [product, colores]);

  const galleryImages: string[] = React.useMemo(() => {
    const imgs: string[] = [];
    if (Array.isArray(product?.variants)) {
      for (const v of product!.variants) {
        const url = v?.image_url || v?.ImageURL;
        if (url) imgs.push(resolveImageUrl(String(url)));
      }
    }
    if (Array.isArray(product?.images)) {
      for (const u of product!.images) if (u) imgs.push(resolveImageUrl(String(u)));
    }
    if (product?.image_url) imgs.push(resolveImageUrl(String(product.image_url)));
    return Array.from(new Set(imgs.filter(Boolean)));
  }, [product]);

  // When product or variant selection changes, reset or set carousel index to the first relevant image
  useEffect(() => {
    const chosen = varianteSeleccionada?.image_url || varianteSeleccionada?.ImageURL || product?.image_url || null;
    if (!chosen) {
      setCurrentIndex(0);
      return;
    }
    const idx = galleryImages.findIndex((g) => g === String(chosen));
    setCurrentIndex(idx >= 0 ? idx : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, selectedSize, selectedColor, varianteSeleccionada]);

  // keyboard navigation: left/right arrows
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(galleryImages.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryImages.length]);

  const handleAddToCart = async () => {
    setAddStatus(null);
    
    // Si no está logueado, guardar en localStorage
    if (!user) {
      try {
        // Calcular precio base para invitado
        const priceData = await calculateGuestPrice(
          product?.ID ?? product?.id,
          quantity
        );
        
        console.log('DEBUG - Datos del producto:', {
          name: product?.name,
          image_url: product?.image_url,
          wholesale_price: product?.wholesale_price,
          priceData,
          variant: varianteSeleccionada
        });
        
        // Guardar en carrito local con toda la metadata
        const itemToAdd = {
          product_id: product?.ID ?? product?.id,
          variant_id: varianteSeleccionada?.ID || varianteSeleccionada?.id,
          quantity,
          metadata: {
            product_name: product?.name,
            variant_name: varianteSeleccionada
              ? `${varianteSeleccionada.color || ''} ${varianteSeleccionada.size || ''}`.trim()
              : undefined,
            image_url: varianteSeleccionada?.image_url || product?.image_url,
            wholesale_price: priceData?.unit_price || product?.wholesale_price || 0,
            color: varianteSeleccionada?.color,
            size: varianteSeleccionada?.size,
          },
        };
        
        console.log('DEBUG - Item a agregar al carrito:', itemToAdd);
        addToGuestCart(itemToAdd);
        
        // Mostrar notificación con sugerencia de login
        setAddStatus(
          `Producto agregado. 💡 Inicia sesión para acceder a mejores precios por volumen y finalizar tu compra.`
        );
        
        // Disparar evento para actualizar contador de carrito
        window.dispatchEvent(new CustomEvent('guest-cart-updated'));
        
        return;
      } catch (e: any) {
        setAddStatus(e.message || "Error al agregar al carrito");
        return;
      }
    }
    
    // Usuario logueado: usar API normal
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') ?? undefined : undefined;
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ product_id: product?.ID ?? product?.id, variant_id: varianteSeleccionada?.ID || varianteSeleccionada?.id, quantity, requires_stock_check: false }),
      });
      
      const data = await res.json().catch(() => null);
      
      // Verificar si el backend indicó que requiere login
      if (data?.requires_login) {
        setAddStatus(data.message || "Por favor inicia sesión para agregar al carrito");
        return;
      }
      
      if (!res.ok) throw new Error("No se pudo agregar al carrito");
      
      // debug: log server response for add-to-cart
      // eslint-disable-next-line no-console
      console.log('POST /cart/add response', data);
      setAddStatus("Producto agregado al carrito");
      // if backend returned the updated cart, update local cart immediately; otherwise fallback to fetchCart
      if (data && data.cart) {
        try {
          // eslint-disable-next-line no-console
          console.log('Setting local cart from response', data.cart);
          setCart(data.cart);
        } catch (e) {}
      } else {
        try { await fetchCart(); } catch (e) {}
      }
      // Refrescar el summary para detectar cambios de tier
      setTimeout(() => {
        try {
          (window as any).refreshCartSummary && (window as any).refreshCartSummary();
        } catch (e) {}
      }, 500);
      // open the cart UI if available
      try {
        (window as any).openCart && (window as any).openCart();
      } catch (e) {}
    } catch (e: any) {
      setAddStatus(e.message);
    }
  };

  const handleConsultStock = async () => {
    setAddStatus(null);
    
    // Si no está logueado, mostrar mensaje indicando que debe loguearse
    if (!user) {
      setAddStatus("⚠️ Debes iniciar sesión para solicitar asistencia de una vendedora y verificar stock disponible.");
      return;
    }
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') ?? undefined : undefined;
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ product_id: product?.ID ?? product?.id, variant_id: varianteSeleccionada?.ID || varianteSeleccionada?.id, quantity: 1, requires_stock_check: true }),
      });
      if (!res.ok) throw new Error("No se pudo agregar al carrito");
  const data = await res.json().catch(() => null);
  // debug
  // eslint-disable-next-line no-console
  console.log('POST /cart/add (consultar stock) response', data);
      setAddStatus("Item agregado como pendiente de verificación por la vendedora");
      if (data && data.cart) {
        try {
          // eslint-disable-next-line no-console
          console.log('Setting local cart from response (pending)', data.cart);
          setCart(data.cart);
        } catch (e) {}
      } else {
        try { await fetchCart(); } catch (e) {}
      }
  try { (window as any).openCart && (window as any).openCart(); } catch (e) {}
    } catch (e: any) {
      setAddStatus(e.message);
    }
  };

  if (loading) return <main className="p-6">Cargando producto...</main>;
  if (error) return <main className="p-6 text-red-500">{error}</main>;
  if (!product) return <main className="p-6">No se encontró el producto</main>;

  const category = product.category ?? null;
  const subcategory = product.subcategory ?? null;

  // Debug: log product and derived colors to help track missing colors in UI
  // eslint-disable-next-line no-console
  console.debug('DetalleProductoPage.product', { id: product?.ID ?? product?.id, variantsLength: (product?.variants || []).length, derivedColores: colores, derivedTalles: talles, variantType });

  // small mapping for common Spanish color names to CSS values
  const simpleColorMap: Record<string, string> = {
    blanco: '#ffffff',
    negro: '#000000',
    beige: '#f5f5dc',
    rojo: '#ff0000',
    azul: '#0000ff',
    verde: '#008000',
    gris: '#808080',
    marron: '#8b4513',
    naranja: '#ff7f00',
    rosa: '#ff69b4',
    violeta: '#8a2be2',
  };

  const resolveSwatchColor = (c: string | undefined) => {
    if (!c) return undefined;
    const key = String(c).toLowerCase().trim();
    if (simpleColorMap[key]) return simpleColorMap[key];
    // allow hex or rgb-like values
    if (/^#|rgb|hsl|rgba|hsla/.test(key)) return c;
    // fallback to original string (may still work in browser for English names)
    return c;
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 hover:underline"
            >
              ← Volver
            </button>
          </div>
          <div className="flex-1 text-center md:text-right overflow-x-auto">
            <nav className="text-xs sm:text-sm text-gray-600 whitespace-nowrap px-2">
              <Link href="/productos" className="text-pink-600 hover:text-pink-700 hover:underline font-medium">Catálogo</Link>
              {category && (
                <>
                  <span className="mx-1 sm:mx-2 text-gray-400">›</span>
                  <Link href={`/productos?category=${category.ID ?? category.id}`} className="text-pink-600 hover:text-pink-700 hover:underline">{category.name}</Link>
                </>
              )}
              {subcategory && (
                <>
                  <span className="mx-1 sm:mx-2 text-gray-400">›</span>
                  <Link href={`/productos?category=${category?.ID ?? category?.id}&subcategory=${subcategory.ID ?? subcategory.id}`} className="text-pink-600 hover:text-pink-700 hover:underline">{subcategory.name}</Link>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-start-3 md:col-span-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-0 title-gradient px-2">{product.name}</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-2">
            <div className="flex md:flex-col flex-row md:space-y-2 space-x-2 md:space-x-0 overflow-auto">
              {galleryImages.map((g, idx) => (
                <button
                  key={g}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-pink-500 ring-2 ring-pink-300 shadow-md' : 'border-gray-200 hover:border-pink-300'}`}
                  style={{ width: 64, height: 64 }}
                >
                  <img src={g} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 flex items-start justify-center">
            <div className="relative w-full max-w-[520px]">
              {/* Prev button (render only if there is a previous image) */}
              {currentIndex > 0 && (
                <button
                  aria-label="Anterior"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white rounded-full p-3 shadow-lg"
                >
                  ‹
                </button>
              )}

              {/* Next button (render only if there is a next image) */}
              {currentIndex < galleryImages.length - 1 && (
                <button
                  aria-label="Siguiente"
                  onClick={() => setCurrentIndex((i) => Math.min(galleryImages.length - 1, i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white rounded-full p-3 shadow-lg"
                >
                  ›
                </button>
              )}

              {galleryImages && galleryImages.length > 0 ? (
                <div className="overflow-hidden rounded-2xl shadow-xl border-2 border-pink-100">
                  <img
                    src={galleryImages[currentIndex]}
                    alt={product.name}
                    className="w-full h-auto md:h-[520px] object-cover block transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-[520px] bg-gradient-to-br from-gray-100 to-gray-200 mb-4 flex items-center justify-center rounded-2xl border-2 border-gray-300">
                  <span className="text-gray-400 text-lg">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          <aside className="md:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-5 border border-pink-100">
              <div className="text-base sm:text-lg text-gray-700">
                Precio mayorista: 
                <div className="text-xl sm:text-2xl font-bold mt-1">
                  <span className="bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">{(() => {
                const wholesale = Number(product.wholesale_price ?? product.WholesalePrice ?? 0);
                const discountType = product.discount_type ?? product.DiscountType ?? undefined;
                const discountValue = typeof product.discount_value === 'number' ? product.discount_value : (typeof product.DiscountValue === 'number' ? product.DiscountValue : undefined);
                let final = wholesale;
                if (discountType === 'percent' && typeof discountValue === 'number') final = wholesale * (1 - discountValue / 100);
                else if (discountType === 'fixed' && typeof discountValue === 'number') final = wholesale - discountValue;
                if (final < 0) final = 0;
                return final !== wholesale ? (
                  <>
                    <span className="text-sm line-through text-gray-500 mr-2">${""}{wholesale.toFixed(2)}</span>
                    <span className="text-yellow-600">${""}{final.toFixed(2)}</span>
                  </>
                ) : (
                  <span>${""}{wholesale.toFixed(2)}</span>
                );
              })()}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {product.description}
              </div>

              {user && !authLoading && ["admin", "encargado", "vendedor"].includes(user.role) && varianteSeleccionada && (
                <div className="bg-gradient-to-r from-yellow-50 to-pink-50 p-4 rounded-lg border border-pink-200">
                  <h3 className="font-bold text-pink-600 mb-2">📦 Stock por ubicación</h3>
                  {product.location_stocks && product.location_stocks.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {product.location_stocks
                        .filter((s: LocationStock) => s.variant_id === varianteSeleccionada.ID || s.variant_id === varianteSeleccionada.id)
                        .map((s: LocationStock) => (
                          <li key={s.ID || s.id} className="flex justify-between">
                            <strong className="text-gray-700">{s.location}:</strong> 
                            <span className="text-pink-600 font-semibold">{s.stock}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 text-sm">No hay información de stock por ubicación</div>
                  )}
                </div>
              )}

              {talles.length > 0 && (
                <div>
                  <div className="font-bold text-pink-600 mb-3">📏 Talle</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(talles as string[]).map((size) => {
                      const habilitado = tallesDisponibles.find((t: any) => t.size === size)?.habilitado ?? true;
                      console.log('DEBUG - Talle:', size, 'habilitado:', habilitado);
                      return (
                        <button 
                          key={size} 
                          onClick={() => {
                            console.log('Click en talle:', size);
                            setSelectedSize(size);
                          }} 
                          className={`px-4 py-2 rounded-lg font-semibold transition-all relative ${
                            selectedSize === size 
                              ? 'bg-gradient-to-r from-yellow-500 to-pink-500 text-white shadow-md' 
                              : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {size}
                          {!habilitado && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full font-bold">Sin stock</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {colores.length > 0 && (
                <div>
                  <div className="font-bold text-pink-600 mb-3">
                    🎨 Color{selectedColor ? <span className="font-normal text-gray-600">: {selectedColor}</span> : null}
                  </div>
                  <div className="flex gap-3 mt-2 items-center flex-wrap">
                    {coloresDisponibles.map(({ color, habilitado }) => {
                      const isSelected = selectedColor === color;
                      const sw = resolveSwatchColor(color as string);
                      const isHex = typeof sw === 'string' && sw.startsWith('#');
                      const textColor = isHex && sw.toLowerCase() === '#ffffff' ? '#000' : '#fff';
                      console.log('DEBUG - Color:', color, 'habilitado:', habilitado, 'swatch:', sw);
                      return (
                        <div key={String(color)} className="relative">
                          <button
                            title={String(color)}
                            onClick={() => {
                              console.log('Click en color:', color);
                              setSelectedColor(String(color));
                            }}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'ring-4 ring-pink-400 border-white shadow-lg scale-110' 
                                : 'border-gray-300 hover:border-pink-300 hover:scale-105'
                            }`}
                            style={{ background: sw ?? undefined, color: textColor }}
                          >
                            {/* If we couldn't resolve to a CSS color, show the name */}
                              {!sw && <span className="text-xs font-semibold">{String(color)}</span>}
                          </button>
                          {!habilitado && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full font-bold">✕</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {(() => {
                  const deposStock = Number(depositoStock?.stock ?? 0);
                  const hasOther = Array.isArray(otrasUbicaciones) && otrasUbicaciones.length > 0;
                  const disabled = (talles.length > 0 && !selectedSize) || (colores.length > 0 && !selectedColor);
                  const shouldDisableQuantity = !disabled && deposStock === 0 && hasOther;

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
                        <input 
                          type="number" 
                          min={1} 
                          value={quantity} 
                          onChange={e => setQuantity(Number(e.target.value))} 
                          className="input-themed w-20 text-center"
                          disabled={shouldDisableQuantity}
                        />
                      </div>
                {(() => {
                  
                  console.log('DEBUG - Botón agregar:', {
                    tallesLength: talles.length,
                    coloresLength: colores.length,
                    selectedSize,
                    selectedColor,
                    disabled,
                    deposStock,
                    hasOther,
                    varianteSeleccionada
                  });
                  
                  if (!disabled && deposStock > 0) {
                    return (
                      <button 
                        onClick={handleAddToCart} 
                        className="btn-primary flex-1 py-3"
                        disabled={disabled}
                      >
                        🛒 Agregar al carrito
                      </button>
                    );
                  }
                  if (!disabled && hasOther) {
                    return (
                      <div className="relative flex-1 group">
                        <button 
                          onClick={handleConsultStock} 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                          disabled={disabled}
                        >
                          💬 Consultar stock
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                          <div className="text-center">
                            <p className="font-semibold">📦 Puede haber stock en depósito</p>
                            <p className="text-xs mt-1">Consultá disponibilidad y lo verificamos al contactarte</p>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    );
                  }
                  // fallback: still allow add (unknown stock)
                  return (
                    <button 
                      onClick={handleAddToCart} 
                      className={`btn-primary flex-1 py-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={disabled}
                    >
                      🛒 Agregar al carrito
                    </button>
                  );
                })()}
                    </>
                  );
                })()}
              </div>

              {addStatus && (
                <div className={`border-l-4 p-4 rounded-lg ${
                  addStatus.includes('⚠️') || addStatus.toLowerCase().includes('error')
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-500'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                }`}>
                  <p className={`font-medium flex items-center gap-2 ${
                    addStatus.includes('⚠️') || addStatus.toLowerCase().includes('error')
                      ? 'text-orange-700'
                      : 'text-green-700'
                  }`}>
                    {addStatus.includes('⚠️') || addStatus.toLowerCase().includes('error') ? '⚠️' : '✓'} {addStatus.replace('⚠️', '').trim()}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
