"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";

export default function VendedoraOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/orders/seller`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('No se pudieron obtener las órdenes');
      const data = await res.json();
      setOrders(data);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const assignSelf = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/orders/${id}/assign-self`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'No se pudo asignar la orden');
        return;
      }
      alert('Te asignaste a la orden');
      fetchOrders();
    } catch (e) {
      alert('Error en la operación');
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Órdenes asignadas / pendientes</h1>
      {loading ? <div>Cargando...</div> : error ? <div className="text-red-500">{error}</div> : (
        <div className="space-y-4">
          {orders.length === 0 && <div>No hay órdenes asignadas o pendientes.</div>}
          {orders.map((o: any, idx: number) => (
            <div key={o.ID ?? o.id ?? idx} className="border rounded p-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-semibold">Orden #{o.id} - {o.status}</div>
                  <div className="text-sm text-gray-600">Cliente: {o.user?.name ?? o.user?.email ?? o.user_id}</div>
                  <div className="text-sm mt-2">Total: ${Number(o.total || 0).toFixed(2)}</div>
                  <div className="mt-2">
                    <strong>Items:</strong>
                    <ul className="list-disc ml-6">
                      {Array.isArray(o.items) && o.items.map((it: any, idxItem: number) => (
                        <li key={it.ID ?? it.id ?? it.product_id ?? idxItem}>{it.product?.name ?? it.product_name ?? 'Producto'} x{it.quantity} - ${it.price?.toFixed?.(2) ?? it.price}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {o.status === 'pendiente_asignacion' && (
                    <button onClick={() => assignSelf(o.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Asignarme</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
