"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  stockAlerts: any[];
}

export default function AdminPage() {
  const auth = useAuth();
  const role = auth?.user?.role;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Si es vendedor, solo cargar sus órdenes asignadas
      if (role === "vendedor") {
        try {
          const ordersRes = await fetch(`http://localhost:8080/orders?vendedor_id=${auth?.user?.id || 0}&limit=10`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            const orders = ordersData.orders || ordersData.items || [];
            setStats({
              totalProducts: 0,
              totalOrders: orders.length,
              lowStockProducts: 0,
              totalRevenue: 0,
              recentOrders: orders.slice(0, 10),
              topProducts: [],
              stockAlerts: [],
            });
          }
        } catch (e) {
          console.error("Error cargando órdenes del vendedor:", e);
        }
        setLoading(false);
        return;
      }
      
      // Cargar productos para estadísticas básicas (admin/encargado)
      const productsRes = await fetch("http://localhost:8080/products?limit=1000", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const productsData = await productsRes.json();
      const products = productsData.items || [];
      const totalProducts = productsData.total || products.length;
      
      // Cargar todos los stocks desde location_stocks para calcular productos con stock bajo
      let stocksRes;
      let allStocks = [];
      try {
        stocksRes = await fetch("http://localhost:8080/location-stocks", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (stocksRes.ok) {
          allStocks = await stocksRes.json();
        }
      } catch (e) {
        console.log("No se pudieron cargar stocks");
      }
      
      // Agrupar stocks por producto_id y calcular total
      const stocksByProduct = new Map<number, number>();
      allStocks.forEach((stock: any) => {
        const productId = stock.product_id;
        const currentStock = stocksByProduct.get(productId) || 0;
        stocksByProduct.set(productId, currentStock + (stock.stock || 0));
      });
      
      // Filtrar productos con stock bajo (1-9 unidades)
      const lowStockProductIds = Array.from(stocksByProduct.entries())
        .filter(([productId, totalStock]) => totalStock > 0 && totalStock < 10)
        .map(([productId]) => productId);
      
      const lowStockProducts = products.filter((p: any) => 
        lowStockProductIds.includes(p.ID || p.id)
      );

      // Cargar órdenes si existen
      let orders = [];
      try {
        const ordersRes = await fetch("http://localhost:8080/orders?limit=5", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log('📦 Orders response status:', ordersRes.status);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          console.log('📦 Orders data received:', ordersData);
          orders = ordersData.orders || ordersData.items || ordersData || [];
          console.log('📦 Orders array length:', orders.length);
        } else {
          const errorText = await ordersRes.text();
          console.log('❌ Orders error:', errorText);
        }
      } catch (e) {
        console.log("❌ No se pudieron cargar órdenes:", e);
      }

      // Cargar productos más vendidos desde el endpoint de reportes
      let topProducts = [];
      try {
        const topRes = await fetch("http://localhost:8080/reports/top-products?limit=5", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (topRes.ok) {
          const data = await topRes.json();
          // El endpoint devuelve { from, to, limit, data: [...] }
          topProducts = data.data || [];
        }
      } catch (e) {
        console.log("No se pudieron cargar productos más vendidos");
      }

      setStats({
        totalProducts: totalProducts, // Usar el total correcto del backend
        totalOrders: orders.length,
        lowStockProducts: lowStockProducts.length,
        totalRevenue: orders.filter(o => (o.status || "").toLowerCase() === "finalizada").reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        recentOrders: orders.slice(0, 5),
        topProducts: topProducts.slice(0, 5),
        stockAlerts: lowStockProducts.slice(0, 5),
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando estadísticas...</div>
        </div>
      </main>
    );
  }

  // Si es vendedor, mostrar solo el ranking y sus órdenes
  if (role === "vendedor") {
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

        {/* Órdenes Asignadas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mis Órdenes Asignadas</h2>
            <Link href="/admin/ventas" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todas
            </Link>
          </div>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
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
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">#{order.id}</td>
                      <td className="py-3 px-4 text-sm text-blue-600">
                        {order.cart_id ? `#${order.cart_id}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {order.user?.name || `Usuario #${order.user_id}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        ${(order.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/ventas/${order.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
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
      </main>
    );
  }

  // Vista completa para admin y encargado
  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {auth?.user?.name || "Usuario"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <Link href="/admin/productos" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Ver productos →
          </Link>
        </div>

        {/* Total Órdenes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Órdenes Recientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/ventas" className="text-sm text-green-600 hover:text-green-700 mt-4 inline-block">
            Ver ventas →
          </Link>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Stock Bajo</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.lowStockProducts || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/inventario?filter=low" className="text-sm text-orange-600 hover:text-orange-700 mt-4 inline-block">
            Ver inventario →
          </Link>
        </div>

        {/* Ingresos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Finalizadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${(stats?.totalRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Solo órdenes completadas</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            Últimas órdenes
          </div>
        </div>
      </div>

      {/* Ranking de Vendedores - Destacado */}
      <Link href="/admin/ranking" className="block mb-8">
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-lg shadow-sm border-2 border-yellow-200 p-6 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Ranking de Vendedores</h2>
                <p className="text-gray-600">Ver el top de vendedores del mes actual</p>
              </div>
            </div>
            <div className="text-yellow-600 group-hover:translate-x-2 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Accesos Rápidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/productos" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Nuevo Producto</div>
              </div>
            </Link>

            <Link href="/admin/inventario" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Inventario</div>
              </div>
            </Link>

            <Link href="/admin/ventas" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Ver Ventas</div>
              </div>
            </Link>

            <Link href="/admin/categorias" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Categorías</div>
              </div>
            </Link>

            <Link href="/admin/usuarios" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Usuarios</div>
              </div>
            </Link>

            <Link href="/admin/faqs" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">FAQs</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Alertas de Stock</h2>
            <Link href="/admin/inventario?filter=low" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todo
            </Link>
          </div>
          {stats?.stockAlerts && stats.stockAlerts.length > 0 ? (
            <div className="space-y-3">
              {stats.stockAlerts.map((product: any) => {
                const id = product.ID || product.id;
                const totalStock = (product.stocks || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
                return (
                  <div key={id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">Stock: {totalStock} unidades</div>
                    </div>
                    <Link
                      href={`/admin/inventario?search=PROD-${String(id).padStart(5, '0')}`}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Ver →
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No hay alertas de stock</p>
            </div>
          )}
        </div>
      </div>

      {/* Productos Más Vendidos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h2>
          <Link href="/admin/ventas" className="text-sm text-blue-600 hover:text-blue-700">
            Ver reporte completo
          </Link>
        </div>
        {stats?.topProducts && stats.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Producto</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Vendidos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ingresos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((item: any, idx: number) => {
                  const product = item.product || item.Product;
                  const productId = product?.ID || product?.id;
                  const productName = product?.name || "Producto";
                  const quantitySold = item.quantity_sold || item.QuantitySold || 0;
                  const totalRevenue = item.total_revenue || item.TotalRevenue || 0;
                  
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 text-sm">{productName}</div>
                        <div className="text-xs text-gray-500">ID: {productId}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900">
                        {quantitySold}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        ${totalRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/productos/${productId}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No hay datos de ventas disponibles</p>
          </div>
        )}
      </div>
    </main>
  );
}
