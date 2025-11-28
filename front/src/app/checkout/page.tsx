"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, resolveImageUrl } from "../../utils/api";
import useCartSummary from "../../hooks/useCartSummary";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { summary } = useCartSummary();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al cargar el carrito');

      const data = await res.json();
      setCart(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const cartId = cart?.id || cart?.ID;

      const res = await fetch(`${API_BASE}/checkout/${cartId}/complete`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Error al confirmar la orden');
      }

      // Redirigir a página de confirmación o pedidos
      alert('¡Orden confirmada exitosamente!');
      router.push('/profile');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando checkout...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-red-600 text-xl">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 btn-primary"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];
  const summaryItems = summary?.items || [];
  const total = summary?.subtotal || 0;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Ir a comprar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/')}
            className="text-pink-600 hover:text-pink-700 flex items-center gap-2 mb-4"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-yellow-600 bg-clip-text text-transparent">
            Finalizar Compra
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen de tu orden</h2>
          
          <div className="space-y-4 mb-6">
            {items.map((item: any) => {
              const summaryItem = summaryItems.find((si: any) => si.cart_item_id === item.ID);
              const unitPrice = summaryItem?.unit_price || item.product?.wholesale_price || 0;
              const qty = item.quantity || 0;
              const imgSrc = resolveImageUrl(
                item.product?.image_url || 
                item.product?.image || 
                (item.product?.images && item.product.images[0])
              );

              return (
                <div key={item.ID} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {imgSrc ? (
                    <img 
                      src={imgSrc as string} 
                      alt={item.product?.name} 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">Sin imagen</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.product?.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-600">
                        {item.variant.color && `🎨 ${item.variant.color}`}
                        {item.variant.size && ` · 📏 ${item.variant.size}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">Cantidad: {qty}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">${unitPrice.toFixed(2)} c/u</p>
                    <p className="font-bold text-lg text-pink-600">
                      ${(unitPrice * qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {summary?.tier && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-green-700">
                ✨ Tier aplicado: {summary.tier.display_name}
              </p>
              {summary.next_tier && (
                <p className="text-xs text-green-600 mt-1">
                  Agrega {summary.next_tier.quantity_to_unlock} producto(s) más para desbloquear: {summary.next_tier.display_name}
                </p>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-xl font-bold text-gray-800 mb-4">
              <span>Total a pagar:</span>
              <span className="bg-gradient-to-r from-pink-600 to-yellow-600 bg-clip-text text-transparent">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={processing}
              className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : '✓ Confirmar Orden'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Al confirmar tu orden, nuestro equipo procesará tu pedido y te contactará para coordinar el pago y envío.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
