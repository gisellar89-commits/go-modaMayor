"use client";
import React, { useState } from "react";
import { API_BASE } from "../../../utils/api";
import useSales from "../../../hooks/useSales";
import SalesToolbar from "./components/SalesToolbar";
import SalesStats from "./components/SalesStats";
import SalesList from "./components/SalesList";
import OrderDetailModal from "./components/OrderDetailModal";
import { Toaster } from "react-hot-toast";
import ConfirmDialog from "./components/ConfirmDialog";

export default function AdminVentasPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [modalOrder, setModalOrder] = useState<any | null>(null);

  const { orders, loading, error, changeStatus, refresh, stats } = useSales();
  const [sellers, setSellers] = useState<Array<{ id: number; name?: string; email?: string; active?: boolean }>>([]);
  const [confirm, setConfirm] = useState<{ id?: number; status?: string } | null>(null);
  const dangerousStatuses = ["cancelada", "finalizada"];

  React.useEffect(() => {
    // Fetch users and keep only vendedores (and optionally active ones)
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const vs = data.filter((u: any) => (u.role === 'vendedor')).map((u: any) => ({ id: u.ID ?? u.id, name: u.name, email: u.email, active: u.active }));
        setSellers(vs);
      } catch (err) {
        console.error('No se pudieron cargar vendedoras', err);
      }
    };
    void load();
  }, []);

  const filtered = orders.filter(o => {
    if (status && (o.status || "").toLowerCase() !== status.toLowerCase()) return false;
    if (q) {
      const qq = q.toLowerCase();
      return String(o.ID ?? o.id).includes(qq) || (o.User?.name || "").toLowerCase().includes(qq) || (o.User?.email || "").toLowerCase().includes(qq);
    }
    return true;
  });

  const statuses = ["creada", "procesando", "enviada", "finalizada", "cancelada"];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Ventas</h2>
      <SalesToolbar q={q} status={status} onChangeQ={setQ} onChangeStatus={setStatus} onClear={() => { setQ(""); setStatus(""); }} onExport={() => { /* export logic */ }} />
      <SalesStats totalOrders={stats.totalOrders} totalRevenue={stats.totalRevenue} pending={stats.pending} completed={stats.completed} />
  {error && <div className="text-red-600">{error}</div>}
  <Toaster position="top-right" />
  <SalesList
        orders={filtered}
        loading={loading}
        statuses={statuses}
        onChangeStatus={changeStatus}
        onOpen={(o) => setModalOrder(o)}
        onRequestChangeStatus={(id, status) => {
          if (!status) return;
          const s = status.toLowerCase();
          if (dangerousStatuses.includes(s)) {
            setConfirm({ id, status });
          } else {
            // apply immediately for non-dangerous statuses
            void changeStatus(id, status);
          }
        }}
        sellers={sellers}
        onAssign={async (id, sellerId) => {
          if (!id) return;
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${API_BASE}/orders/${id}/assign`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, body: JSON.stringify({ assigned_to: sellerId }) });
            if (!res.ok) {
              const e = await res.json().catch(() => null);
              alert(e?.error || 'Error al asignar la orden');
              return;
            }
            alert('Orden asignada correctamente');
            await refresh();
          } catch (err) {
            console.error(err);
            alert('Error en la asignación');
          }
        }}
      />

      {/* Confirm dialog only for dangerous statuses */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.status === "cancelada" ? "Atención: cancelar pedido" : "Confirmar cambio de estado"}
        message={confirm?.status === "cancelada" ? "Este pedido se marcará como cancelado. Esta acción puede ser irreversible. ¿Deseas continuar?" : `Cambiar estado a "${confirm?.status}"?`}
        onConfirm={async () => {
          if (confirm?.id) {
            await changeStatus(confirm.id, confirm.status || "");
            setConfirm(null);
          }
        }}
        onCancel={() => setConfirm(null)}
      />
  <OrderDetailModal open={!!modalOrder} order={modalOrder} onClose={() => setModalOrder(null)} />
    </div>
  );
}
