"use client";
import React from "react";
import { Order, resolveImageUrl } from "../../../../utils/api";

type Props = {
  open: boolean;
  order?: Order | null;
  onClose: () => void;
};

export default function OrderDetailModal({ open, order, onClose }: Props) {
  if (!open || !order) return null;
  const o: any = order as any;
  const rawStatus = (o.status ?? "").toString();

  const mapStatus = (s: string) => {
    const low = (s || "").toLowerCase();
    if (!low) return "—";
    if (low.includes("cancel")) return "Cancelado";
    if (low.includes("finaliz") || low.includes("entreg")) return "Pedido entregado";
    if (low.includes("asign") || low.includes("en camino") || low.includes("en camino")) return "En camino";
    if (low.includes("esper") || low.includes("vended")) return "Esperando por vendedora";
    // fallback: capitalize words
    return low.split(/[_\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const status = mapStatus(rawStatus);
  // color mapping requested: azul -> En camino, amarillo -> Esperando vendedora,
  // verde -> Pedido entregado, rojo -> Cancelado, gris neutro para otros
  let statusColor = "bg-gray-100 text-gray-800";
  if (status === "En camino") statusColor = "bg-blue-100 text-blue-800";
  else if (status === "Esperando vendedora") statusColor = "bg-yellow-100 text-yellow-800";
  else if (status === "Pedido entregado") statusColor = "bg-green-100 text-green-800";
  else if (status === "Cancelado") statusColor = "bg-red-100 text-red-800";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* translucent overlay that dims but keeps page visible; slight blur for focus */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="relative w-[min(95%,560px)] max-h-[85vh] overflow-auto">
        <div className="bg-white rounded-lg shadow-xl transform transition-all duration-200 ease-out scale-100">
          <div className="px-6 py-4 border-b flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">Pedido #{o.ID ?? o.id}</h3>
              <div className="text-sm text-gray-500">{o.User?.name ?? o.User?.email}</div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>{status || "—"}</div>
              <button onClick={onClose} aria-label="Cerrar" className="ml-2 p-1 rounded hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-3 text-sm text-gray-600">Fecha: {new Date(o.created_at ?? o.createdAt ?? o.CreatedAt ?? Date.now()).toLocaleString()}</div>

            <div className="border rounded-md divide-y">
              {(o.items || o.Items || []).map((it: any, idx: number) => {
                const imgSrc = resolveImageUrl(it.product_image ?? it.product?.image_url ?? it.product?.image ?? (it.product?.images && it.product.images[0]) ?? null);
                return (
                  <div key={it.ID ?? it.id ?? idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {imgSrc ? (
                        <img src={imgSrc as string} alt={it.product_name || it.product?.name} className="w-14 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">Sin imagen</div>
                      )}
                      <div>
                        <div className="font-medium">{it.product_name || it.product?.name ?? it.product?.title ?? it.Product?.name ?? 'Producto'}</div>
                        <div className="text-sm text-gray-500">Cantidad: {it.quantity ?? it.Quantity}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">${((it.price ?? it.Price) ?? 0).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Método: {o.payment_method ?? o.PaymentMethod ?? '—'}</div>
              <div className="text-lg font-bold">Total: ${(o.total ?? o.Total ?? 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="px-6 py-3 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
