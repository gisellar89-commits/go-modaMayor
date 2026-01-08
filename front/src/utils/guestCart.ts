// Utilidades para manejar el carrito de usuarios no autenticados (invitados)
// El carrito se almacena en localStorage hasta que el usuario inicie sesión

const GUEST_CART_KEY = 'guest_cart';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface GuestCartItem {
  product_id: number;
  variant_id: number;
  quantity: number;
  metadata?: {
    product_name?: string;
    variant_name?: string;
    image_url?: string;
    wholesale_price?: number;
    color?: string;
    size?: string;
  };
}

export interface GuestPriceResponse {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tier: {
    id: number;
    name: string;
    display_name: string;
    formula_type: string;
    multiplier?: number;
    percentage?: number;
    flat_amount?: number;
    min_quantity: number;
  };
  message: string;
  requires_login_for_better_prices: boolean;
}

// Obtener carrito de invitado desde localStorage
export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error parsing guest cart:', error);
    return [];
  }
}

// Guardar carrito de invitado en localStorage
export function setGuestCart(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    // Disparar evento para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('guest-cart-updated', { detail: items }));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
}

// Agregar item al carrito de invitado
export function addToGuestCart(item: GuestCartItem): void {
  const cart = getGuestCart();
  
  // Buscar si el item ya existe (mismo producto y variante)
  const existingIndex = cart.findIndex(
    i => i.product_id === item.product_id && i.variant_id === item.variant_id
  );
  
  if (existingIndex >= 0) {
    // Actualizar cantidad y metadata
    cart[existingIndex].quantity += item.quantity;
    // Actualizar metadata si viene nueva información
    if (item.metadata) {
      cart[existingIndex].metadata = { ...cart[existingIndex].metadata, ...item.metadata };
    }
  } else {
    // Agregar nuevo item
    cart.push(item);
  }
  
  setGuestCart(cart);
}

// Remover item del carrito de invitado
export function removeFromGuestCart(productId: number, variantId: number): void {
  const cart = getGuestCart();
  const filtered = cart.filter(
    i => !(i.product_id === productId && i.variant_id === variantId)
  );
  setGuestCart(filtered);
}

// Actualizar cantidad en carrito de invitado
export function updateGuestCartQuantity(
  productId: number,
  variantId: number,
  quantity: number
): void {
  const cart = getGuestCart();
  const item = cart.find(
    i => i.product_id === productId && i.variant_id === variantId
  );
  
  if (item) {
    if (quantity <= 0) {
      removeFromGuestCart(productId, variantId);
    } else {
      item.quantity = quantity;
      setGuestCart(cart);
    }
  }
}

// Limpiar carrito de invitado
export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
  window.dispatchEvent(new CustomEvent('guest-cart-updated', { detail: [] }));
}

// Obtener cantidad total de items en carrito de invitado
export function getGuestCartItemCount(): number {
  const cart = getGuestCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Calcular precio para invitado usando el endpoint público
export async function calculateGuestPrice(
  productId: number,
  quantity: number
): Promise<GuestPriceResponse> {
  const response = await fetch(`${API_URL}/cart/guest-price`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      quantity,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Error al calcular precio');
  }
  
  return response.json();
}

// Resultado de la migración del carrito
export interface MigrationResult {
  totalItems: number;
  successCount: number;
  errorCount: number;
  itemsAdded: string[];
  errors: string[];
}

// Migrar carrito de invitado al servidor cuando el usuario inicie sesión
export async function migrateGuestCartToServer(token: string): Promise<MigrationResult> {
  const guestCart = getGuestCart();
  
  if (guestCart.length === 0) {
    return {
      totalItems: 0,
      successCount: 0,
      errorCount: 0,
      itemsAdded: [],
      errors: []
    };
  }
  
  console.log('🔄 Migrando carrito de invitado al servidor:', guestCart);
  
  const errors: string[] = [];
  const itemsAdded: string[] = [];
  
  for (const item of guestCart) {
    try {
      const itemName = item.metadata?.product_name || 'Producto';
      const variantName = item.metadata?.variant_name || '';
      const displayName = variantName ? `${itemName} (${variantName})` : itemName;
      
      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Error del servidor:', errorData);
        errors.push(`${displayName}: ${errorData?.error || 'Error desconocido'}`);
      } else {
        console.log('✅ Item agregado exitosamente:', displayName);
        itemsAdded.push(displayName);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      const itemName = item.metadata?.product_name || 'Producto';
      errors.push(`${itemName}: Error de conexión`);
    }
  }
  
  const result: MigrationResult = {
    totalItems: guestCart.length,
    successCount: itemsAdded.length,
    errorCount: errors.length,
    itemsAdded,
    errors
  };
  
  console.log('📊 Resumen de migración:', result);
  
  // Limpiar carrito de invitado
  clearGuestCart();
  
  return result;
}
