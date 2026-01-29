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
import { useAuth } from "../../../contexts/AuthContext";

export default function AdminVentasPage() {
  const auth = useAuth();
  const role = auth?.user?.role;
  const userId = auth?.user?.id;
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
    // Si es vendedor, solo mostrar sus órdenes asignadas
    if (role === "vendedor" && o.assigned_to !== userId) return false;
    
    if (status && (o.status || "").toLowerCase() !== status.toLowerCase()) return false;
    if (q) {
      const qq = q.toLowerCase();
      return String(o.ID ?? o.id).includes(qq) || (o.User?.name || "").toLowerCase().includes(qq) || (o.User?.email || "").toLowerCase().includes(qq);
    }
    return true;
  });

  // Estados del carrito que también usa el vendedor
  const statuses = ["esperando_vendedora", "listo_para_pago", "pagado", "enviado", "completado", "cancelado"];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Gestión de Órdenes</h2>
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
          // Siempre pedir confirmación antes de cambiar el estado
          setConfirm({ id, status });
        }}
        sellers={role === "vendedor" ? [] : sellers}
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

      {/* Confirm dialog for all status changes */}
      <ConfirmDialog
        open={!!confirm}
        title="Confirmar cambio de estado"
        message={`¿Cambiar estado a "${confirm?.status}"? Este cambio también actualizará el estado del carrito asociado.`}
        onConfirm={async () => {
          if (confirm?.id) {
            await changeStatus(confirm.id, confirm.status || "");
            setConfirm(null);
          }
        }}
        onCancel={() => setConfirm(null)}
      />
  <OrderDetailModal open={!!modalOrder} order={modalOrder} onClose={() => setModalOrder(null)} isAdminView={true} />
    </div>
  );
}
