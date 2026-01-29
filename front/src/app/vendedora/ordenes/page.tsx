"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE } from "../../../utils/api";
import OrderDetailModal from "../components/OrderDetailModal";

interface DashboardStats {
  totalProducts?: number;
  totalOrders?: number;
  recentOrders?: any[];
}

export default function VendedoraOrdersPage() {
  const auth = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const ordersRes = await fetch(`${API_BASE}/orders/seller`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
        }
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // Filtros de estado
  const statusOptions = [
    { key: "all", label: `Todas (${orders.length})` },
    { key: "completado", label: `Completadas (${orders.filter((o) => (o.status || o.Status || o.estado || "").toLowerCase() === "completado").length})` },
    { key: "cancelado", label: `Canceladas (${orders.filter((o) => (o.status || o.Status || o.estado || "").toLowerCase() === "cancelado").length})` },
    { key: "asignada", label: `Asignadas (${orders.filter((o) => (o.status || o.Status || o.estado || "").toLowerCase() === "asignada").length})` },
    { key: "esperando_vendedora", label: `Esperando vendedora (${orders.filter((o) => (o.status || o.Status || o.estado || "").toLowerCase() === "esperando_vendedora").length})` },
    // Puedes agregar más estados si es necesario
  ];

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((o) => (o.status || o.Status || o.estado || "").toLowerCase() === filterStatus);

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando estadísticas...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {auth?.user?.name || "Usuario"}
        </p>
      </div>

      {/* Ranking de Vendedores */}
      <Link href="/admin/ranking" className="block mb-8">
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-lg shadow-sm border-2 border-yellow-200 p-8 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ranking de Vendedores</h2>
                <p className="text-gray-600 text-lg">Ver el top de vendedores del mes actual</p>
              </div>
            </div>
            <div className="text-yellow-600 group-hover:translate-x-2 transition-transform">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Filtros de estado */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterStatus(opt.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === opt.key
                    ? opt.key === "completado"
                      ? "bg-green-600 text-white"
                      : opt.key === "cancelado"
                      ? "bg-red-600 text-white"
                      : opt.key === "asignada"
                      ? "bg-purple-600 text-white"
                      : opt.key === "esperando_vendedora"
                      ? "bg-yellow-500 text-white"
                      : "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mis Órdenes Asignadas</h2>
        </div>
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Orden</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Carrito</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Fecha</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  const orderId = order.ID || order.id;
                  const cartId = order.CartID || order.cart_id;
                  const userId = order.UserID || order.user_id;
                  const status = order.Status || order.status || order.estado;
                  const total = order.Total || order.total;
                  const createdAt = order.CreatedAt || order.created_at;
                  const userName = order.User?.Name || order.User?.name || order.user?.name;
                  // Determinar si la orden está completada o cancelada
                  const isCompleted = (status || "").toLowerCase() === 'completado' || (status || "").toLowerCase() === 'cancelado';
                  return (
                    <tr key={orderId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">#{orderId}</td>
                      <td className="py-3 px-4 text-sm text-blue-600">
                        {cartId ? `#${cartId}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {userName || `Usuario #${userId}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          (status || "").toLowerCase() === 'completado' ? 'bg-green-100 text-green-800' :
                          (status || "").toLowerCase() === 'esperando_vendedora' ? 'bg-yellow-100 text-yellow-800' :
                          (status || "").toLowerCase() === 'cancelado' ? 'bg-red-100 text-red-800' :
                          (status || "").toLowerCase() === 'pagado' ? 'bg-blue-100 text-blue-800' :
                          (status || "").toLowerCase() === 'asignada' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        ${(total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isCompleted ? (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Ver →
                          </button>
                        ) : (
                          <Link
                            href={`/vendedora/carritos#orden-${orderId}`}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Ver →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No tienes órdenes asignadas</p>
          </div>
        )}
      </div>

      {/* Modal de detalles de orden */}
      <OrderDetailModal 
        open={!!selectedOrder} 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    </main>
  );
}
