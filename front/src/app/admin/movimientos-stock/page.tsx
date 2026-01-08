"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface StockMovement {
  ID: number;
  product_id: number;
  variant_id?: number;
  location: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference: string;
  user_id?: number;
  user_name: string;
  notes: string;
  CreatedAt: string;
}

const MOVEMENT_TYPES = [
  { value: "adjustment", label: "Ajuste", color: "blue" },
  { value: "sale", label: "Venta", color: "green" },
  { value: "return", label: "Devolución", color: "yellow" },
  { value: "transfer", label: "Transferencia", color: "purple" },
  { value: "initial", label: "Stock Inicial", color: "gray" },
];

const LOCATIONS = [
  { value: "deposito", label: "Depósito" },
  { value: "local", label: "Local" },
  { value: "online", label: "Online" },
];

export default function MovimientosStockPage() {
  const auth = useAuth();
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    if (!auth || !auth.user) {
      router.push("/login");
      return;
    }
    if (auth.user.role !== "admin" && auth.user.role !== "encargado") {
      router.push("/admin");
      return;
    }
    loadMovements();
  }, [auth, router, filterLocation, filterType, filterProductId, limit]);

  async function loadMovements() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterLocation) params.append("location", filterLocation);
      if (filterType) params.append("movement_type", filterType);
      if (filterProductId) params.append("product_id", filterProductId);
      params.append("limit", limit.toString());

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/stock-movements?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al cargar movimientos");
      const data = await res.json();
      setMovements(data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }

  function getMovementTypeInfo(type: string) {
    return MOVEMENT_TYPES.find((t) => t.value === type) || { label: type, color: "gray" };
  }

  function getLocationLabel(location: string) {
    return LOCATIONS.find((l) => l.value === location)?.label || location;
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getColorClass(color: string) {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colors[color] || colors.gray;
  }

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <span>Admin</span> <span className="mx-2">/</span>{" "}
          <span>Catálogo</span> <span className="mx-2">/</span>{" "}
          <span className="text-gray-900 font-medium">Movimientos de Stock</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movimientos de Stock</h1>
            <p className="text-gray-600 mt-1">
              Historial de entradas, salidas y ajustes de inventario
            </p>
          </div>
          <button
            onClick={loadMovements}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </button>
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
            <p className="font-semibold mb-1">Trazabilidad de inventario</p>
            <p>
              Esta página muestra todos los movimientos de stock registrados automáticamente
              por ventas, devoluciones y transferencias, así como los ajustes manuales realizados
              por administradores. Los últimos {limit} registros se muestran ordenados por fecha.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {MOVEMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Producto
            </label>
            <input
              type="text"
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              placeholder="Ej: 123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
              <option value={500}>500 registros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total de Movimientos</div>
          <div className="text-2xl font-bold text-gray-900">{movements.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Entradas Totales</div>
          <div className="text-2xl font-bold text-green-600">
            +{movements.filter((m) => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Salidas Totales</div>
          <div className="text-2xl font-bold text-red-600">
            {movements.filter((m) => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stock Anterior
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stock Nuevo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No hay movimientos registrados con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const typeInfo = getMovementTypeInfo(movement.movement_type);
                  return (
                    <tr key={movement.ID} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(movement.CreatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(
                            typeInfo.color
                          )}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getLocationLabel(movement.location)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">Producto #{movement.product_id}</div>
                          {movement.variant_id && (
                            <div className="text-xs text-gray-500">
                              Variante #{movement.variant_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          movement.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {movement.previous_stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {movement.new_stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          {movement.reason && (
                            <div className="font-medium">{movement.reason}</div>
                          )}
                          {movement.reference && (
                            <div className="text-xs text-gray-500">
                              Ref: {movement.reference}
                            </div>
                          )}
                          {movement.notes && (
                            <div className="text-xs text-gray-500 italic">
                              {movement.notes}
                            </div>
                          )}
                          {!movement.reason && !movement.reference && !movement.notes && "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {movement.user_name || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      {movements.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Mostrando {movements.length} movimiento(s). Los registros están ordenados del más reciente al más antiguo.
        </div>
      )}
    </div>
  );
}
