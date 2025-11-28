"use client";
import React from "react";
import { Order } from "../../../../utils/api";

type Props = {
  order: Order;
  statuses: string[];
  onChangeStatus: (id: number | undefined, status: string) => void;
  onRequestChangeStatus?: (id: number | undefined, status: string) => void;
  onOpen?: (order: Order) => void;
  onAssign?: (id: number | undefined, sellerId: number) => void;
  sellers?: { id: number; name?: string; email?: string }[];
};

export default function OrderRow({ order, statuses, onChangeStatus, onOpen, onRequestChangeStatus, onAssign, sellers }: Props) {
  const [showAssign, setShowAssign] = React.useState(false);
  const [selectedSeller, setSelectedSeller] = React.useState<number | undefined>(undefined);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1 border">{order.ID ?? order.id}</td>
      <td className="px-2 py-1 border">{order.User?.name ?? order.User?.email ?? `#${order.user_id}`}</td>
      <td className="px-2 py-1 border">{order.status}</td>
      <td className="px-2 py-1 border">${(order.total ?? 0).toFixed(2)}</td>
      <td className="px-2 py-1 border">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
      <td className="px-2 py-1 border">
        <div className="flex gap-2 items-center">
          <select defaultValue={order.status} onChange={e => onRequestChangeStatus ? onRequestChangeStatus(order.ID ?? order.id, e.target.value) : onChangeStatus(order.ID ?? order.id, e.target.value)} className="border px-2 py-1 rounded">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => onOpen && onOpen(order)} className="px-2 py-1 bg-gray-100 rounded border">Ver</button>
          { (order.status === 'pendiente_asignacion' || order.status === 'esperando_vendedora') && (
            <div className="flex items-center gap-2">
              {!showAssign && <button onClick={() => setShowAssign(true)} className="px-2 py-1 bg-green-600 text-white rounded">Asignar</button>}
              {showAssign && (
                <div className="flex items-center gap-2">
                  <select value={selectedSeller ?? ''} onChange={e => setSelectedSeller(Number(e.target.value) || undefined)} className="border px-2 py-1 rounded">
                    <option value="">Seleccionar vendedora</option>
                    {Array.isArray(sellers) && sellers.map(s => (
                      <option key={s.id} value={s.id}>{s.name ?? s.email ?? s.id}</option>
                    ))}
                  </select>
                  <button onClick={() => { if (!selectedSeller) { alert('Seleccioná una vendedora'); return; } onAssign && onAssign(order.ID ?? order.id, selectedSeller); setShowAssign(false); setSelectedSeller(undefined); }} className="px-2 py-1 bg-blue-600 text-white rounded">Confirmar</button>
                  <button onClick={() => { setShowAssign(false); setSelectedSeller(undefined); }} className="px-2 py-1 bg-gray-200 rounded">Cancelar</button>
                </div>
              )}
            </div>
          ) }
        </div>
      </td>
    </tr>
  );
}
