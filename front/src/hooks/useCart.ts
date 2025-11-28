import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

// Helper para manejar errores de autenticación
function handleAuthError(status: number, errorData: any) {
  if (status === 401) {
    // Token expirado o inválido
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      
      // Solo redirigir si NO estamos ya en login o register
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return "Tu sesión ha expirado. Redirigiendo al login...";
      }
    }
    return "Sesión expirada. Por favor, inicia sesión nuevamente.";
  }
  return errorData?.error || "Error en la operación";
}

export default function useCart() {
  // Actualizar cantidad de producto en el carrito
  const updateQuantity = async (productId: number, quantity: number) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/cart/update/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(handleAuthError(res.status, errorData));
      }
      
      setMessage("Cantidad actualizada");
      await fetchCart();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Update quantity for specific variant
  const updateQuantityVariant = async (productId: number, variantId: number | undefined, quantity: number) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = new URL(`${API_URL}/cart/update/${productId}`);
      if (variantId !== undefined && variantId !== null) url.searchParams.set('variant_id', String(variantId));
      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(handleAuthError(res.status, errorData));
      }
      
      setMessage("Cantidad actualizada");
      await fetchCart();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };
  type CartItem = { product_id: number; variant_id?: number; quantity: number; requires_stock_check?: boolean; stock_confirmed?: boolean };
  type Cart = { items?: CartItem[]; total?: number };

  // Shared global cart store so multiple hook instances stay in sync
  // This allows components like product page and CartModal to reflect the same cart state
  // even when they use their own hook instance.
  // NOTE: kept simple (in-memory). If you need persistence across tabs consider localStorage or broadcast channel.
  // Module-level store (attached to window). Use any-cast to avoid TypeScript global augmentation here.
  if (typeof window !== 'undefined' && !(window as any).__cartListeners) {
    (window as any).__globalCart = null;
    (window as any).__cartListeners = new Set();
  }

  const [cart, setCartState] = useState<Cart | null>(typeof window !== 'undefined' ? (window as any).__globalCart ?? null : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Obtener el carrito
  const fetchCart = useCallback(async () => {
    // Si no hay token, no intentar hacer fetch (evita loop infinito en login)
    const token = getToken();
    if (!token) {
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(handleAuthError(res.status, errorData));
      }
      
      const data = await res.json();
  // update module/global store and notify listeners
  if (typeof window !== 'undefined') {
    (window as any).__globalCart = data;
    (window as any).__cartListeners?.forEach((fn: any) => {
      try { fn(data); } catch (e) {}
    });
  }
  setCartState(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err) || "Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to global store changes so multiple instances remain in sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const listener = (c: Cart | null) => setCartState(c);
    (window as any).__cartListeners?.add(listener);
    return () => { (window as any).__cartListeners?.delete(listener); };
  }, []);

  // Eliminar producto del carrito
    const removeFromCart = async (productId: number, variantId?: number) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = new URL(`${API_URL}/cart/remove/${productId}`);
      if (variantId !== undefined && variantId !== null) url.searchParams.set('variant_id', String(variantId));
      
      const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(handleAuthError(res.status, errorData));
      }
      
      setMessage("Producto eliminado del carrito");
      await fetchCart();
    } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido");
        }
    } finally {
      setLoading(false);
    }
  };

  // Vaciar el carrito
  const clearCart = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(handleAuthError(res.status, errorData));
      }
      
      setMessage("Carrito vaciado");
      await fetchCart();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  // Exposed setCart updates the global store and notifies all listeners
  const setCart = (c: Cart | null) => {
    // debug log
    // eslint-disable-next-line no-console
    console.log('useCart.setCart called', c);
    if (typeof window !== 'undefined') {
      (window as any).__globalCart = c;
      (window as any).__cartListeners?.forEach((fn: any) => {
        try { fn(c); } catch (e) {}
      });
    }
    setCartState(c);
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
  cart,
  loading,
  error,
  message,
  fetchCart,
  removeFromCart,
  clearCart,
  updateQuantity,
  updateQuantityVariant,
  // allow callers to set cart state directly when they have the updated cart
  setCart,
  };
}
