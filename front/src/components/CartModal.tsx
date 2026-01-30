"use client";
import { useEffect, useState, useRef } from "react";
// Unificar mínimo mayorista y vendedora
const MIN_WHOLESALE_QUANTITY = 6;
import { usePathname, useRouter } from "next/navigation";
import useFocusTrap from "../hooks/useFocusTrap";
import useCart from "../hooks/useCart";
import useCartSummary from "../hooks/useCartSummary";
import useCartStockCheck from "../hooks/useCartStockCheck";
import { resolveImageUrl, API_BASE } from "../utils/api";
import { getGuestCart, removeFromGuestCart, updateGuestCartQuantity, clearGuestCart, GuestCartItem } from "../utils/guestCart";
import { useAuth } from "../contexts/AuthContext";

export default function CartModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const { cart, message, removeFromCart, updateQuantityVariant, clearCart, fetchCart } = useCart();
  const { summary, refetch: refetchSummary } = useCartSummary(true); // Habilitar notificaciones aquí
  const { stockIssues, allAvailable, recheckStock } = useCartStockCheck();
  const [requestingSeller, setRequestingSeller] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showSellerRequestedModal, setShowSellerRequestedModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [sellerName, setSellerName] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar re-renders
  const messageTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  useFocusTrap(containerRef, open);

  // Cargar carrito de invitado y escuchar cambios
  useEffect(() => {
    if (!user) {
      // Cargar carrito de invitado desde localStorage
      const items = getGuestCart();
      console.log('DEBUG - Carrito cargado del localStorage:', items);
      setGuestCart(items);
      
      // Escuchar cambios en el carrito de invitado
      const handleGuestCartUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<GuestCartItem[]>;
        const updatedItems = customEvent.detail || getGuestCart();
        console.log('DEBUG - Carrito actualizado:', updatedItems);
        setGuestCart(updatedItems);
      };
      
      window.addEventListener('guest-cart-updated', handleGuestCartUpdate);
      
      return () => {
        window.removeEventListener('guest-cart-updated', handleGuestCartUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    // open if pathname is /carrito on mount
    if (typeof window !== "undefined") {
      const shouldOpen = window.location.pathname === "/carrito";
      setOpen(shouldOpen);
      if (shouldOpen) setTimeout(() => setAnimateIn(true), 10);
    } else {
      const shouldOpen = pathname === "/carrito";
      setOpen(shouldOpen);
      if (shouldOpen) setTimeout(() => setAnimateIn(true), 10);
    }

    const onPop = () => {
      const isCart = window.location.pathname === "/carrito";
      setOpen(isCart);
      setAnimateIn(isCart);
      if (!isCart) {
        // if we're leaving the cart route, try to restore focus to the opener
        // @ts-expect-error runtime helper slot
        const prev = window._cartPrevActive as HTMLElement | null | undefined;
        try {
          if (prev && typeof prev.focus === "function") prev.focus();
        } catch (e) {}
        // clean up
        // @ts-expect-error runtime helper slot
        delete window._cartPrevActive;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    function handleClose() {
      // play exit animation, then go back in history and close
      setAnimateIn(false);
      setTimeout(() => {
        if (window.location.pathname === "/carrito") window.history.back();
        setOpen(false);
      }, 300);
    }

  window.addEventListener("popstate", onPop);
  window.addEventListener("keydown", onKey);

    // expose helpers
    // @ts-expect-error attach runtime helper to window
    window.openCart = () => {
      // store the currently focused element so we can restore focus when closing
      // @ts-expect-error runtime helper slot
      window._cartPrevActive = document.activeElement as HTMLElement | null;
      if (window.location.pathname !== "/carrito") window.history.pushState({}, "", "/carrito");
      setOpen(true);
      setTimeout(() => setAnimateIn(true), 10);
    };
    // @ts-expect-error attach runtime helper to window
    window.closeCart = () => {
      // animate out first
      setAnimateIn(false);
      setTimeout(() => {
        if (window.location.pathname === "/carrito") window.history.back();
        setOpen(false);
      }, 300);
    };

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      // @ts-expect-error delete runtime helper
      delete window.openCart;
      // @ts-expect-error delete runtime helper
      delete window.closeCart;
      // @ts-expect-error delete runtime helper
      delete window._cartPrevActive;
    };
  }, [pathname]);

  // Refetch summary and stock check when cart changes
  useEffect(() => {
    if (open) {
      refetchSummary();
      recheckStock();
    }
  }, [cart?.items?.length, open, refreshKey]);

  if (!open) return null;

  const items = cart?.items ?? [];
  const summaryItems = summary?.items ?? [];
  
  console.log('🔍 ========== CART MODAL DEBUG ==========');
  console.log('📦 Cart data:', {
    total_items: items.length,
    cart_id: (cart as any)?.id ?? (cart as any)?.ID,
    cart_status: (cart as any)?.estado ?? (cart as any)?.status
  });
  console.log('📊 Summary data:', {
    summary_exists: !!summary,
    summary_items_count: summaryItems.length,
    total_quantity: summary?.total_quantity,
    tier_name: summary?.tier?.display_name,
    tier_min_quantity: summary?.tier?.min_quantity
  });
  
  // Si no hay usuario, usar carrito de invitado
  const hasServerItems = items.length > 0;
  const hasGuestItems = guestCart.length > 0;
  const isGuest = !user;
  
  // Usar los precios del summary si están disponibles, sino usar cálculo original
  const useDynamicPricing = summaryItems.length > 0 && !isGuest;
  
  let subtotalOriginal = 0;
  let totalDiscount = 0;
  
  const itemsWithPricing = items.map((item: any) => {
    const qty = Number(item.quantity ?? 0);
    
    if (useDynamicPricing) {
      // Buscar el item en el summary usando ID (mayúscula) que es el campo correcto
      const summaryItem = summaryItems.find((si: any) => si.cart_item_id === item.ID);
      
      if (summaryItem) {
        const unitPrice = summaryItem.unit_price;
        const lineFinal = summaryItem.subtotal;
        const costPrice = summaryItem.cost_price;
        
        // Calcular precio del tier anterior para comparar
        let previousTierPrice = unitPrice;
        let hasTierDiscount = false;
        
        if (summary?.tier && summary?.all_tiers) {
          const currentTier = summary.tier;
          const allTiers = summary.all_tiers.filter((t: any) => t.active).sort((a: any, b: any) => a.order_index - b.order_index);
          
          // Encontrar el tier anterior (el que tiene min_quantity inmediatamente menor)
          // Es decir, el tier que aplicaba ANTES de alcanzar la cantidad actual
          const previousTier = allTiers
            .filter((t: any) => t.min_quantity < currentTier.min_quantity)
            .sort((a: any, b: any) => b.min_quantity - a.min_quantity)[0]; // El más cercano por abajo
          
          if (previousTier) {
            // Calcular precio con fórmula del tier anterior
            switch (previousTier.formula_type) {
              case 'multiplier':
                previousTierPrice = costPrice * previousTier.multiplier;
                break;
              case 'percentage_markup':
                previousTierPrice = costPrice + (costPrice * previousTier.percentage / 100);
                break;
              case 'flat_amount':
                previousTierPrice = costPrice + previousTier.flat_amount;
                break;
              default:
                previousTierPrice = costPrice * 2; // Fallback
            }
            hasTierDiscount = Math.abs(previousTierPrice - unitPrice) > 0.01;
          } else {
            // Si no hay tier anterior (estamos en el tier base/minorista), NO hay descuento
            previousTierPrice = unitPrice;
            hasTierDiscount = false;
          }
        }
        
        const originalUnit = previousTierPrice;
        const lineOriginal = originalUnit * qty;
        const lineDiscount = lineOriginal - lineFinal;
        
        if (!(item.requires_stock_check && !item.stock_confirmed)) {
          subtotalOriginal += lineFinal;
        }
        
        return { item, qty, originalUnit, unitPrice, lineOriginal, lineFinal, lineDiscount, hasTierDiscount };
      }
    }
    
    // Fallback al cálculo original si no hay summary
    const originalUnit = Number(item.product_price ?? item.product?.wholesale_price ?? item.product?.WholesalePrice ?? 0);
    const discountType = item.product?.discount_type ?? item.product?.DiscountType ?? undefined;
    const discountValue = typeof item.product?.discount_value === 'number' ? item.product.discount_value : (typeof item.product?.DiscountValue === 'number' ? item.product.DiscountValue : undefined);
    let unitPrice = originalUnit;
    if (discountType === 'percent' && typeof discountValue === 'number') {
      unitPrice = originalUnit * (1 - discountValue / 100);
    } else if (discountType === 'fixed' && typeof discountValue === 'number') {
      unitPrice = originalUnit - discountValue;
    }
    if (unitPrice < 0) unitPrice = 0;
    const lineOriginal = originalUnit * qty;
    const lineFinal = unitPrice * qty;
    const lineDiscount = lineOriginal - lineFinal;
    
    if (!(item.requires_stock_check && !item.stock_confirmed)) {
      subtotalOriginal += lineOriginal;
      totalDiscount += lineDiscount;
    }
    return { item, qty, originalUnit, unitPrice, lineOriginal, lineFinal, lineDiscount, hasTierDiscount: false };
  });
  
  // Separar items confirmados de pendientes
  const pendingItems = itemsWithPricing.filter(({ item }) => item.requires_stock_check && !item.stock_confirmed);
  const visibleForPricing = itemsWithPricing.filter(({ item }) => !(item.requires_stock_check && !item.stock_confirmed));

  console.log('🔍 DEBUG CART MODAL:');
  console.log('📦 Total items recibidos:', items.length);
  console.log('📋 Items completos del carrito:', items.map(item => ({
    id: (item as any).id ?? (item as any).ID,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    requires_stock_check: item.requires_stock_check,
    stock_confirmed: item.stock_confirmed
  })));
  console.log('✅ Items con pricing (itemsWithPricing):', itemsWithPricing.length);
  console.log('⏳ Items pendientes (pendingItems):', pendingItems.length, pendingItems.map(p => ({
    id: p.item.ID,
    qty: p.qty,
    requires_check: p.item.requires_stock_check,
    confirmed: p.item.stock_confirmed
  })));
  console.log('👁️ Items visibles para pricing (visibleForPricing):', visibleForPricing.length, visibleForPricing.map(v => ({
    id: v.item.ID,
    qty: v.qty,
    requires_check: v.item.requires_stock_check,
    confirmed: v.item.stock_confirmed
  })));

  // Función helper para obtener el stock disponible de un item
  const getAvailableStock = (item: any): number | null => {
    const issue = stockIssues.find(
      i => i.product_id === item.product_id && i.variant_id === item.variant_id
    );
    return issue ? issue.available_stock : null;
  };
  
  // Calcular cantidades totales - EXCLUIR items sin stock Y items pendientes de verificación
  const confirmedQuantity = visibleForPricing.reduce((acc, { qty, item }) => {
    const availableStock = getAvailableStock(item);
    const isOutOfStock = availableStock !== null && availableStock === 0;
    const isPending = item.requires_stock_check && !item.stock_confirmed;
    return (isOutOfStock || isPending) ? acc : acc + qty;
  }, 0);
  const pendingQuantity = pendingItems.reduce((acc, { qty }) => acc + qty, 0);
  
  console.log('🔢 Cantidades calculadas:');
  console.log('  - confirmedQuantity:', confirmedQuantity);
  console.log('  - pendingQuantity:', pendingQuantity);
  
  // Calcular cantidad incluyendo items pendientes (para mostrar en el mensaje)
  const totalQuantityIncludingPending = visibleForPricing.reduce((acc, { qty, item }) => {
    const availableStock = getAvailableStock(item);
    const isOutOfStock = availableStock !== null && availableStock === 0;
    return isOutOfStock ? acc : acc + qty;
  }, 0) + pendingQuantity;
  
  // Calcular totales - EXCLUIR items sin stock Y items pendientes del subtotal
  const subtotal = visibleForPricing.reduce((acc, { lineFinal, item }) => {
    const availableStock = getAvailableStock(item);
    const isOutOfStock = availableStock !== null && availableStock === 0;
    const isPending = item.requires_stock_check && !item.stock_confirmed;
    return (isOutOfStock || isPending) ? acc : acc + lineFinal;
  }, 0);
  // Usar siempre el subtotal calculado en el frontend (ya excluye pendientes y sin stock)
  const total = subtotal;
  
  // Calcular ahorro total por tier (comparando con precios del tier anterior)
  const totalSavings = itemsWithPricing.reduce((acc: number, item: any) => {
    const availableStock = getAvailableStock(item.item);
    const isOutOfStock = availableStock !== null && availableStock === 0;
    const isPending = item.item.requires_stock_check && !item.item.stock_confirmed;
    
    if (item.hasTierDiscount && !isOutOfStock && !isPending) {
      const itemSavings = (item.originalUnit - item.unitPrice) * item.qty;
      return acc + itemSavings;
    }
    return acc;
  }, 0);

  // Calcular totales para carrito de invitado
  const guestSubtotal = guestCart.reduce((acc, item) => {
    return acc + ((item.metadata?.wholesale_price || 0) * item.quantity);
  }, 0);
  const guestTotalQuantity = guestCart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCloseClick = () => {
    // animate and close
    setAnimateIn(false);
    setTimeout(() => {
      if (window.location.pathname === "/carrito") window.history.back();
      setOpen(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={handleCloseClick} />
      <aside ref={containerRef} className={`relative w-full sm:w-96 md:w-2/5 bg-gradient-to-b from-white to-gray-50 h-screen overflow-y-auto shadow-2xl p-6 transform transition-transform duration-300 ${animateIn ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold title-gradient">🛒 Tu carrito</h2>
          <button 
            className="text-gray-600 hover:text-pink-600 p-2 rounded-lg hover:bg-pink-50 transition-all text-2xl font-bold" 
            onClick={handleCloseClick}
          >
            ✕
          </button>
        </div>

        {infoMessage ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 rounded-lg mb-4">
            <p className="text-green-700 font-medium">{infoMessage}</p>
          </div>
        ) : (
          message && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 rounded-lg mb-4">
              <p className="text-green-700 font-medium">{message}</p>
            </div>
          )
        )}

        {/* Alertas de problemas de stock - SOLO out_of_stock y insufficient_stock, excluyendo items pendientes */}
        {stockIssues.filter(issue => {
          // Excluir limited_stock
          if (issue.issue_type === "limited_stock") return false;
          
          // IMPORTANTE: Solo mostrar issues de productos que estén en el carrito actual
          const cartItem = items.find((i: any) => 
            i.product_id === issue.product_id && i.variant_id === issue.variant_id
          );
          
          // Si el item no está en el carrito, no mostrar el issue
          if (!cartItem) return false;
          
          // Excluir items que son "pendientes de consulta" (requires_stock_check)
          if (cartItem?.requires_stock_check && !cartItem?.stock_confirmed) return false;
          
          return true;
        }).length > 0 && (
          <div className="mb-4 space-y-2">
            {stockIssues.filter(issue => {
              // Excluir limited_stock
              if (issue.issue_type === "limited_stock") return false;
              
              // IMPORTANTE: Solo mostrar issues de productos que estén en el carrito actual
              const cartItem = items.find((i: any) => 
                i.product_id === issue.product_id && i.variant_id === issue.variant_id
              );
              
              // Si el item no está en el carrito, no mostrar el issue
              if (!cartItem) return false;
              
              // Excluir items que son "pendientes de consulta"
              if (cartItem?.requires_stock_check && !cartItem?.stock_confirmed) return false;
              
              return true;
            }).map((issue) => {
              let bgColor = "from-red-50 to-pink-50";
              let borderColor = "border-red-400";
              let icon = "❌";
              let textColor = "text-red-700";

              if (issue.issue_type === "insufficient_stock") {
                bgColor = "from-orange-50 to-amber-50";
                borderColor = "border-orange-400";
                icon = "⚠️";
                textColor = "text-orange-700";
              } else if (issue.issue_type === "limited_stock") {
                bgColor = "from-yellow-50 to-amber-50";
                borderColor = "border-yellow-400";
                icon = "ℹ️";
                textColor = "text-yellow-700";
              }

              return (
                <div
                  key={issue.cart_item_id}
                  className={`bg-gradient-to-r ${bgColor} border-2 ${borderColor} rounded-lg p-3`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1">
                      <div className={`font-bold ${textColor} mb-1`}>
                        {issue.product_name} {issue.variant_name && `(${issue.variant_name})`}
                      </div>
                      <p className="text-sm text-gray-700">
                        {issue.issue_type === "out_of_stock" && (
                          <>Sin stock disponible. Este producto ya no está disponible.</>
                        )}
                        {issue.issue_type === "insufficient_stock" && (
                          <>
                            Solicitaste {issue.requested_qty} unidades pero solo quedan{" "}
                            <strong>{issue.available_stock}</strong>.
                          </>
                        )}
                        {issue.issue_type === "limited_stock" && (
                          <>
                            Stock limitado: quedan {issue.available_stock} unidades.
                          </>
                        )}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {issue.issue_type === "out_of_stock" && (
                          <button
                            onClick={async () => {
                              await removeFromCart(issue.product_id, issue.variant_id);
                              recheckStock();
                            }}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg font-medium transition-colors"
                          >
                            Eliminar del carrito
                          </button>
                        )}
                        {issue.issue_type === "insufficient_stock" && (
                          <>
                            <button
                              onClick={async () => {
                                await updateQuantityVariant(
                                  issue.product_id,
                                  issue.variant_id,
                                  issue.available_stock
                                );
                                recheckStock();
                                refetchSummary();
                              }}
                              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg font-medium transition-colors"
                            >
                              Ajustar a {issue.available_stock} unidades
                            </button>
                            <button
                              onClick={async () => {
                                await removeFromCart(issue.product_id, issue.variant_id);
                                recheckStock();
                              }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-medium transition-colors"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensaje de carrito vacío */}
        {!hasGuestItems && !hasServerItems && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-600 text-lg mb-4">Tu carrito está vacío</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                setAnimateIn(false);
                setTimeout(() => {
                  if (window.location.pathname === "/carrito") window.history.back();
                  setOpen(false);
                  router.push('/productos');
                }, 300);
              }}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-yellow-600 transition-all"
            >
              Ver productos
            </button>
          </div>
        )}

        {/* Banner de invitado */}
        {isGuest && hasGuestItems && (
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-blue-800 font-medium mb-2">
                  Inicia sesión para acceder a mejores precios por volumen y finalizar tu compra.
                </p>
                <button
                  onClick={() => {
                    handleCloseClick();
                    router.push('/login');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Items de carrito de invitado */}
          {isGuest && guestCart.map((guestItem) => {
            const key = guestItem.variant_id ? `${guestItem.product_id}-${guestItem.variant_id}` : String(guestItem.product_id);
            const imgSrc = resolveImageUrl(guestItem.metadata?.image_url ?? null);
            
            console.log('DEBUG CartModal - Item invitado:', {
              guestItem,
              imgSrc,
              metadata: guestItem.metadata
            });
            
            return (
              <div key={key} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-all">
                {imgSrc ? (
                  <img src={imgSrc as string} alt={guestItem.metadata?.product_name || 'Producto'} className="w-20 h-20 object-cover rounded-lg border-2 border-pink-100" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-200">Sin imagen</div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-800">{guestItem.metadata?.product_name || 'Producto'}</div>
                      {(guestItem.metadata?.color || guestItem.metadata?.size) && (
                        <div className="text-sm text-gray-600 mt-1">
                          {guestItem.metadata?.color ? <span className="text-pink-600">🎨 {guestItem.metadata.color}</span> : ''} 
                          {guestItem.metadata?.size ? <span className="text-pink-600"> · 📏 {guestItem.metadata.size}</span> : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-right">
                      <span className="text-base font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                        ${guestItem.metadata?.wholesale_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 rounded-lg font-bold text-pink-600 transition-all"
                        onClick={() => {
                          const next = Math.max(1, guestItem.quantity - 1);
                          updateGuestCartQuantity(guestItem.product_id, guestItem.variant_id, next);
                        }}
                      >
                        -
                      </button>
                      <div className="w-16 text-center py-1.5 border-2 border-pink-200 rounded-lg font-semibold text-gray-800 bg-white">
                        {guestItem.quantity}
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 rounded-lg font-bold text-pink-600 transition-all"
                        onClick={() => {
                          const next = guestItem.quantity + 1;
                          updateGuestCartQuantity(guestItem.product_id, guestItem.variant_id, next);
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-base font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                        ${((guestItem.metadata?.wholesale_price || 0) * guestItem.quantity).toFixed(2)}
                      </div>
                      <button
                        title="Quitar"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        onClick={() => {
                          removeFromGuestCart(guestItem.product_id, guestItem.variant_id);
                        }}
                        aria-label="Quitar del carrito"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Items de carrito del servidor (usuarios logueados) */}
          {!isGuest && itemsWithPricing.map(({ item, qty, originalUnit, unitPrice, lineFinal, hasTierDiscount }: any) => {
            const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : String(item.product_id);
            const imgSrc = resolveImageUrl(item.product_image ?? item.product?.image_url ?? item.product?.image ?? (item.product?.images && item.product.images[0]) ?? null);
            const savings = originalUnit - unitPrice;
            const isPending = item.requires_stock_check && !item.stock_confirmed;
            const availableStock = isPending ? null : getAvailableStock(item);
            // Solo marcar como "agotado" si NO es un item pendiente de consulta
            const isOutOfStock = !isPending && availableStock !== null && availableStock === 0;
            const isLowStock = !isPending && availableStock !== null && availableStock > 0 && availableStock <= 2;
            
            return (
              <div key={item.ID || key} className={`flex items-start gap-3 rounded-xl p-4 shadow-sm border transition-all ${
                isOutOfStock 
                  ? 'bg-gray-50 border-gray-300 opacity-60' 
                  : 'bg-white border-pink-100 hover:shadow-md'
              }`}>
                {imgSrc ? (
                  <img src={imgSrc as string} alt={item.product_name || item.product?.name} className="w-20 h-20 object-cover rounded-lg border-2 border-pink-100" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-200">Sin imagen</div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`font-bold ${isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`}>
                        {item.product_name || item.product?.name}
                        {isOutOfStock && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium border border-red-200">
                            AGOTADO
                          </span>
                        )}
                      </div>
                      {item.variant && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.variant.color ? <span className="text-pink-600">🎨 {item.variant.color}</span> : ''} 
                          {item.variant.size ? <span className="text-pink-600"> · 📏 {item.variant.size}</span> : ''}
                        </div>
                      )}
                      {/* Notificación de stock bajo */}
                      {isLowStock && !isOutOfStock && (
                        <div className="text-xs text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-1 rounded-lg mt-2 inline-block border border-amber-200 font-medium">
                          ⚠️ {availableStock === 1 ? 'Solo queda 1 unidad' : `Solo quedan ${availableStock} unidades`}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-right">
                      {isOutOfStock ? (
                        <span className="text-sm text-gray-500 font-medium">
                          Sin stock
                        </span>
                      ) : hasTierDiscount && savings > 0.01 ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs line-through text-gray-400">${originalUnit.toFixed(2)}</span>
                          <span className="text-base font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                            ${unitPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                          ${unitPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                    {/* show badge if item requires stock and not confirmed */}
                    {item.requires_stock_check && !item.stock_confirmed && (
                      <div className="text-xs text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 rounded-lg mt-2 inline-block border border-orange-200 font-medium">
                        ⏳ Pendiente: verifica stock con vendedora
                      </div>
                    )}

                  {/* Mensaje de producto agotado - SOLO si NO es pendiente */}
                  {isOutOfStock && !item.requires_stock_check && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg mt-3 border border-gray-300">
                      💔 Este producto se agotó. No se incluirá en el total.
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={isOutOfStock}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-all ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 text-pink-600'
                        }`}
                        onClick={async () => {
                          if (isOutOfStock) return;
                          const current = item.quantity ?? 1;
                          const next = Math.max(1, current - 1);
                          await updateQuantityVariant(item.product_id, item.variant_id, next);
                          setTimeout(() => refetchSummary(), 300);
                        }}
                      >
                        -
                      </button>
                      <div className={`w-16 text-center py-1.5 border-2 rounded-lg font-semibold ${
                        isOutOfStock
                          ? 'border-gray-300 text-gray-500 bg-gray-100'
                          : 'border-pink-200 text-gray-800 bg-white'
                      }`}>
                        {item.quantity}
                      </div>
                      <button
                        disabled={isOutOfStock}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-all ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 text-pink-600'
                        }`}
                        onClick={async () => {
                          if (isOutOfStock) return;
                          const current = item.quantity ?? 1;
                          const next = current + 1;
                          await updateQuantityVariant(item.product_id, item.variant_id, next);
                          setTimeout(() => refetchSummary(), 300);
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-base font-bold ${
                        isOutOfStock
                          ? 'text-gray-400 line-through'
                          : 'bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent'
                      }`}>
                        ${lineFinal.toFixed(2)}
                      </div>
                      <button
                        title="Quitar"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Usar SIEMPRE product_id y variant_id
                          const productId = item.product_id;
                          const variantId = item.variant_id;
                          if (!productId || !variantId) {
                            setInfoMessage('Error: faltan datos para eliminar el producto.');
                            console.error('ERROR: Faltan product_id o variant_id', item);
                            return;
                          }
                          try {
                            await removeFromCart(productId, variantId);
                            await fetchCart();
                            await recheckStock();
                            await refetchSummary();
                            setRefreshKey(prev => prev + 1);
                          } catch (err) {
                            setInfoMessage('No se pudo eliminar el producto del carrito.');
                            console.error('Error al eliminar del carrito:', err);
                          }
                        }}
                        aria-label="Quitar del carrito"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t-2 border-pink-200 pt-6">
          <div className="mb-4 flex justify-center">
            {/* 'Seguir viendo' encima del CTA. Animate close then navigate to /productos */}
            <button
              aria-label="Seguir viendo productos"
              className="inline-flex items-center justify-center bg-white border-2 border-pink-200 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-all gap-2 font-medium shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                setAnimateIn(false);
                setTimeout(() => {
                  if (window.location.pathname === "/carrito") window.history.back();
                  setOpen(false);
                  router.push('/productos');
                }, 300);
              }}
            >
              {/* eye icon (subtle) */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Seguir viendo productos</span>
            </button>
          </div>

          {/* Tier actual y progreso hacia el siguiente */}
          {!isGuest && summary?.tier && (
            <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Nivel de precio aplicado:</div>
                    <div className="text-base font-bold text-green-700">{summary.tier.display_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Cantidad total:</div>
                  <div className="text-lg font-bold text-green-700">{confirmedQuantity} {confirmedQuantity === 1 ? 'prenda' : 'prendas'}</div>
                </div>
              </div>
              
              {summary.next_tier && summary.next_tier.display_name !== summary.tier.display_name && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-gray-600">
                      Próximo nivel: <span className="font-semibold text-gray-800">{summary.next_tier.display_name}</span>
                    </span>
                    <span className="text-gray-600">
                      Faltan <span className="font-bold text-orange-600">{Math.max(0, summary.next_tier.min_quantity - confirmedQuantity)}</span> {Math.max(0, summary.next_tier.min_quantity - confirmedQuantity) === 1 ? 'prenda' : 'prendas'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (confirmedQuantity / summary.next_tier.min_quantity) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totales */}
          {isGuest ? (
            // Totales para invitados
            <div className="bg-gradient-to-r from-yellow-50 to-pink-50 rounded-xl p-4 mb-4 border border-pink-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div className="font-medium">Cantidad total</div>
                  <div className="font-semibold">{guestTotalQuantity} prendas</div>
                </div>
                <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-pink-200">
                  <div>Total estimado</div>
                  <div className="bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                    ${guestSubtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Totales para usuarios logueados
            <div className="bg-gradient-to-r from-yellow-50 to-pink-50 rounded-xl p-4 mb-4 border border-pink-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div className="font-medium">Subtotal</div>
                  <div className="font-semibold">
                    {totalSavings > 0.01 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs line-through text-gray-400">${(subtotal + totalSavings).toFixed(2)}</span>
                        <span className="text-base">${subtotal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>${subtotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                {totalSavings > 0.01 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <div className="font-medium">Descuento por tier</div>
                    <div className="font-semibold">-${totalSavings.toFixed(2)}</div>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm text-red-600">
                    <div className="font-medium">Otros descuentos</div>
                    <div className="font-semibold">-${totalDiscount.toFixed(2)}</div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-pink-200">
                  <div>Total</div>
                  <div className="bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </div>
                </div>
                {totalSavings > 0.01 && (
                  <div className="flex items-center justify-center pt-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md">
                      🎉 ¡Ahorrás ${totalSavings.toFixed(2)} con este tier!
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isGuest && (
            <>
              <div className="text-sm text-gray-600 mb-3 bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span>✓ Prendas confirmadas:</span>
                  <span className="font-bold text-green-600">{confirmedQuantity}</span>
                </div>
                {pendingQuantity > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <span>⏳ Prendas pendientes:</span>
                    <span className="font-bold text-orange-600">{pendingQuantity}</span>
                  </div>
                )}
              </div>
              
              {pendingQuantity > 0 && (
                <div className="text-xs text-gray-600 mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <strong>Nota:</strong> {pendingQuantity} prenda(s) están pendientes de verificación por la vendedora y no se incluyen en el total mostrado.
                </div>
              )}
            </>
          )}
          
          {/* Mensaje si no alcanza el mínimo para compra mayorista */}
          {!isGuest && confirmedQuantity < MIN_WHOLESALE_QUANTITY && (
            <div className="text-sm text-gray-700 mb-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-xl">ℹ️</span>
                <div>
                  <div className="font-bold text-blue-800 mb-1">Compra mayorista</div>
                  <p className="text-sm">
                    Necesitás al menos <strong>{MIN_WHOLESALE_QUANTITY} prendas</strong> para realizar una compra mayorista. 
                    {confirmedQuantity > 0 && (
                      <> Actualmente tenés <strong>{confirmedQuantity}</strong>, te {confirmedQuantity === 1 ? 'falta' : 'faltan'} <strong className="text-blue-700">{MIN_WHOLESALE_QUANTITY - confirmedQuantity}</strong> más.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {!isGuest && cart?.items && cart.items.length > 0 && (
              <button
                onClick={async () => {
                  if (!cart) return;
                  const cartId = (cart as any)?.id ?? (cart as any)?.ID;
                  if (!cartId) return;
                  
                  // Check if user has address before requesting seller
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                    
                    if (userStr && token) {
                      const user = JSON.parse(userStr);
                      const addressRes = await fetch(`${API_BASE}/addresses/user/${user.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      
                      if (addressRes.ok) {
                        const addresses = await addressRes.json();
                        if (!addresses || addresses.length === 0) {
                          // No address found - show modal and STOP
                          setShowAddAddressModal(true);
                          setInfoMessage('⚠️ Necesitás agregar una dirección de envío antes de solicitar vendedora');
                          if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
                          messageTimerRef.current = window.setTimeout(() => setInfoMessage(null), 5000);
                          return;
                        }
                      } else {
                        // Error al verificar direcciones
                        setInfoMessage('⚠️ Error al verificar direcciones. Por favor, agregá una dirección de envío.');
                        if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
                        messageTimerRef.current = window.setTimeout(() => setInfoMessage(null), 5000);
                        setShowAddAddressModal(true);
                        return;
                      }
                    }
                    
                    setRequestingSeller(true);
                    const res = await fetch(`${API_BASE}/checkout/${cartId}/request-assignment`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => null);
                      const msg = err?.error || 'No se pudo solicitar vendedora';
                      setInfoMessage(msg);
                      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
                      messageTimerRef.current = window.setTimeout(() => setInfoMessage(null), 6000);
                    } else {
                      const data = await res.json();
                      setSellerName(data.seller_name || 'una vendedora');
                      // No llamar clearCart() para evitar notificaciones de tier_lost
                      // El backend ya convirtió el carrito en orden, solo refrescamos el estado
                      await fetchCart();
                      // Mostrar modal de confirmación
                      setShowSellerRequestedModal(true);
                    }
                  } catch (e) {
                    alert('Error en la solicitud');
                  } finally {
                    setRequestingSeller(false);
                  }
                }}
                className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  confirmedQuantity >= MIN_WHOLESALE_QUANTITY
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={requestingSeller || confirmedQuantity < MIN_WHOLESALE_QUANTITY}
              >
                {requestingSeller ? '⏳ Solicitando...' : '💬 Solicitar vendedora'}
              </button>
            )}
            {confirmedQuantity < MIN_WHOLESALE_QUANTITY && (
              <div className="mt-3 px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-center text-amber-800 font-semibold">
                  ⚠️ Necesitás al menos {MIN_WHOLESALE_QUANTITY - confirmedQuantity} prenda{MIN_WHOLESALE_QUANTITY - confirmedQuantity !== 1 ? 's' : ''} más para solicitar vendedora
                </p>
                <p className="text-center text-amber-700 text-sm mt-1">
                  (Mínimo requerido: {MIN_WHOLESALE_QUANTITY} prendas)
                </p>
              </div>
            )}
            
            <button 
              onClick={() => {
                if (isGuest) {
                  clearGuestCart();
                } else {
                  clearCart();
                }
              }} 
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-all text-gray-700"
            >
              🗑️ Vaciar carrito
            </button>
          </div>
        </div>
      </aside>

      {/* Modal: Falta dirección de envío */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Dirección de envío requerida
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Necesitás agregar una dirección de envío antes de solicitar vendedora para poder coordinar la entrega de tu pedido.
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6 border border-amber-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>✨</span> ¿Por qué necesitamos tu dirección?
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span>Para coordinar la entrega de tu pedido</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span>Para que la vendedora conozca tu ubicación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span>Para calcular costos de envío si corresponde</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddAddressModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowAddAddressModal(false);
                  router.push('/perfil/direcciones');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Agregar dirección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación: Vendedora asignada */}
      {showSellerRequestedModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Solicitud enviada!
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tu pedido fue asignado a <strong>{sellerName}</strong> quien se contactará contigo pronto para coordinar el pago y la entrega.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>📋</span> ¿Qué sigue?
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">1.</span>
                  <span>La vendedora verificará el stock disponible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">2.</span>
                  <span>Te contactará para coordinar pago y entrega</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">3.</span>
                  <span>Podés ver el estado en <strong>&quot;Mis pedidos&quot;</strong></span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSellerRequestedModal(false);
                  setAnimateIn(false);
                  setTimeout(() => {
                    if (window.location.pathname === "/carrito") window.history.back();
                    setOpen(false);
                  }, 300);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowSellerRequestedModal(false);
                  router.push('/perfil/pedidos');
                  setAnimateIn(false);
                  setTimeout(() => {
                    if (window.location.pathname === "/carrito") window.history.back();
                    setOpen(false);
                  }, 300);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Ver mi pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
