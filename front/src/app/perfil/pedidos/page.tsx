"use client";
import React, { useEffect, useState } from "react";
import useSales from "../../../hooks/useSales";
import OrderDetailModal from "../../admin/ventas/components/OrderDetailModal";
import { Order } from "../../../utils/api";

export default function MisPedidosPage() {
  const { orders, loading, error, refresh } = useSales();
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  // "Cargar más" behavior: show a growing slice of the orders list
  const [batchSize, setBatchSize] = useState(10);
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    // reset visible count when orders change or batch size changes
    setVisibleCount(batchSize);
  }, [orders.length, batchSize]);

  const shownOrders = (orders ?? []).slice(0, visibleCount);
  const hasMore = (orders?.length ?? 0) > visibleCount;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Mis pedidos</h1>
      {loading && <div>Cargando pedidos...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && orders.length === 0 && <div>No tienes pedidos aún.</div>}

      {/* "Cargar más" controls */}
      {orders.length > 0 && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Cargar en bloques de:</label>
            <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="text-sm text-gray-600">items</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-700">Mostrando {Math.min(visibleCount, orders.length)} de {orders.length}</div>
            {hasMore && (
              <button onClick={() => setVisibleCount((v) => Math.min(orders.length, v + batchSize))} className="px-3 py-1 bg-gray-200 rounded">Cargar más</button>
            )}
          </div>
        </div>
      )}

      {/* Desktop: compact table */}
      <div className="hidden md:block">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-3">Pedido</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 text-right">Importe</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shownOrders.map((o: any) => (
              <tr key={o.ID ?? o.id} className="border-b hover:bg-gray-50">
                <td className="p-3 align-middle">#{o.ID ?? o.id}</td>
                <td className="p-3 align-middle">{new Date(o.created_at ?? o.createdAt ?? o.CreatedAt ?? Date.now()).toLocaleString()}</td>
                <td className="p-3 text-right align-middle">${(o.total ?? o.Total ?? 0).toFixed(2)}</td>
                <td className="p-3 align-middle">{o.status ?? o.Status}</td>
                <td className="p-3 align-middle">
                  <button onClick={() => setModalOrder(o)} className="px-3 py-1 bg-blue-600 text-white rounded">Ver detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards with expandable details */}
      <div className="md:hidden space-y-3">
  {shownOrders.map((o: any) => (
          <details key={o.ID ?? o.id} className="border rounded p-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <div>
                <div className="font-medium">Pedido #{o.ID ?? o.id}</div>
                <div className="text-sm text-gray-500">{new Date(o.created_at ?? o.createdAt ?? o.CreatedAt ?? Date.now()).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">${(o.total ?? o.Total ?? 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">{o.status ?? o.Status}</div>
              </div>
            </summary>
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-2">Items:</div>
              <ul className="space-y-1">
                {(o.items ?? o.Items ?? []).map((it: any, idx: number) => (
                  <li key={it.ID ?? it.id ?? idx} className="flex justify-between">
                    <div>
                      <div className="font-medium">{it.product?.name ?? it.product?.title ?? it.product?.description ?? it.Product?.name ?? 'Producto'}</div>
                      <div className="text-sm text-gray-500">Cantidad: {it.quantity ?? it.Quantity}</div>
                    </div>
                    <div className="text-right text-sm">${((it.price ?? it.Price) ?? 0).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <button onClick={() => setModalOrder(o)} className="px-3 py-1 bg-blue-600 text-white rounded">Ver detalle</button>
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* Removed manual "Actualizar" button to make the list reactive.
          Instead we refresh the list when the detail modal closes (in case
          the order was updated while viewing). */}

      <OrderDetailModal open={!!modalOrder} order={modalOrder} onClose={() => { setModalOrder(null); refresh(); }} />
    </main>
  );
}
