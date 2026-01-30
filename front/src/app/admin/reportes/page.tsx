"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SalesReportData {
  total_ventas: number;
  cantidad_pedidos: number;
}

interface Product {
  ID: number;
  name: string;
  code: string;
  cost_price: number;
  wholesale_price: number;
}

interface TopProductData {
  product: Product;
  quantity_sold: number;
  total_revenue: number;
}

export default function ReportesVentasPage() {
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtros de fecha
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Datos de reportes
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [topProductsLimit, setTopProductsLimit] = useState(10);

  useEffect(() => {
    if (!auth || !auth.user) {
      router.push("/login");
      return;
    }
    if (auth.user.role !== "admin") {
      router.push("/admin");
      return;
    }

    // Inicializar fechas por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setStartDate(formatDateForInput(lastMonth));
    setEndDate(formatDateForInput(today));
  }, [auth, router]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReports();
    }
  }, [startDate, endDate, topProductsLimit]);

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function loadReports() {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      // Cargar reporte de ventas generales
      const salesParams = new URLSearchParams();
      salesParams.append("start", startDate);
      salesParams.append("end", endDate);
      
      const salesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/reports/sales?${salesParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!salesRes.ok) throw new Error("Error al cargar reporte de ventas");
      const salesData = await salesRes.json();
      setSalesReport(salesData);

      // Cargar productos más vendidos
      const topParams = new URLSearchParams();
      topParams.append("from", startDate);
      topParams.append("to", endDate);
      topParams.append("limit", topProductsLimit.toString());
      
      const topRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/reports/top-products?${topParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!topRes.ok) throw new Error("Error al cargar productos más vendidos");
      const topData = await topRes.json();
      setTopProducts(topData.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getMargin(revenue: number, product: Product, quantity: number): number {
    const cost = product.cost_price * quantity;
    return revenue - cost;
  }

  function getMarginPercentage(revenue: number, product: Product, quantity: number): number {
    const cost = product.cost_price * quantity;
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <span>Admin</span> <span className="mx-2">/</span>{" "}
          <span className="text-gray-900 font-medium">Reportes de Ventas</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-600 mt-1">
            Análisis de ventas, productos más vendidos y métricas de rendimiento
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Análisis de ventas</p>
            <p>
              Visualiza el rendimiento de ventas en el período seleccionado. Los datos incluyen
              ventas totales, cantidad de pedidos, productos más vendidos y márgenes de ganancia.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filtros de Fecha */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Top Productos
            </label>
            <select
              value={topProductsLimit}
              onChange={(e) => setTopProductsLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>

          <button
            onClick={loadReports}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? "Cargando..." : "Generar Reporte"}
          </button>
        </div>
      </div>

      {/* Resumen General de Ventas */}
      {salesReport && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(salesReport.total_ventas || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cantidad de Pedidos</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {salesReport.cantidad_pedidos || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Promedio</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(
                      salesReport.cantidad_pedidos > 0
                        ? salesReport.total_ventas / salesReport.cantidad_pedidos
                        : 0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Productos Más Vendidos */}
      {topProducts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Productos Más Vendidos (Top {topProductsLimit})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cantidad Vendida
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Precio Promedio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Margen Bruto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      % Margen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((item, index) => {
                    const margin = getMargin(item.total_revenue, item.product, item.quantity_sold);
                    const marginPct = getMarginPercentage(item.total_revenue, item.product, item.quantity_sold);
                    const avgPrice = item.total_revenue / item.quantity_sold;

                    return (
                      <tr key={item.product.ID} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Código: {item.product.code || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                          {item.quantity_sold}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(item.total_revenue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-right">
                          {formatCurrency(avgPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span
                            className={`font-semibold ${
                              margin > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(margin)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              marginPct > 50
                                ? "bg-green-100 text-green-800"
                                : marginPct > 30
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {marginPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales de Top Products */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Unidades Vendidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {topProducts.reduce((sum, item) => sum + item.quantity_sold, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ingresos Totales (Top {topProductsLimit})</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(topProducts.reduce((sum, item) => sum + item.total_revenue, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Margen Bruto Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    topProducts.reduce(
                      (sum, item) => sum + getMargin(item.total_revenue, item.product, item.quantity_sold),
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && (!salesReport || topProducts.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-600 mb-2">No hay datos para mostrar</p>
          <p className="text-sm text-gray-500">
            Selecciona un rango de fechas y haz clic en &quot;Generar Reporte&quot;
          </p>
        </div>
      )}
    </div>
  );
}
