  "use client";
  // Estado para productos confirmados con faltante de stock tras rechequeo
  // (debe ir después de imports, dentro del componente)
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "../../../utils/api";
import Modal from "../../../components/Modal";
import RemitosCarrito from "../../../components/RemitosCarrito";

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
  const [previousTierName, setPreviousTierName] = useState<string | null>(null);
  const [tierJustChanged, setTierJustChanged] = useState<boolean>(false);
  // Estado para advertencias visuales de stock confirmado
  const [confirmedStockAlerts, setConfirmedStockAlerts] = useState<Record<string, { available: number, location: string }>>({});
  
  // Estados para manejo de items pendientes de confirmación
  const [pendingItemLocations, setPendingItemLocations] = useState<Record<string, any[]>>({});
  const [showingLocations, setShowingLocations] = useState<Record<string, boolean>>({});
  const [selectedPendingLocations, setSelectedPendingLocations] = useState<Record<string, string>>({});
  
  // Estados para edición de dirección
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    street: '',
    floor: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Argentina',
    reference: '',
    label: ''
  });
  
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

  const openEditAddressModal = (address: any) => {
    setEditingAddress(address);
    setAddressForm({
      recipient_name: address.recipient_name || '',
      recipient_phone: address.recipient_phone || '',
      street: address.street || '',
      floor: address.floor || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || 'Argentina',
      reference: address.reference || '',
      label: address.label || ''
    });
    setShowAddressModal(true);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;
    
    if (!addressForm.recipient_name || !addressForm.recipient_phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.postal_code) {
      showModal('warning', 'Campos requeridos', 'Por favor completa todos los campos obligatorios (nombre, teléfono, calle, ciudad, provincia y código postal).');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al actualizar dirección');
      }

      setShowAddressModal(false);
      setEditingAddress(null);
      showModal('success', 'Dirección actualizada', 'La dirección del cliente se actualizó correctamente.');
      fetchCarts(); // Recargar datos
    } catch (err: any) {
      showModal('error', 'Error', err.message || 'No se pudo actualizar la dirección');
    }
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

  // Detectar cambios en el tier actual
  useEffect(() => {
    if (!carts || carts.length === 0) return;
    
    carts.forEach((cart: any) => {
      if (cart.summary && cart.summary.current_tier) {
        const currentTierName = cart.summary.current_tier.display_name || cart.summary.current_tier.name;
        
        // Si hay un tier anterior y es diferente al actual
        if (previousTierName && previousTierName !== currentTierName) {
          setTierJustChanged(true);
        }
        
        // Actualizar el tier anterior
        setPreviousTierName(currentTierName);
      }
    });
  }, [carts]);

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
      
      // Limpiar búsqueda y selección después de agregar
      setSearchQuery('');
      setShowSearchResults(false);
      setSearchResults([]);
      setSelectedProduct(null);
      setVariants([]);
      setAddQty(1);
      setSelectedLocationMap({});
      setSelectedVariantMap({});
      
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
      showModal('success', '¡Producto eliminado!', 'El producto se eliminó correctamente del carrito');
      fetchCarts();
    } catch (e) { 
      showModal('error', 'Error', 'Error al eliminar el producto');
    }
  };

  const setStatus = async (cartId: number, estado: string) => {
    try {
      // Buscar el carrito para obtener el order_id
      const cart = carts.find(c => (c.ID ?? c.id) === cartId);
      const orderId = cart?.order_id;

      // Si el estado es 'listo_para_pago', primero actualizar el carrito
      if (estado === 'listo_para_pago') {
        const resCart = await fetch(`${API_BASE}/cart/${cartId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ Estado: estado })
        });
        if (!resCart.ok) {
          const err = await resCart.json().catch(() => null);
          showModal('error', 'Error', err?.error || 'No se pudo actualizar el estado del carrito');
          return;
        }
      }

      // Actualizar el estado de la orden si existe
      if (orderId) {
        const resOrder = await fetch(`${API_BASE}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: estado })
        });
        if (!resOrder.ok) {
          const err = await resOrder.json().catch(() => null);
          showModal('error', 'Error', err?.error || 'No se pudo actualizar el estado de la orden');
          return;
        }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Órdenes Activas</h1>
        <p className="text-gray-600 text-sm mt-1">Gestiona tus órdenes en progreso</p>
      </div>
      {loading ? <div>Cargando...</div> : error ? <div className="text-red-500">{error}</div> : (
        <div className="space-y-4">
          {carts.filter(cart => {
            // Filtrar solo órdenes con order_id y estados activos
            if (!cart.order_id) return false;
            const estado = cart.estado?.toLowerCase();
            return estado !== 'completado' && estado !== 'cancelado';
          }).length === 0 && <div>No tienes órdenes activas.</div>}
          {carts.filter(cart => {
            // Filtrar solo órdenes con order_id y estados activos
            if (!cart.order_id) return false;
            const estado = cart.estado?.toLowerCase();
            return estado !== 'completado' && estado !== 'cancelado';
          }).map((cart) => {
            const cid = cart.ID ?? cart.id;
            const orderId = cart.order_id;
            const displayId = `Orden #${orderId}`;
            const expanded = expandedCart === cid;
            const mode = viewModeMap[cid] ?? 'vendedora';
            
            // Usar summary si está disponible (viene del backend con precios correctos)
            const summaryItems = cart.summary?.items || [];
            const hasSummary = summaryItems.length > 0;
            
            // Separar items confirmados vs pendientes
            const confirmedItems = hasSummary 
              ? summaryItems.filter((it: any) => it.stock_confirmed)
              : (cart.items || []).filter((it: any) => !it.requires_stock_check || it.stock_confirmed);
            const pendingItems = hasSummary
              ? summaryItems.filter((it: any) => !it.stock_confirmed && it.requires_stock_check)
              : (cart.items || []).filter((it: any) => it.requires_stock_check && !it.stock_confirmed);
            
            return (
              <div key={cid} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <span>{displayId}</span>
                      {/* Badge de estado con colores */}
                      {cart.estado === 'esperando_vendedora' && (
                        <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                          ⏳ Esperando confirmación
                        </span>
                      )}
                      {cart.estado === 'listo_para_pago' && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          💰 Listo para pago
                        </span>
                      )}
                      {cart.estado === 'pagado' && (
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                          ✅ Pagado
                        </span>
                      )}
                      {cart.estado === 'enviado' && (
                        <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                          📦 Enviado
                        </span>
                      )}
                      {cart.estado === 'completado' && (
                        <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                          ✓ Completado
                        </span>
                      )}
                      {(cart.estado === 'listo_para_pago' || cart.estado === 'completado' || cart.estado === 'pagado' || cart.estado === 'enviado') && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
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
                    
                    {/* Dirección de entrega */}
                    {cart.default_address ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold text-green-900">📍 Dirección de entrega:</div>
                          <button
                            onClick={() => openEditAddressModal(cart.default_address)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                            title="Editar dirección"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium text-gray-700">Destinatario:</span>{' '}
                            <span className="text-gray-900">{cart.default_address.recipient_name}</span>
                            {cart.default_address.recipient_phone && (
                              <span className="ml-2 text-gray-600">
                                (Tel: <a href={`tel:${cart.default_address.recipient_phone}`} className="text-blue-600 hover:underline">{cart.default_address.recipient_phone}</a>)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Dirección:</span>{' '}
                            <span className="text-gray-900">
                              {cart.default_address.street}
                              {cart.default_address.floor && ` - ${cart.default_address.floor}`}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Localidad:</span>{' '}
                            <span className="text-gray-900">
                              {cart.default_address.city}, {cart.default_address.state} ({cart.default_address.postal_code})
                            </span>
                          </div>
                          {cart.default_address.reference && (
                            <div>
                              <span className="font-medium text-gray-700">Referencia:</span>{' '}
                              <span className="text-gray-600 italic">{cart.default_address.reference}</span>
                            </div>
                          )}
                          {cart.default_address.label && (
                            <div className="mt-1">
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {cart.default_address.label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-700">⚠️</span>
                          <div>
                            <div className="font-semibold text-yellow-900">Sin dirección de entrega</div>
                            <div className="text-sm text-yellow-700">El cliente aún no ha configurado una dirección predeterminada.</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                        
                        {/* Botones de flujo para vendedora */}
                        {mode === 'vendedora' && (
                          <>
                            {/* Si está esperando_vendedora y todos los items están confirmados, puede marcar como listo */}
                            {cart.estado === 'esperando_vendedora' && pendingItems.length === 0 && confirmedItems.length > 0 && (
                              <button 
                                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold transition-colors" 
                                onClick={() => setStatus(cid, 'listo_para_pago')}
                              >
                                ✓ Marcar como listo para pago
                              </button>
                            )}
                            
                            {/* Si hay items pendientes, mostrar advertencia */}
                            {cart.estado === 'esperando_vendedora' && pendingItems.length > 0 && (
                              <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded border border-orange-300 text-sm">
                                ⚠️ Confirma el stock de {pendingItems.length} {pendingItems.length === 1 ? 'producto' : 'productos'} pendiente{pendingItems.length === 1 ? '' : 's'} para continuar
                              </div>
                            )}
                            
                            {/* Si está listo_para_pago, puede marcar como pagado */}
                            {cart.estado === 'listo_para_pago' && (
                              <button 
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors" 
                                onClick={() => setStatus(cid, 'pagado')}
                              >
                                💳 Marcar como pagado
                              </button>
                            )}
                            
                            {/* Si está pagado, puede marcar como enviado */}
                            {cart.estado === 'pagado' && (
                              <button 
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold transition-colors" 
                                onClick={() => setStatus(cid, 'enviado')}
                              >
                                📦 Marcar como enviado
                              </button>
                            )}
                            
                            {/* Si está enviado, puede finalizar */}
                            {cart.estado === 'enviado' && (
                              <button 
                                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold transition-colors" 
                                onClick={() => finalize(cid)}
                              >
                                ✓ Finalizar venta (Entregado)
                              </button>
                            )}
                            
                            {/* Opción para volver atrás */}
                            {cart.estado === 'listo_para_pago' && (
                              <button 
                                className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm" 
                                onClick={() => setStatus(cid, 'esperando_vendedora')}
                                title="Volver a edición"
                              >
                                ← Volver a edición
                              </button>
                            )}
                            
                            {(cart.estado === 'pagado' || cart.estado === 'enviado') && (
                              <button 
                                className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm" 
                                onClick={() => setStatus(cid, 'listo_para_pago')}
                                title="Volver a estado anterior"
                              >
                                ← Volver atrás
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {expanded ? (
                  <div>
                    {/* Items confirmados */}
                    {confirmedItems.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-semibold text-green-700">✓ Productos confirmados</h3>
                          {mode === 'vendedora' && (
                            <button
                              className="ml-2 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-semibold"
                              onClick={async () => {
                                // Rechequear stock de productos confirmados
                                const outOfStock: any[] = [];
                                const newAlerts: Record<string, { available: number, location: string }> = {};
                                for (const it of confirmedItems) {
                                  try {
                                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                    const res = await fetch(`${API_BASE}/variants/${it.variant_id}/stock`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                                    if (!res.ok) continue;
                                    const stocks = await res.json();
                                    const stocksArray = Array.isArray(stocks) ? stocks : (stocks.stocks || []);
                                    // Determinar ubicación confirmada
                                    let confirmedLocation = it.location ?? it.Location;
                                    if (!confirmedLocation && selectedLocationMap && selectedLocationMap[cid]) {
                                      confirmedLocation = selectedLocationMap[cid];
                                    }
                                    if (!confirmedLocation) {
                                      confirmedLocation = 'deposito';
                                    }
                                    // Buscar stock en la ubicación confirmada
                                    const loc = confirmedLocation ? stocksArray.find((s: any) => (s.location ?? s.Location) === confirmedLocation) : undefined;
                                    const stock = loc ? (loc.stock ?? loc.Quantity ?? 0) : 0;
                                    const reserved = loc ? (loc.reserved ?? loc.Reserved ?? 0) : 0;
                                    const available = stock - reserved;
                                    if (!loc || available < (it.quantity || 1)) {
                                      outOfStock.push({
                                        ...it,
                                        available,
                                        location: confirmedLocation || '(sin ubicación)',
                                      });
                                      // Guardar alerta visual
                                      const key = `${it.product_id}-${it.variant_id}`;
                                      newAlerts[key] = { available, location: confirmedLocation || '(sin ubicación)' };
                                    }
                                  } catch {}
                                }
                                if (outOfStock.length === 0) {
                                  setConfirmedStockAlerts({});
                                  showModal('success', 'Stock OK', 'Todos los productos confirmados tienen stock suficiente en depósito.');
                                } else {
                                  setConfirmedStockAlerts(newAlerts);
                                  showModal(
                                    'warning',
                                    'Faltante de stock',
                                    `Los siguientes productos no tienen stock suficiente en la ubicación confirmada:\n\n` +
                                      outOfStock.map(p => `• ${p.product?.name ?? p.product_name ?? 'Producto'} (Variante: ${formatVariant(p.variant)}) en ${p.location}: solicitado ${p.quantity}, disponible ${p.available ?? 0}`).join('\n') +
                                    '\n\nEliminalos o selecciona otra ubicación para continuar.'
                                  );
                                }
                              }}
                            >
                              🔄 Rechequear stock en depósito
                            </button>
                          )}
                        </div>
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
                            {confirmedItems.map((it: any) => {
                              const key = `${it.product_id}-${it.variant_id}`;
                              const alert = confirmedStockAlerts[key];
                              return (
                                <tr key={it.ID ?? it.id ?? (it.product_id + '-' + it.variant_id)} className={alert ? 'bg-orange-100' : ''}>
                                  <td className="border px-2 py-1">
                                    {(hasSummary ? it.image_url : it.product?.image_url) ? (
                                      <img 
                                        src={(() => {
                                          const imgUrl = hasSummary ? it.image_url : it.product.image_url;
                                          return imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                        })()} 
                                        alt={it.product?.name || it.product_name || 'Producto'} 
                                        className="w-16 h-16 object-cover rounded"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"%3E%3Crect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"%3E%3C/rect%3E%3Ccircle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"%3E%3C/circle%3E%3Cpolyline points=\"21 15 16 10 5 21\"%3E%3C/polyline%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                        Sin imagen
                                      </div>
                                    )}
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    {/* Detectar si el producto fue eliminado */}
                                    {!it.product && !it.product_name ? (
                                      <div>
                                        <div className="font-medium text-red-600">⚠️ Producto eliminado</div>
                                        <div className="text-xs text-gray-500">ID: {it.product_id}</div>
                                        <div className="text-xs bg-yellow-50 border border-yellow-300 text-yellow-700 px-2 py-1 rounded mt-1">
                                          Este producto ya no está disponible
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="font-medium">{it.product?.name ?? it.product_name ?? it.product_id}</div>
                                        {(it.location ?? it.Location) && (
                                          <div className="text-xs text-gray-500">Ubicación: {it.location ?? it.Location}</div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    <span className="font-mono text-sm">{it.product?.code || 'N/A'}</span>
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    <div className="text-sm">{formatVariant(it.variant)}</div>
                                    <div className="text-xs text-gray-400 font-mono">{it.variant?.sku}</div>
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    {mode === 'vendedora' ? (
                                      <input type="number" min={1} defaultValue={it.quantity} onBlur={(e) => updateQty(cid, it.product_id, it.variant_id, Number((e.target as HTMLInputElement).value))} className="w-20 border px-1 py-0.5 rounded" />
                                    ) : (
                                      <span>{it.quantity}</span>
                                    )}
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    <span className="font-medium">${hasSummary ? it.unit_price.toFixed(2) : (calculatePriceWithTier(it.product?.cost_price ?? 0, (cart.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0))).toFixed(2)}</span>
                                  </td>
                                  <td className="border px-2 py-1 align-top">
                                    <span className="font-bold text-blue-700">${hasSummary ? it.subtotal.toFixed(2) : (calculatePriceWithTier(it.product?.cost_price ?? 0, (cart.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0)) * it.quantity).toFixed(2)}</span>
                                  </td>
                                  <td className="border px-2 py-1">
                                    <div className="flex gap-2 items-start">
                                      {alert && (
                                        <div className="text-xs text-orange-700 font-semibold bg-orange-200 rounded px-2 py-1 mr-1">
                                          ⚠️ Faltante: disponible {alert.available} en {alert.location}
                                        </div>
                                      )}
                                      {mode === 'vendedora' && (
                                        <button className="text-xs bg-red-600 text-white px-2 py-1 rounded" onClick={() => removeItem(cid, it.product_id, it.variant_id)}>Quitar</button>
                                      )}
                                      {mode === 'cliente' && <span className="text-sm text-gray-600">(solo lectura)</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="border px-2 py-2 text-right font-semibold">Total de productos:</td>
                          <td className="border px-2 py-2 font-semibold text-center">
                            {confirmedItems.reduce((sum: number, it: any) => sum + it.quantity, 0)}
                          </td>
                          <td colSpan={3} className="border px-2 py-2"></td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={6} className="border px-2 py-2 text-right">TOTAL:</td>
                          <td className="border px-2 py-2 text-blue-700 text-lg">
                            ${hasSummary 
                              ? cart.summary.subtotal.toFixed(2)
                              : (() => {
                                const totalQty = (cart.items || []).reduce((sum: number, it: any) => sum + it.quantity, 0);
                                return confirmedItems.reduce((sum: number, it: any) => {
                                  const unitPrice = calculatePriceWithTier(it.product?.cost_price ?? 0, totalQty);
                                  return sum + (unitPrice * it.quantity);
                                }, 0).toFixed(2);
                              })()}
                          </td>
                          <td className="border px-2 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    {/* Remitos internos asociados al carrito */}
                    <RemitosCarrito cartId={cart.id} />
                  </>
                )}

                    {/* Productos pendientes de confirmación de stock */}
                    {pendingItems.length > 0 && mode === 'vendedora' && (
                      <div className="mt-6">
                        <h3 className="text-md font-semibold mb-3 text-orange-700">⚠️ Productos pendientes de confirmación de stock ({pendingItems.length})</h3>
                        <div className="space-y-3">
                          {pendingItems.map((it: any) => {
                            const itemKey = `pending-${cid}-${it.product_id}-${it.variant_id}`;
                            const isExpanded = showingLocations[itemKey] || false;
                            const locs = pendingItemLocations[itemKey] || [];
                            const selectedLoc = selectedPendingLocations[itemKey] || '';
                            
                            // Calcular precio según tier actual
                            let unitPrice = 0;
                            
                            if (hasSummary) {
                              // Si tenemos summary del backend, usar el precio calculado allí
                              unitPrice = it.unit_price || 0;
                            } else {
                              // Calcular precio manualmente si no hay summary
                              const totalQty = (cart.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
                              const tiersArray = (priceTiers as any)?.tiers || priceTiers;
                              unitPrice = it.product?.wholesale_price || 0;
                              
                              if (Array.isArray(tiersArray) && tiersArray.length > 0) {
                                const activeTiers = tiersArray
                                  .filter((t: any) => t.active)
                                  .sort((a: any, b: any) => (b.min_quantity || 0) - (a.min_quantity || 0));
                                const currentTier = activeTiers.find((t: any) => totalQty >= (t.min_quantity || 0));
                                
                                if (currentTier && it.product) {
                                  if (totalQty >= 12 && it.product.discount2_price) {
                                    unitPrice = it.product.discount2_price;
                                  } else if (totalQty >= 6 && it.product.discount1_price) {
                                    unitPrice = it.product.discount1_price;
                                  } else {
                                    unitPrice = it.product.wholesale_price || 0;
                                  }
                                }
                              }
                            }
                            
                            return (
                              <div key={itemKey} className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                                <div className="flex gap-4">
                                  {/* Imagen */}
                                  <div className="flex-shrink-0">
                                    {(hasSummary ? it.image_url : it.product?.image_url) ? (
                                      <img 
                                        src={(() => {
                                          const imgUrl = hasSummary ? it.image_url : it.product.image_url;
                                          return imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                        })()} 
                                        alt={it.product?.name || it.product_name || 'Producto'} 
                                        className="w-24 h-24 object-cover rounded"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                        Sin imagen
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Info del producto */}
                                  <div className="flex-1">
                                    <div className="font-medium text-lg mb-1">{it.product?.name ?? it.product_name ?? 'Producto'}</div>
                                    <div className="text-sm text-gray-600 space-y-0.5">
                                      <div>Código: <span className="font-mono">{it.product?.code || 'N/A'}</span></div>
                                      <div>Variante: {formatVariant(it.variant)} <span className="text-xs text-gray-400 font-mono">({it.variant?.sku})</span></div>
                                      <div>Cantidad solicitada: <span className="font-semibold text-orange-700">{it.quantity}</span></div>
                                      <div className="mt-2 pt-2 border-t border-orange-200">
                                        <span className="font-semibold text-green-700">Precio según tier actual:</span>{' '}
                                        <span className="text-lg font-bold text-green-800">
                                          ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">(c/u)</span>
                                        <div className="text-xs text-gray-600 mt-1">
                                          Subtotal: ${(unitPrice * it.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Botones de acción */}
                                    {!isExpanded && (
                                      <div className="mt-3 flex gap-2">
                                        <button 
                                          className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                          onClick={async () => {
                                            try {
                                              const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                              const vsRes = await fetch(`${API_BASE}/variants/${it.variant_id}/stock`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                                              if (!vsRes.ok) {
                                                showModal('error', 'Error', 'No se pudo consultar stock');
                                                return;
                                              }
                                              const stocks = await vsRes.json();
                                              const stocksArray = Array.isArray(stocks) ? stocks : (stocks.stocks || []);
                                              setPendingItemLocations(prev => ({ ...prev, [itemKey]: stocksArray }));
                                              setShowingLocations(prev => ({ ...prev, [itemKey]: true }));
                                            } catch (e) {
                                              showModal('error', 'Error', 'Error al consultar ubicaciones');
                                            }
                                          }}
                                        >
                                          📍 Ver ubicaciones disponibles
                                        </button>
                                        <button 
                                          className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                                          onClick={async () => {
                                            showModal('confirm', '¿Eliminar producto?', '¿Estás segura de que NO deseas agregar este producto? Se eliminará de la orden.', async () => {
                                              try {
                                                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                                const res = await fetch(`${API_BASE}/cart/remove/${it.product_id}?variant_id=${it.variant_id}&cart_id=${cid}`, {
                                                  method: 'DELETE',
                                                  headers: token ? { Authorization: `Bearer ${token}` } : {}
                                                });
                                                if (!res.ok) {
                                                  const err = await res.json().catch(() => null);
                                                  showModal('error', 'Error', err?.error || 'No se pudo eliminar el producto');
                                                  return;
                                                }
                                                showModal('success', 'Producto eliminado', 'El producto pendiente fue eliminado de la orden');
                                                fetchCarts();
                                              } catch (e) {
                                                showModal('error', 'Error', 'Error al eliminar producto');
                                              }
                                            });
                                          }}
                                        >
                                          ❌ No agregar
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Lista de ubicaciones */}
                                    {isExpanded && (
                                      <div className="mt-3">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="text-sm font-semibold text-gray-700">Selecciona una ubicación:</div>
                                          <button
                                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                                            onClick={() => {
                                              setShowingLocations(prev => {
                                                const newState = { ...prev };
                                                delete newState[itemKey];
                                                return newState;
                                              });
                                              setSelectedPendingLocations(prev => {
                                                const newState = { ...prev };
                                                delete newState[itemKey];
                                                return newState;
                                              });
                                            }}
                                          >
                                            ← Cancelar
                                          </button>
                                        </div>
                                        {locs.length === 0 ? (
                                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                            ❌ No hay stock disponible en ninguna ubicación
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {locs.map((loc: any) => {
                                              const stock = loc.stock ?? loc.Quantity ?? 0;
                                              const reserved = loc.reserved ?? loc.Reserved ?? 0;
                                              const available = stock - reserved;
                                              const location = loc.location ?? loc.Location;
                                              const hasEnough = available >= (it.quantity || 1);
                                              
                                              return (
                                                <div 
                                                  key={location}
                                                  className={`border rounded p-3 flex justify-between items-center transition ${
                                                    hasEnough ? 'cursor-pointer hover:bg-white' : 'cursor-not-allowed'
                                                  } ${
                                                    selectedLoc === location ? 'border-blue-500 bg-blue-50 shadow' : 'border-gray-300'
                                                  } ${!hasEnough ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                                                  onClick={() => hasEnough && setSelectedPendingLocations(prev => ({ ...prev, [itemKey]: location }))}
                                                >
                                                  <div>
                                                    <div className="font-medium text-gray-900">{location}</div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                      Disponible: <span className={hasEnough ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{available}</span> unidades
                                                      {!hasEnough && <span className="text-red-600 ml-1">(insuficiente)</span>}
                                                    </div>
                                                  </div>
                                                  {selectedLoc === location && (
                                                    <div className="text-blue-600 font-semibold text-lg">✓</div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                            
                                            {/* Botón confirmar */}
                                            {selectedLoc && (
                                              <button
                                                className="mt-3 w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 font-semibold transition shadow-md hover:shadow-lg"
                                                onClick={async () => {
                                                  try {
                                                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                                    const res = await fetch(`${API_BASE}/cart/update/${it.product_id}?variant_id=${it.variant_id}&cart_id=${cid}`, {
                                                      method: 'PUT',
                                                      headers: { 
                                                        'Content-Type': 'application/json', 
                                                        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
                                                      },
                                                      body: JSON.stringify({ 
                                                        stock_confirmed: true, 
                                                        location: selectedLoc, 
                                                        reserve: true 
                                                      })
                                                    });
                                                    if (!res.ok) {
                                                      const err = await res.json().catch(() => null);
                                                      showModal('error', 'Error', err?.error || 'No se pudo confirmar y reservar');
                                                      return;
                                                    }
                                                    showModal('success', 'Stock confirmado', `Producto confirmado y reservado en ${selectedLoc}`);
                                                    // Limpiar estados
                                                    setShowingLocations(prev => {
                                                      const newState = { ...prev };
                                                      delete newState[itemKey];
                                                      return newState;
                                                    });
                                                    setSelectedPendingLocations(prev => {
                                                      const newState = { ...prev };
                                                      delete newState[itemKey];
                                                      return newState;
                                                    });
                                                    setPendingItemLocations(prev => {
                                                      const newState = { ...prev };
                                                      delete newState[itemKey];
                                                      return newState;
                                                    });
                                                    fetchCarts();
                                                  } catch (e) {
                                                    showModal('error', 'Error', 'Error al confirmar stock');
                                                  }
                                                }}
                                              >
                                                ✓ Confirmar stock desde {selectedLoc}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                              <div className="font-semibold text-blue-900 flex items-center gap-2">
                                📊 Tier actual: <span className="text-indigo-700">{currentTier.display_name || currentTier.name}</span>
                                {tierJustChanged && (
                                  <span className="animate-pulse bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    ✓ Actualizado
                                  </span>
                                )}
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
                                  {stocks.map((s: any, idx: number) => {
                                    const stock = s.stock ?? s.Quantity ?? 0;
                                    const reserved = s.reserved ?? s.Reserved ?? 0;
                                    const available = stock - reserved;
                                    return (
                                      <option key={idx} value={s.location ?? s.Location ?? s.location}>{`${s.location ?? s.Location ?? s.location} — ${available} disponibles`}</option>
                                    );
                                  })}
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

      {/* Modal de edición de dirección */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">✏️ Editar Dirección del Cliente</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del destinatario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.recipient_name}
                      onChange={(e) => setAddressForm({...addressForm, recipient_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressForm.recipient_phone}
                      onChange={(e) => setAddressForm({...addressForm, recipient_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 11-1234-5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Calle y número"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Piso/Depto
                    </label>
                    <input
                      type="text"
                      value={addressForm.floor}
                      onChange={(e) => setAddressForm({...addressForm, floor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 5° B"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ciudad/Localidad"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provincia"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="CP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <textarea
                    value={addressForm.reference}
                    onChange={(e) => setAddressForm({...addressForm, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Entre calle X y Y, frente a la plaza..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Casa, Trabajo, Casa de mamá..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateAddress}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
