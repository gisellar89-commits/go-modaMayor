"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";

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

  useEffect(() => { fetchCarts(); }, []);

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
  }

  const addToCart = async (cartId: number, productId: number, variantId: number, quantity: number, location?: string) => {
    try {
      const payload: any = { product_id: productId, variant_id: variantId, quantity };
      if (location) payload.location = location;
      const res = await fetch(`${API_BASE}/cart/add?cart_id=${cartId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'No se pudo agregar al carrito');
        return;
      }
      alert('Producto agregado');
      fetchCarts();
    } catch (e) { alert('Error agregando'); }
  };

  const updateQty = async (cartId: number, productId: number, variantId: number, qty: number) => {
    try {
      const res = await fetch(`${API_BASE}/cart/update/${productId}?variant_id=${variantId}&cart_id=${cartId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ quantity: qty }) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'No se pudo actualizar la cantidad');
        return;
      }
      fetchCarts();
    } catch (e) { alert('Error actualizando'); }
  };

  const removeItem = async (cartId: number, productId: number, variantId: number) => {
    try {
      const res = await fetch(`${API_BASE}/cart/remove/${productId}?variant_id=${variantId}&cart_id=${cartId}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { alert('Error eliminando'); return; }
      fetchCarts();
    } catch (e) { alert('Error eliminando'); }
  };

  const setStatus = async (cartId: number, estado: string) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${cartId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ estado }) });
      if (!res.ok) { const err = await res.json().catch(() => null); alert(err?.error || 'Error'); return; }
      fetchCarts();
    } catch (e) { alert('Error'); }
  };

  const finalize = async (cartId: number) => {
    if (!confirm('¿Finalizar y crear la orden (se descontará stock)?')) return;
    try {
      const res = await fetch(`${API_BASE}/checkout/${cartId}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { const err = await res.json().catch(() => null); alert(err?.error || 'Error al finalizar'); return; }
      const data = await res.json();
      alert('Orden creada y finalizada. ID: ' + (data.orden?.id || data.orden?.ID || ''));
      fetchCarts();
    } catch (e) { alert('Error finalizando'); }
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
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-semibold">Carrito #{cid} - Estado: {cart.estado}</div>
                    <div className="text-sm text-gray-600">Cliente: {cart.user?.name ?? cart.user_id} · {cart.created_at ? new Date(cart.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    {!expanded && (
                      <>
                        <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => openCartInView(cid, 'cliente')}>Ver</button>
                        <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => openCartInView(cid, 'vendedora')}>Editar</button>
                      </>
                    )}
                    {expanded && (
                      <>
                        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => closeExpanded()}>Cerrar</button>
                        {mode === 'vendedora' && <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => setStatus(cid, 'listo_para_pago')}>Listo para pago</button>}
                        {mode === 'vendedora' && <button className="px-3 py-1 bg-green-700 text-white rounded" onClick={() => finalize(cid)}>Finalizar venta</button>}
                      </>
                    )}
                  </div>
                </div>

                {expanded ? (
                  <div>
                    <table className="min-w-full border mb-3">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-2 py-1">Producto</th>
                          <th className="border px-2 py-1">Variante</th>
                          <th className="border px-2 py-1">Ubicación</th>
                          <th className="border px-2 py-1">Reservado</th>
                          <th className="border px-2 py-1">Cantidad</th>
                          <th className="border px-2 py-1">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cart.items || []).map((it: any) => (
                          <tr key={it.ID ?? it.id ?? (it.product_id + '-' + it.variant_id)}>
                            <td className="border px-2 py-1">{it.product?.name ?? it.product_name ?? it.product_id}</td>
                            <td className="border px-2 py-1">{it.variant?.sku ?? it.variant_id}</td>
                            <td className="border px-2 py-1">{it.location ?? it.Location ?? ''}</td>
                            <td className="border px-2 py-1">{it.reserved_quantity ?? it.ReservedQuantity ?? 0}</td>
                            <td className="border px-2 py-1">
                              {mode === 'vendedora' ? (
                                <input type="number" min={1} defaultValue={it.quantity} onBlur={(e) => updateQty(cid, it.product_id, it.variant_id, Number((e.target as HTMLInputElement).value))} className="w-20 border px-1 py-0.5 rounded" />
                              ) : (
                                <span>{it.quantity}</span>
                              )}
                              {it.requires_stock_check && !it.stock_confirmed && (
                                <div className="text-sm text-orange-700">Pendiente verificación</div>
                              )}
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
                                          if (!vsRes.ok) { alert('No se pudo consultar stock'); return; }
                                          const stocks = await vsRes.json();
                                          // find first location with available (stock - reserved) >= quantity
                                          const needed = it.quantity || 1;
                                          const found = (Array.isArray(stocks) ? stocks : (stocks.stocks || [])).find((s: any) => ((s.stock ?? s.Quantity ?? 0) - (s.reserved ?? s.Reserved ?? 0)) >= needed);
                                          if (!found) { alert('No hay stock disponible en ninguna ubicación para esta variante'); return; }
                                          const location = found.location ?? found.Location ?? found.location;
                                          // call update with reserve + location + stock_confirmed
                                          const res = await fetch(`${API_BASE}/cart/update/${it.product_id}?variant_id=${it.variant_id}&cart_id=${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ stock_confirmed: true, location, reserve: true }) });
                                          if (!res.ok) { const err = await res.json().catch(() => null); alert(err?.error || 'No se pudo confirmar y reservar'); return; }
                                          alert('Item marcado como en stock y reservado en ' + location);
                                          fetchCarts();
                                        } catch (e) { alert('Error'); }
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
                    </table>

                    {mode === 'vendedora' && (
                      <div className="mb-2">
                        <div className="flex gap-2 items-center">
                          <select id={`product-select-${cid}`} onChange={(e) => onSelectProduct(Number(e.target.value))} className="border px-2 py-1">
                            <option value={0}>Selecciona producto</option>
                            {products.map(p => (
                              <option key={p.ID ?? p.id} value={p.ID ?? p.id}>{p.name}</option>
                            ))}
                          </select>
                          <select id={`variant-select-${cid}`} className="border px-2 py-1" onChange={async (e) => { setAddQty(1); const v = Number(e.target.value); if (v) await onVariantSelectForCart(cid, v); }}>
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
                          <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} className="w-20 border px-1 py-0.5 rounded" />
                          <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => {
                            const selProd = Number((document.getElementById(`product-select-${cid}`) as HTMLSelectElement)?.value || 0);
                            const selVariant = selectedVariantMap[cid] ?? Number((document.getElementById(`variant-select-${cid}`) as HTMLSelectElement)?.value || 0);
                            const selLocation = selectedLocationMap[cid];
                            if (!selProd || !selVariant) { alert('Selecciona producto y variante'); return; }
                            addToCart(cid, selProd, selVariant, addQty, selLocation);
                          }}>Agregar</button>
                        </div>
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
    </main>
  );
}
