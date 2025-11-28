"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import useFocusTrap from "../hooks/useFocusTrap";
import useCart from "../hooks/useCart";
import useCartSummary from "../hooks/useCartSummary";
import useCartStockCheck from "../hooks/useCartStockCheck";
import { resolveImageUrl, API_BASE } from "../utils/api";

export default function CartModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const router = useRouter();
  const { cart, message, removeFromCart, updateQuantityVariant, clearCart, fetchCart } = useCart();
  const { summary, refetch: refetchSummary } = useCartSummary(true); // Habilitar notificaciones aquí
  const { stockIssues, allAvailable, recheckStock } = useCartStockCheck();
  const [requestingSeller, setRequestingSeller] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar re-renders
  const messageTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  useFocusTrap(containerRef, open);

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
  
  // Usar los precios del summary si están disponibles, sino usar cálculo original
  const useDynamicPricing = summaryItems.length > 0;
  
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
            // Si no hay tier anterior, usar precio base (costo * 2)
            previousTierPrice = costPrice * 2;
            hasTierDiscount = Math.abs(previousTierPrice - unitPrice) > 0.01;
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
  
  // Calcular cantidades totales
  const confirmedQuantity = visibleForPricing.reduce((acc, { qty }) => acc + qty, 0);
  const pendingQuantity = pendingItems.reduce((acc, { qty }) => acc + qty, 0);
  
  // Calcular totales
  const subtotal = visibleForPricing.reduce((acc, { lineFinal }) => acc + lineFinal, 0);
  const total = summary?.subtotal && summary.subtotal > 0 ? summary.subtotal : subtotal;
  
  // Calcular ahorro total por tier (comparando con precios del tier anterior)
  const totalSavings = itemsWithPricing.reduce((acc: number, item: any) => {
    if (item.hasTierDiscount && !(item.item.requires_stock_check && !item.item.stock_confirmed)) {
      const itemSavings = (item.originalUnit - item.unitPrice) * item.qty;
      return acc + itemSavings;
    }
    return acc;
  }, 0);

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

        {/* Alertas de problemas de stock */}
        {stockIssues.length > 0 && (
          <div className="mb-4 space-y-2">
            {stockIssues.map((issue) => {
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

        <div className="space-y-4">
          {itemsWithPricing.map(({ item, qty, originalUnit, unitPrice, lineFinal, hasTierDiscount }: any) => {
            const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : String(item.product_id);
            const imgSrc = resolveImageUrl(item.product_image ?? item.product?.image_url ?? item.product?.image ?? (item.product?.images && item.product.images[0]) ?? null);
            const savings = originalUnit - unitPrice;
            return (
              <div key={item.ID || key} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-all">
                {imgSrc ? (
                  <img src={imgSrc as string} alt={item.product_name || item.product?.name} className="w-20 h-20 object-cover rounded-lg border-2 border-pink-100" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-200">Sin imagen</div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-800">{item.product_name || item.product?.name}</div>
                      {item.variant && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.variant.color ? <span className="text-pink-600">🎨 {item.variant.color}</span> : ''} 
                          {item.variant.size ? <span className="text-pink-600"> · 📏 {item.variant.size}</span> : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-right">
                      {hasTierDiscount && savings > 0.01 ? (
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

                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 rounded-lg font-bold text-pink-600 transition-all"
                        onClick={async () => {
                          const current = item.quantity ?? 1;
                          const next = Math.max(1, current - 1);
                          await updateQuantityVariant(item.product_id, item.variant_id, next);
                          setTimeout(() => refetchSummary(), 300);
                        }}
                      >
                        -
                      </button>
                      <div className="w-16 text-center py-1.5 border-2 border-pink-200 rounded-lg font-semibold text-gray-800 bg-white">
                        {item.quantity}
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-pink-100 to-yellow-100 hover:from-pink-200 hover:to-yellow-200 rounded-lg font-bold text-pink-600 transition-all"
                        onClick={async () => {
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
                      <div className="text-base font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                        ${lineFinal.toFixed(2)}
                      </div>
                      <button
                        title="Quitar"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const productId = item.product_id || item.ProductID;
                          const variantId = item.variant_id || item.VariantID;
                          
                          if (!productId || !variantId) {
                            console.error('ERROR: Faltan product_id o variant_id');
                            return;
                          }
                          
                          try {
                            await removeFromCart(productId, variantId);
                            await fetchCart();
                            await recheckStock();
                            await refetchSummary();
                            setRefreshKey(prev => prev + 1);
                          } catch (err) {
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
          {summary?.tier && (
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
                  <div className="text-lg font-bold text-green-700">{summary.total_quantity} prendas</div>
                </div>
              </div>
              
              {summary.next_tier && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-gray-600">
                      Próximo nivel: <span className="font-semibold text-gray-800">{summary.next_tier.display_name}</span>
                    </span>
                    <span className="text-gray-600">
                      Faltan <span className="font-bold text-orange-600">{summary.next_tier.quantity_to_unlock}</span> prendas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (summary.total_quantity / summary.next_tier.min_quantity) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              <strong>Nota:</strong> {pendingQuantity} prenda(s) están pendientes de verificación por la vendedora y no se incluyen en el total mostado.
            </div>
          )}
          
          {/* Mensaje si no alcanza el mínimo para compra mayorista */}
          {confirmedQuantity < 6 && (
            <div className="text-sm text-gray-700 mb-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-xl">ℹ️</span>
                <div>
                  <div className="font-bold text-blue-800 mb-1">Compra mayorista</div>
                  <p className="text-sm">
                    Necesitás al menos <strong>6 prendas</strong> para realizar una compra mayorista. 
                    {confirmedQuantity > 0 && (
                      <> Actualmente tenés <strong>{confirmedQuantity}</strong>, te {confirmedQuantity === 1 ? 'falta' : 'faltan'} <strong className="text-blue-700">{6 - confirmedQuantity}</strong> más.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {cart?.items && cart.items.length > 0 && (
              <button
                onClick={async () => {
                  if (!cart) return;
                  const cartId = (cart as any)?.id ?? (cart as any)?.ID;
                  if (!cartId) return;
                  try {
                    setRequestingSeller(true);
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
                      const successMsg = data.message || 'Solicitud enviada. Te contactarán pronto.';
                      setInfoMessage(successMsg);
                      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
                      messageTimerRef.current = window.setTimeout(() => setInfoMessage(null), 6000);
                      try {
                        await clearCart();
                      } catch (e) {
                        await fetchCart();
                      }
                      setAnimateIn(false);
                      setTimeout(() => {
                        if (window.location.pathname === "/carrito") window.history.back();
                        setOpen(false);
                      }, 300);
                    }
                  } catch (e) {
                    alert('Error en la solicitud');
                  } finally {
                    setRequestingSeller(false);
                  }
                }}
                className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  confirmedQuantity >= 6
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={requestingSeller || confirmedQuantity < 6}
              >
                {requestingSeller ? '⏳ Solicitando...' : confirmedQuantity >= 6 ? '💬 Solicitar vendedora' : '🔒 Mínimo 6 prendas'}
              </button>
            )}
            
            <button 
              onClick={() => clearCart()} 
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-all text-gray-700"
            >
              🗑️ Vaciar carrito
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
