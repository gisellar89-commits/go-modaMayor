import { useEffect, useState, useRef } from "react";
import { API_BASE } from "../utils/api";

interface PriceTier {
  id: number;
  name: string;
  display_name: string;
  formula_type: string;
  multiplier: number;
  percentage: number;
  flat_amount: number;
  min_quantity: number;
  order_index: number;
  active: boolean;
  is_default: boolean;
  show_in_public: boolean;
  color_code: string;
}

interface NextTier {
  display_name: string;
  min_quantity: number;
  quantity_to_unlock: number;
}

interface CartItemSummary {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_name: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  subtotal: number;
  image_url: string;
}

interface CartSummary {
  cart_id: number;
  total_quantity: number;
  subtotal: number;
  items: CartItemSummary[];
  tier: PriceTier | null;
  next_tier: NextTier | null;
  all_tiers: PriceTier[];
}

export default function useCartSummary(enableNotifications = false) {
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousSummaryRef = useRef<CartSummary | null>(null);
  const lastNotificationRef = useRef<{ type: string; tierId: number | null; timestamp: number } | null>(null);

  console.log('🔔 useCartSummary mounted with enableNotifications:', enableNotifications);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/cart/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setSummary(null);
          setLoading(false);
          return;
        }
        throw new Error("Error al cargar el resumen del carrito");
      }

      const data = await res.json();
      
      console.log('🔔 useCartSummary - Data recibida:', {
        total_quantity: data.total_quantity,
        tier: data.tier,
        next_tier: data.next_tier,
        all_tiers: data.all_tiers,
      });
      
      // Detectar cambios en el tier y mostrar notificaciones (solo si está habilitado)
      if (enableNotifications && previousSummaryRef.current && typeof window !== "undefined") {
        console.log('🔔 useCartSummary - Notificaciones HABILITADAS, comparando con previous:', {
          prevQuantity: previousSummaryRef.current.total_quantity,
          currentQuantity: data.total_quantity,
          prevTier: previousSummaryRef.current.tier?.display_name,
          currentTier: data.tier?.display_name,
        });
        const prevTier = previousSummaryRef.current.tier;
        const currentTier = data.tier;
        const prevQuantity = previousSummaryRef.current.total_quantity;
        const currentQuantity = data.total_quantity;

        // @ts-expect-error - global helper
        const showNotification = window.showPriceNotification;

        if (showNotification) {
          const now = Date.now();
          const lastNotif = lastNotificationRef.current;
          
          // Helper para verificar si debemos mostrar la notificación
          const shouldShowNotification = (type: string, tierId: number | null) => {
            // Si no hay notificación previa, mostrar
            if (!lastNotif) return true;
            
            // Si es un tipo diferente, mostrar
            if (lastNotif.type !== type) return true;
            
            // Si es el mismo tipo pero para un tier diferente, mostrar
            if (lastNotif.tierId !== tierId) return true;
            
            // Si pasaron más de 3 segundos desde la última notificación del mismo tipo y tier, mostrar
            if (now - lastNotif.timestamp > 3000) return true;
            
            return false;
          };
          
          // Caso 1: Se desbloqueó un nuevo tier (mejoró)
          if (currentTier && prevTier && currentTier.id !== prevTier.id && 
              currentTier.min_quantity > prevTier.min_quantity) {
            
            if (shouldShowNotification("tier_unlocked", currentTier.id)) {
              // Calcular ahorro aproximado
              const prevSubtotal = previousSummaryRef.current.subtotal;
              const currentSubtotal = data.subtotal;
              const savings = prevSubtotal - currentSubtotal;

              showNotification({
                type: "tier_unlocked",
                message: `¡Ahora tienes ${currentTier.display_name}! Todos tus productos tienen mejor precio.`,
                savings: savings > 0 ? savings : undefined,
                tierName: currentTier.display_name,
              });
              
              lastNotificationRef.current = { type: "tier_unlocked", tierId: currentTier.id, timestamp: now };
            }
          }
          // Caso 2: Se perdió un tier (empeoró)
          else if (currentTier && prevTier && currentTier.id !== prevTier.id && 
                   currentTier.min_quantity < prevTier.min_quantity) {
            
            if (shouldShowNotification("tier_lost", currentTier.id)) {
              showNotification({
                type: "tier_lost",
                message: `Has vuelto a ${currentTier.display_name}. Los precios han cambiado.`,
                tierName: currentTier.display_name,
              });
              
              lastNotificationRef.current = { type: "tier_lost", tierId: currentTier.id, timestamp: now };
            }
          }
          // Caso 3: Está cerca del siguiente tier (falta 1 prenda)
          else if (data.next_tier && data.next_tier.quantity_to_unlock === 1) {
            // Solo mostrar si la cantidad cambió (se agregó algo)
            const quantityIncreased = currentQuantity > prevQuantity;
            
            if (quantityIncreased && shouldShowNotification("near_tier", currentTier?.id || null)) {
              showNotification({
                type: "near_tier",
                message: `¡Agregando 1 prenda más obtendrás ${data.next_tier.display_name}!`,
                itemsNeeded: 1,
                tierName: data.next_tier.display_name,
              });
              
              lastNotificationRef.current = { type: "near_tier", tierId: currentTier?.id || null, timestamp: now };
            }
          }
          // Caso 4: Acaba de quedar a 1 prenda de perder el tier actual
          else if (currentTier && prevTier && currentTier.id === prevTier.id && 
                   currentQuantity === currentTier.min_quantity && 
                   currentQuantity < prevQuantity) {
            
            if (shouldShowNotification("near_tier_loss", currentTier.id)) {
              showNotification({
                type: "near_tier",
                message: `¡Cuidado! Si quitas una prenda más, perderás el ${currentTier.display_name}.`,
                tierName: currentTier.display_name,
              });
              
              lastNotificationRef.current = { type: "near_tier_loss", tierId: currentTier.id, timestamp: now };
            }
          }
        }
      } else {
        // Log para debugging: por qué no se muestran notificaciones
        if (!enableNotifications) {
          console.log('🔔 useCartSummary - Notificaciones DESHABILITADAS en esta instancia');
        } else if (!previousSummaryRef.current) {
          console.log('🔔 useCartSummary - Primera carga, no hay previous para comparar');
        }
      }

      previousSummaryRef.current = data;
      setSummary(data);
    } catch (err) {
      console.error("Error al obtener resumen del carrito:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    
    // Exponer función global para refrescar desde cualquier lugar
    if (typeof window !== "undefined") {
      // @ts-expect-error - global helper
      window.refreshCartSummary = fetchSummary;
    }
    
    return () => {
      if (typeof window !== "undefined") {
        // @ts-expect-error - cleanup global helper
        delete window.refreshCartSummary;
      }
    };
  }, []);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
