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
  showLastEdit?: boolean;
};

export default function OrderRow({ order, statuses, onChangeStatus, onOpen, onRequestChangeStatus, onAssign, sellers, showLastEdit }: Props) {
  const [lastEdit, setLastEdit] = React.useState<string>("");
  React.useEffect(() => {
    if (!showLastEdit) return;
    const fetchLastEdit = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        const res = await fetch(`http://localhost:8080/audit/logs/order/${order.ID ?? order.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const logs = await res.json();
        if (Array.isArray(logs) && logs.length > 0) {
          // Usar 'created_at' en minúsculas, que es lo que devuelve el backend
          setLastEdit(logs[0].created_at ? new Date(logs[0].created_at).toLocaleString() : '');
        }
      } catch {}
    };
    fetchLastEdit();
  }, [order.ID, order.id, showLastEdit]);
  const [showAssign, setShowAssign] = React.useState(false);
  const [selectedSeller, setSelectedSeller] = React.useState<number | undefined>(undefined);

  // Función para formatear los estados de forma amigable
  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'esperando_vendedora': '⏳ Esperando vendedora',
      'listo_para_pago': '💳 Listo para pago',
      'pagado': '✅ Pagado',
      'enviado': '📦 Enviado',
      'completado': '🎉 Completado',
      'cancelado': '❌ Cancelado',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'esperando_vendedora') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'listo_para_pago') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'pagado') return 'bg-green-100 text-green-800';
    if (statusLower === 'enviado') return 'bg-purple-100 text-purple-800';
    if (statusLower === 'completado') return 'bg-gray-100 text-gray-800';
    if (statusLower === 'cancelado') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1 border font-semibold">#{order.ID ?? order.id}</td>
      <td className="px-2 py-1 border">{order.User?.name ?? order.User?.email ?? `#${order.user_id}`}</td>
      <td className="px-2 py-1 border">{order.AssignedToUser?.name ?? order.AssignedToUser?.email ?? (order.assigned_to && order.assigned_to > 0 ? `#${order.assigned_to}` : '—')}</td>
      <td className="px-2 py-1 border">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {formatStatus(order.status)}
        </span>
      </td>
      <td className="px-2 py-1 border">${(order.total ?? 0).toFixed(2)}</td>
      <td className="px-2 py-1 border">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
      {showLastEdit && <td className="px-2 py-1 border">{lastEdit || <span className="text-gray-400 text-xs">—</span>}</td>}
      <td className="px-2 py-1 border">
        <div className="flex gap-2 items-center">
          <select 
            value={order.status} 
            onChange={e => onRequestChangeStatus ? onRequestChangeStatus(order.ID ?? order.id, e.target.value) : onChangeStatus(order.ID ?? order.id, e.target.value)} 
            className="border px-2 py-1 rounded text-sm"
          >
            {statuses.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
          </select>
          <button onClick={() => onOpen && onOpen(order)} className="px-2 py-1 bg-gray-100 rounded border">Ver</button>
          { Array.isArray(sellers) && sellers.length > 0 && (
            <div className="flex items-center gap-2">
              {!showAssign && <button onClick={() => setShowAssign(true)} className="px-2 py-1 bg-green-600 text-white rounded">{order.assigned_to ? 'Reasignar' : 'Asignar'}</button>}
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
