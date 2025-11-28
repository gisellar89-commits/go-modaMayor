"use client";

import { useEffect, useState } from "react";
import useCartSummary from "./useCartSummary";

export default function useCartTierNotifications() {
  const { summary } = useCartSummary();
  const [lastTierId, setLastTierId] = useState<number | null>(null);
  const [lastQuantity, setLastQuantity] = useState<number>(0);

  useEffect(() => {
    console.log('🔔 Tier Notifications - useEffect ejecutado', {
      hasSummary: !!summary,
      currentTotalQty: summary?.total_quantity,
      currentTierId: summary?.tier?.id,
      lastTierId,
      lastQuantity,
      nextTier: summary?.next_tier,
      quantityToUnlock: summary?.next_tier?.quantity_to_unlock,
    });

    if (!summary) return;

    const currentTotalQty = summary.total_quantity || 0;
    const currentTierId = summary.tier?.id || null;

    // Detectar tier desbloqueado
    if (currentTierId && lastTierId && currentTierId !== lastTierId) {
      console.log('🎉 TIER DESBLOQUEADO!', {
        tierName: summary.tier?.display_name,
        currentTierId,
        lastTierId,
      });
      
      const tierName = summary.tier?.display_name || "Nuevo nivel";
      const savings = summary.tier?.discount_percentage ? `${summary.tier.discount_percentage}%` : "";
      
      if (typeof window !== "undefined" && (window as any).showPriceNotification) {
        (window as any).showPriceNotification({
          type: "tier_unlocked",
          message: `¡Alcanzaste el nivel "${tierName}"! ${savings ? `Ahora tenés ${savings} de descuento.` : ""}`,
          tierName: tierName,
        });
      }
    }

    // Detectar cuando estás cerca de un nuevo tier (falta 1 prenda)
    if (summary.next_tier && summary.next_tier.quantity_to_unlock === 1) {
      console.log('⚡ CERCA DE TIER!', {
        nextTierName: summary.next_tier.display_name,
        quantityToUnlock: summary.next_tier.quantity_to_unlock,
        currentTotalQty,
        lastQuantity,
        quantityChanged: lastQuantity !== currentTotalQty,
      });
      
      // Solo mostrar si la cantidad cambió (evita mostrar la notificación cada vez que se re-renderiza)
      if (lastQuantity !== currentTotalQty && lastQuantity > 0) {
        console.log('⚡ MOSTRANDO NOTIFICACIÓN DE CERCA DE TIER');
        if (typeof window !== "undefined" && (window as any).showPriceNotification) {
          (window as any).showPriceNotification({
            type: "near_tier",
            message: `¡Agregá 1 prenda más para desbloquear "${summary.next_tier.display_name}"!`,
            itemsNeeded: 1,
            tierName: summary.next_tier.display_name,
          });
        }
      }
    }

    setLastTierId(currentTierId);
    setLastQuantity(currentTotalQty);
  }, [summary?.tier?.id, summary?.total_quantity, summary?.next_tier?.quantity_to_unlock]);
}
