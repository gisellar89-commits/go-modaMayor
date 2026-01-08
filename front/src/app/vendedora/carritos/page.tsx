"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";
import Modal from "../../../components/Modal";

export default function VendedoraCartsPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [addQty, setAddQty] = useState<number>(1);
  const [variantStocksMap, setVariantStocksMap] = useState<Record<number, any[]>>({});
  const [selectedLocationMap, setSelectedLocationMap] = useState<Record<number, string>>({});
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<number, number>>({});
  const [expandedCart, setExpandedCart] = useState<number | null>(null);
  const [viewModeMap, setViewModeMap] = useState<Record<number, 'vendedora' | 'cliente'>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [priceTiers, setPriceTiers] = useState<any[]>([]);
  
  // Estados para modales
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModal({ isOpen: true, type, title, message, onConfirm });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Calcular precio con price tier según cantidad total
  const calculatePriceWithTier = (costPrice: number, totalQuantity: number) => {
    const tiersArray = (priceTiers as any)?.tiers || priceTiers;
    if (!Array.isArray(tiersArray) || tiersArray.length === 0) {
      return costPrice * 2.5; // fallback a mayorista si no hay tiers cargados
    }
    
    const activeTiers = tiersArray.filter((t: any) => t.active).sort((a: any, b: any) => a.order_index - b.order_index);
    
    let applicableTier = activeTiers.find((t: any) => totalQuantity >= t.min_quantity) || activeTiers.find((t: any) => t.is_default);
    
    if (!applicableTier) return costPrice * 2.5; // fallback a mayorista
    
    // Aplicar fórmula según tipo
    if (applicableTier.formula_type === 'multiplier') {
      return costPrice * applicableTier.multiplier;
    } else if (applicableTier.formula_type === 'percentage') {
      return costPrice * (1 + applicableTier.percentage / 100);
    } else if (applicableTier.formula_type === 'flat') {
      return costPrice + applicableTier.flat_amount;
    }
    
    return costPrice * 2.5;
  };

  // Función helper para formatear variantes de forma legible
  const formatVariant = (variant: any) => {
    if (!variant) return 'N/A';
    
    const parts = [];
    
    // Color
    if (variant.color && variant.color !== 'UNICO') {
      const colorFormatted = variant.color.charAt(0).toUpperCase() + variant.color.slice(1).toLowerCase();
      parts.push(colorFormatted);
    } else if (variant.color === 'UNICO') {
      parts.push('Color único');
    }
    
    // Talle/Tamaño
    if (variant.size && variant.size !== 'UNICO') {
      parts.push(`T. ${variant.size}`);
    } else if (variant.size === 'UNICO') {
      parts.push('Talle único');
    }
    
    return parts.length > 0 ? parts.join(', ') : variant.sku || 'Sin variante';
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchCarts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/cart/seller`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('No se pudieron obtener los carritos');
      const data = await res.json();
      setCarts(data || []);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCarts(); 
    fetchPriceTiers();
  }, []);

  const fetchPriceTiers = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/price-tiers`);
      if (res.ok) {
        const data = await res.json();
        setPriceTiers(data || []);
      }
    } catch (e) {
      console.error('Error loading price tiers:', e);
    }
  };

  const fetchProducts = async (q = '') => {
    try {
      const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      // data may be { items, total } or array
      const list = Array.isArray(data) ? data : (data.items || []);
      setProducts(list);
    } catch (e) { }
  };

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items || []);
      setSearchResults(list.slice(0, 10)); // Mostrar solo primeros 10 resultados
      setShowSearchResults(true);
    } catch (e) {
      setSearchResults([]);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const onSelectProduct = async (id: number) => {
    setSelectedProduct(id);
    try {
      const res = await fetch(`${API_BASE}/products/${id}/variants`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        setVariants([]);
        return;
      }
      const data = await res.json();
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      setVariants([]);
    }
  };

  const fetchVariantStocks = async (variantId: number) => {
    if (!variantId) return;
    // cache
    if (variantStocksMap[variantId]) return;
    try {
      const res = await fetch(`${API_BASE}/variants/${variantId}/stock`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        setVariantStocksMap((m) => ({ ...m, [variantId]: [] }));
        return;
      }
      const data = await res.json();
      setVariantStocksMap((m) => ({ ...m, [variantId]: Array.isArray(data) ? data : (data.stocks || []) }));
    } catch (e) {
      setVariantStocksMap((m) => ({ ...m, [variantId]: [] }));
    }
  };

  const onVariantSelectForCart = async (cartId: number, variantId: number) => {
    setSelectedVariantMap((m) => ({ ...m, [cartId]: variantId }));
    await fetchVariantStocks(variantId);
    // attempt to preselect a location with available stock
    const stocks = variantStocksMap[variantId];
    if (stocks && stocks.length > 0) {
      const first = stocks.find((s: any) => (s.stock ?? s.Quantity ?? 0) > 0) || stocks[0];
      if (first) setSelectedLocationMap((m) => ({ ...m, [cartId]: first.location ?? first.Location ?? first.location }));
    }
  };

  function openCartInView(cartId: number, mode: 'vendedora' | 'cliente' = 'vendedora') {
    setExpandedCart(cartId);
    setViewModeMap((m) => ({ ...m, [cartId]: mode }));
  }

  function closeExpanded() {
    setExpandedCart(null);
    // Limpiar selección de productos
    setSelectedProduct(null);
    setVariants([]);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }

  const addToCart = async (cartId: number, productId: number, variantId: number, quantity: number, location?: string) => {
    try {
      const payload: any = { product_id: productId, variant_id: variantId, quantity };
      if (location) payload.location = location;
      const res = await fetch(`${API_BASE}/cart/add?cart_id=${cartId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showModal('error', 'Error', err?.error || 'No se pudo agregar al carrito');
        return;
      }
      showModal('success', '¡Producto agregado!', 'El producto se agregó correctamente al carrito');
      fetchCarts();
    } catch (e) { 
      showModal('error', 'Error', 'Error al agregar el producto');
    }
  };

  const updateQty = async (cartId: number, productId: number, variantId: number, qty: number) => {
    try {
      const res = await fetch(`${API_BASE}/cart/update/${productId}?variant_id=${variantId}&cart_id=${cartId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ quantity: qty }) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showModal('error', 'Error', err?.error || 'No se pudo actualizar la cantidad');
        return;
      }
      fetchCarts();
    } catch (e) { 
      showModal('error', 'Error', 'Error al actualizar la cantidad');
    }
  };

  const removeItem = async (cartId: number, productId: number, variantId: number) => {
    try {
      const res = await fetch(`${API_BASE}/cart/remove/${productId}?variant_id=${variantId}&cart_id=${cartId}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { 
        showModal('error', 'Error', 'No se pudo eliminar el producto');
        return; 
      }
      fetchCarts();
    } catch (e) { 
      showModal('error', 'Error', 'Error al eliminar el producto');
    }
  };

  const setStatus = async (cartId: number, estado: string) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${cartId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ estado }) });
      if (!res.ok) { 
        const err = await res.json().catch(() => null); 
        showModal('error', 'Error', err?.error || 'No se pudo actualizar el estado');
        return; 
      }
      showModal('success', '¡Estado actualizado!', `El estado se cambió a "${estado}" correctamente`);
      await fetchCarts();
    } catch (e) { 
      showModal('error', 'Error', 'Error al actualizar el estado');
    }
  };

  const finalize = async (cartId: number) => {
    showModal('confirm', 'Confirmar finalización', '¿Finalizar y crear la orden? Se descontará el stock correspondiente.', async () => {
      try {
        const res = await fetch(`${API_BASE}/checkout/${cartId}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) { 
          const err = await res.json().catch(() => null); 
          showModal('error', 'Error', err?.error || 'Error al finalizar la orden');
          return; 
        }
        const data = await res.json();
        showModal('success', '¡Orden creada!', `La orden ha sido creada exitosamente. ID: ${data.orden?.id || data.orden?.ID || 'N/A'}`);
        fetchCarts();
      } catch (e) { 
        showModal('error', 'Error', 'Error al finalizar la orden');
      }
    });
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Carritos asignados</h1>
      {loading ? <div>Cargando...</div> : error ? <div className="text-red-500">{error}</div> : (
        <div className="space-y-4">
          {carts.length === 0 && <div>No tienes carritos asignados.</div>}
          {carts.map((cart) => {
            const cid = cart.ID ?? cart.id;
            const expanded = expandedCart === cid;
            const mode = viewModeMap[cid] ?? 'vendedora';
            return (
              <div key={cid} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-2">
                      Carrito #{cid} - Estado: {cart.estado}
                      {(cart.estado === 'listo_para_pago' || cart.estado === 'completado' || cart.estado === 'pagado') && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          No editable
                        </span>
                      )}
                    </div>
                    
                    {/* Información del cliente */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                      <div className="font-semibold text-blue-900 mb-1">Datos del cliente:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Nombre:</span>{' '}
                          <span className="text-gray-900">{cart.user?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>{' '}
                          <a href={`mailto:${cart.user?.email}`} className="text-blue-600 hover:underline">
                            {cart.user?.email || 'N/A'}
                          </a>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Teléfono:</span>{' '}
                          <a href={`tel:${cart.user?.phone}`} className="text-blue-600 hover:underline">
                            {cart.user?.phone || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Fecha: {cart.created_at ? new Date(cart.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!expanded && (
                      <>
                        <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => openCartInView(cid, 'cliente')}>Ver</button>
                        <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => openCartInView(cid, 'vendedora')}>Editar</button>
                      </>
                    )}
                    {expanded && (
                      <>
                        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => closeExpanded()}>Cerrar</button>
                        
                        {/* Botón para cambiar a pendiente si está en estado no editable */}
                        {mode === 'vendedora' && (cart.estado === 'listo_para_pago' || cart.estado === 'completado' || cart.estado === 'pagado') && (
                          <button 
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors" 
                            onClick={() => setStatus(cid, 'pendiente')}
                            title="Cambiar a pendiente para poder editar"
                          >
                            Habilitar edición
                          </button>
                        )}
                        
                        {/* Botón "Listo para pago" - solo si está en pendiente o edicion */}
                        {mode === 'vendedora' && (cart.estado === 'pendiente' || cart.estado === 'edicion') && (
                          <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => setStatus(cid, 'listo_para_pago')}>
                            Listo para pago
                          </button>
                        )}
                        
                        {/* Botón "Marcar como pagado" - solo si está listo_para_pago */}
                        {mode === 'vendedora' && cart.estado === 'listo_para_pago' && (
                          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setStatus(cid, 'pagado')}>
                            Marcar como pagado
                          </button>
                        )}
                        
                        {/* Botón "Finalizar venta" - solo si está pagado */}
                        {mode === 'vendedora' && cart.estado === 'pagado' && (
                          <button className="px-3 py-1 bg-green-700 text-white rounded" onClick={() => finalize(cid)}>
                            Finalizar venta
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {expanded ? (
                  <div>
                    <table className="min-w-full border mb-3">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-2 py-1">Imagen</th>
                          <th className="border px-2 py-1">Producto</th>
                          <th className="border px-2 py-1">Código</th>
                          <th className="border px-2 py-1">Variante</th>
                          <th className="border px-2 py-1">Cantidad</th>
                          <th className="border px-2 py-1">Precio Unit.</th>
                          <th className="border px-2 py-1">Subtotal</th>
                          <th className="border px-2 py-1">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cart.items || []).map((it: any) => (
                          <tr key={it.ID ?? it.id ?? (it.product_id + '-' + it.variant_id)}>
                            <td className="border px-2 py-1">
                              {it.product?.image_url ? (
                                <img 
                                  src={it.product.image_url.startsWith('http') ? it.product.image_url : `${API_BASE}${it.product.image_url}`} 
                                  alt={it.product?.name || 'Producto'} 
                                  className="w-16 h-16 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                  Sin imagen
                                </div>
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              <div className="font-medium">{it.product?.name ?? it.product_name ?? it.product_id}</div>
                              {(it.location ?? it.Location) && (
                                <div className="text-xs text-gray-500">Ubicación: {it.location ?? it.Location}</div>
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              <span className="font-mono text-sm">{it.product?.code || 'N/A'}</span>
                            </td>
                            <td className="border px-2 py-1">
                              <div className="text-sm">{formatVariant(it.variant)}</div>
                              <div className="text-xs text-gray-400 font-mono">{it.variant?.sku}</div>
                            </td>
                            <td className="border px-2 py-1">
                              {mode === 'vendedora' ? (
                                <input type="number" min={1} defaultValue={it.quantity} onBlur={(e) => updateQty(cid, it.product_id, it.variant_id, Number((e.target as HTMLInputElement).value))} className="w-20 border px-1 py-0.5 rounded" />
                              ) : (
                                <span>{it.quantity}</span>
                              )}
                              {it.requires_stock_check && !it.stock_confirmed && (
                                <div className="text-xs text-orange-700">⚠️ Verificar stock</div>
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              <span className="font-medium">${(calculatePriceWithTier(it.product?.cost_price ?? 0, (cart.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0))).toFixed(2)}</span>
                            </td>
                            <td className="border px-2 py-1">
                              <span className="font-bold text-blue-700">${(calculatePriceWithTier(it.product?.cost_price ?? 0, (cart.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0)) * it.quantity).toFixed(2)}</span>
                            </td>
                            <td className="border px-2 py-1">
                              <div className="flex gap-2">
                                {mode === 'vendedora' && (
                                  <>
                                    <button className="text-xs bg-red-600 text-white px-2 py-1 rounded" onClick={() => removeItem(cid, it.product_id, it.variant_id)}>Quitar</button>
                                    {it.requires_stock_check && !it.stock_confirmed && (
                                      <button className="text-xs bg-emerald-600 text-white px-2 py-1 rounded" onClick={async () => {
                                        try {
                                          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                          // fetch variant stocks
                                          const vsRes = await fetch(`${API_BASE}/variants/${it.variant_id}/stock`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                                          if (!vsRes.ok) { 
                                            showModal('error', 'Error', 'No se pudo consultar stock');
                                            return; 
                                          }
                                          const stocks = await vsRes.json();
                                          // find first location with available (stock - reserved) >= quantity
                                          const needed = it.quantity || 1;
                                          const found = (Array.isArray(stocks) ? stocks : (stocks.stocks || [])).find((s: any) => ((s.stock ?? s.Quantity ?? 0) - (s.reserved ?? s.Reserved ?? 0)) >= needed);
                                          if (!found) { 
                                            showModal('warning', 'Stock no disponible', 'No hay stock disponible en ninguna ubicación para esta variante');
                                            return; 
                                          }
                                          const location = found.location ?? found.Location ?? found.location;
                                          // call update with reserve + location + stock_confirmed
                                          const res = await fetch(`${API_BASE}/cart/update/${it.product_id}?variant_id=${it.variant_id}&cart_id=${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ stock_confirmed: true, location, reserve: true }) });
                                          if (!res.ok) { 
                                            const err = await res.json().catch(() => null); 
                                            showModal('error', 'Error', err?.error || 'No se pudo confirmar y reservar');
                                            return; 
                                          }
                                          showModal('success', 'Stock confirmado', `Item marcado como en stock y reservado en ${location}`);
                                          fetchCarts();
                                        } catch (e) { 
                                          showModal('error', 'Error', 'Error al confirmar stock');
                                        }
                                      }}>Confirmar stock</button>
                                    )}
                                  </>
                                )}
                                {mode === 'cliente' && <span className="text-sm text-gray-600">(solo lectura)</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={6} className="border px-2 py-2 text-right">TOTAL:</td>
                          <td className="border px-2 py-2 text-blue-700 text-lg">
                            ${(() => {
                              const totalQty = (cart.items || []).reduce((sum: number, it: any) => sum + it.quantity, 0);
                              return (cart.items || []).reduce((sum: number, it: any) => {
                                const unitPrice = calculatePriceWithTier(it.product?.cost_price ?? 0, totalQty);
                                return sum + (unitPrice * it.quantity);
                              }, 0).toFixed(2);
                            })()}
                          </td>
                          <td className="border px-2 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Indicador de tier de precios */}
                    {(() => {
                      const totalQty = (cart.items || []).reduce((sum: number, it: any) => sum + it.quantity, 0);
                      if (totalQty === 0) return null;
                      
                      const tiersArray = (priceTiers as any)?.tiers || priceTiers;
                      if (!Array.isArray(tiersArray) || tiersArray.length === 0) {
                        return null;
                      }
                      
                      const activeTiers = tiersArray
                        .filter((t: any) => t.active)
                        .sort((a: any, b: any) => (b.min_quantity || 0) - (a.min_quantity || 0));
                      
                      if (activeTiers.length === 0) return null;
                      
                      // Encontrar tier actual
                      const currentTier = activeTiers.find((t: any) => totalQty >= (t.min_quantity || 0)) || activeTiers[activeTiers.length - 1];
                      
                      // Encontrar siguiente tier
                      const nextTier = activeTiers.find((t: any) => (t.min_quantity || 0) > totalQty);
                      
                      return (
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-blue-900">
                                📊 Tier actual: <span className="text-indigo-700">{currentTier.display_name || currentTier.name}</span>
                              </div>
                              <div className="text-sm text-blue-700">
                                {totalQty} {totalQty === 1 ? 'prenda' : 'prendas'} en el carrito
                                {currentTier.formula_type === 'multiplier' && ` - Precio: ${currentTier.multiplier}x costo`}
                              </div>
                            </div>
                            {nextTier && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-green-700">
                                  🎯 ¡{nextTier.min_quantity - totalQty} {(nextTier.min_quantity - totalQty) === 1 ? 'prenda' : 'prendas'} más para {nextTier.display_name || nextTier.name}!
                                </div>
                                {nextTier.formula_type === 'multiplier' && (
                                  <div className="text-xs text-green-600">
                                    Precio: {nextTier.multiplier}x costo
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {mode === 'vendedora' && (
                      <div className="mb-2">
                        {(cart.estado === 'listo_para_pago' || cart.estado === 'completado' || cart.estado === 'pagado') ? (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                            <div className="text-orange-800 font-medium mb-2">
                              ⚠️ Este carrito no se puede editar en estado: <strong>{cart.estado}</strong>
                            </div>
                            <div className="text-sm text-orange-700">
                              Usa el botón "Habilitar edición" arriba para cambiar el estado a pendiente
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-3">🔍 Buscar y agregar productos</h3>
                          
                          <div className="relative mb-3">
                            <input 
                              type="text" 
                              placeholder="Buscar por nombre o código de producto..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchProducts(e.target.value);
                              }}
                              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                            
                            {showSearchResults && searchResults.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map(product => (
                                  <div
                                    key={product.ID ?? product.id}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => {
                                      onSelectProduct(product.ID ?? product.id);
                                      setSearchQuery(product.name);
                                      setShowSearchResults(false);
                                    }}
                                  >
                                    <div className="font-medium text-gray-800">{product.name}</div>
                                    <div className="text-xs text-gray-500">Código: {product.code || 'N/A'}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                No se encontraron productos
                              </div>
                            )}
                          </div>

                          {selectedProduct && (
                            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <span className="text-green-700">✓ Producto seleccionado: <strong>{products.find(p => (p.ID ?? p.id) === selectedProduct)?.name}</strong></span>
                            </div>
                          )}

                          <div className="flex gap-2 items-center flex-wrap">
                            <select id={`variant-select-${cid}`} className="border px-3 py-2 rounded" onChange={async (e) => { setAddQty(1); const v = Number(e.target.value); if (v) await onVariantSelectForCart(cid, v); }}>
                              <option value="">Selecciona variante</option>
                              {variants.map(v => (
                                <option key={v.ID ?? v.id} value={v.ID ?? v.id}>{v.sku ?? `${v.color ?? ''} ${v.size ?? ''}`.trim()}</option>
                              ))}
                            </select>
                          {/* If variant selected and we have stocks info, show location selector */}
                          {(() => {
                            const selVariant = selectedVariantMap[cid] ?? Number((document.getElementById(`variant-select-${cid}`) as HTMLSelectElement)?.value || 0);
                            const stocks = selVariant ? (variantStocksMap[selVariant] || []) : [];
                            if (stocks && stocks.length > 0) {
                              return (
                                <select id={`location-select-${cid}`} className="border px-2 py-1" value={selectedLocationMap[cid] ?? ''} onChange={(e) => setSelectedLocationMap((m) => ({ ...m, [cid]: e.target.value }))}>
                                  <option value="">Selecciona ubicación</option>
                                  {stocks.map((s: any, idx: number) => (
                                    <option key={idx} value={s.location ?? s.Location ?? s.location}>{`${s.location ?? s.Location ?? s.location} — ${s.stock ?? s.Quantity ?? 0} disponibles`}</option>
                                  ))}
                                </select>
                              );
                            }
                            return null;
                          })()}
                            
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                              <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} className="w-20 border px-3 py-2 rounded" />
                            </div>
                            
                            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors" onClick={() => {
                            const selProd = selectedProduct;
                            const selVariant = selectedVariantMap[cid] ?? Number((document.getElementById(`variant-select-${cid}`) as HTMLSelectElement)?.value || 0);
                            const selLocation = selectedLocationMap[cid];
                            if (!selProd || !selVariant) { 
                              showModal('warning', 'Datos incompletos', 'Por favor busca un producto y selecciona una variante');
                              return; 
                            }
                            addToCart(cid, selProd, selVariant, addQty, selLocation);
                          }}>➕ Agregar al carrito</button>
                          </div>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">{(cart.items || []).length} artículo(s). {cart.total ? `Total: ${cart.total}` : ''}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </main>
  );
}
