import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchOrders, updateOrderStatus, Order } from "../utils/api";

export type SalesFilters = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export default function useSales(initialFilters: SalesFilters = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalesFilters>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use fetchOrders for admin to see all orders
      const data = await fetchOrders();
      setOrders(data);
    } catch (e: any) {
      // If auth error, show a toast but don't forcibly clear token here
      if (typeof e === 'object' && e !== null && typeof (e.message) === 'string' && e.message.startsWith('AUTH_ERROR')) {
        // extract message portion after two colons
        const parts = e.message.split(':');
        const status = parts[1] ?? '401';
        const msg = parts.slice(2).join(':') || 'No autorizado';
        setError(msg);
      } else {
        setError(e?.message ?? String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { await load(); };

  const changeStatus = async (id: number | undefined, status: string) => {
    if (!id) return false;
    try {
      const currentToken = typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined;
      await updateOrderStatus(id, status, currentToken);
      await load();
      toast.success("Estado actualizado");
      return true;
    } catch (e) {
      const msg = String(e) || "Error al actualizar estado";
      setError(msg);
      toast.error(msg);
      return false;
    }
  };

  const setFilter = (patch: Partial<SalesFilters>) => setFilters(prev => ({ ...prev, ...patch }));

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.filter(o => (o.status || "").toLowerCase() === "finalizada").reduce((s, o) => s + (o.total ?? 0), 0),
    pending: orders.filter(o => {
      const status = (o.status || "").toLowerCase();
      return status === "creada" || status === "asignada" || status === "procesando";
    }).length,
    completed: orders.filter(o => (o.status || "").toLowerCase() === "finalizada").length,
  };

  return {
    orders,
    loading,
    error,
    filters,
    setFilter,
    refresh,
    changeStatus,
    stats,
  };
}
