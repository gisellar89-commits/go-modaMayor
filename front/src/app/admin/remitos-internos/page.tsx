"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RemitoInternoItem {
  id: number;
  remito_interno_id: number;
  cart_item_id: number | null;
  product_id: number;
  variant_id: number | null;
  cantidad: number;
  product?: {
    id: number;
    name: string;
    image_url: string | null;
  };
  variant?: {
    id: number;
    sku: string;
    size?: string;
    color?: string;
  };
}

interface RemitoInterno {
  id: number;
  numero: string;
  cart_id: number | null;
  order_id: number | null;
  ubicacion_origen: string;
  ubicacion_destino: string;
  estado: string;
  fecha_envio: string | null;
  fecha_recepcion: string | null;
  recibido_por_user_id: number | null;
  observaciones: string;
  created_at: string;
  items: RemitoInternoItem[];
}

export default function RemitosInternosPage() {
  const router = useRouter();
  const [remitos, setRemitos] = useState<RemitoInterno[]>([]);
  const [loading, setLoading] = useState(true);
    // const [mostrarHistoricos, setMostrarHistoricos] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRemito, setSelectedRemito] = useState<RemitoInterno | null>(null);


  useEffect(() => {
    fetchRemitosPendientes();
  }, []);
  // Eliminada dependencia a mostrarHistoricos
  // Función de históricos eliminada porque ya no se usa

  const fetchRemitosPendientes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/remitos-internos/pendientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRemitos(data || []);
      } else {
        console.error("Error al cargar remitos");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async () => {
    if (!selectedRemito) return;

    setConfirmingId(selectedRemito.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/remitos-internos/${selectedRemito.id}/confirmar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            observaciones: observaciones.trim(),
          }),
        }
      );

      if (response.ok) {
        alert("✅ Remito recibido exitosamente. El stock ha sido transferido a depósito.");
        setShowConfirmModal(false);
        setSelectedRemito(null);
        setObservaciones("");
        fetchRemitosPendientes(); // Recargar lista
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo confirmar la recepción"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al confirmar recepción");
    } finally {
      setConfirmingId(null);
    }
  };

  const openConfirmModal = (remito: RemitoInterno) => {
    setSelectedRemito(remito);
    setShowConfirmModal(true);
    setObservaciones("");
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_transito: "bg-blue-100 text-blue-800",
      recibido: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return badges[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      en_transito: "En Tránsito",
      recibido: "Recibido",
      cancelado: "Cancelado",
    };
    return labels[estado] || estado;
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando remitos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Remitos Internos</h1>
          <p className="text-gray-600 mt-2">
            Gestión de traslados de stock entre ubicaciones
          </p>
        </div>
          {/* Botón de históricos removido temporalmente */}
      </div>

      {remitos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay remitos pendientes
          </h3>
          <p className="text-gray-500">
              Los remitos internos se generan automáticamente cuando hay stock en sucursales que debe trasladarse a depósito.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {remitos.map((remito) => (
            <div
              key={remito.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {remito.numero}
                  </h3>
                  <div className="flex gap-2 items-center mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(
                        remito.estado
                      )}`}
                    >
                      {getEstadoLabel(remito.estado)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      🏢 Origen: <span className="font-semibold">{remito.ubicacion_origen}</span> →{" "}
                      Destino: <span className="font-semibold">{remito.ubicacion_destino}</span>
                    </p>
                    <p>📅 Enviado: {formatFecha(remito.fecha_envio)}</p>
                    {remito.cart_id && (
                      <p>
                        🛒 Carrito: {" "}
                        <button
                          onClick={() => router.push(`/vendedora/carritos`)}
                          className="text-blue-600 hover:underline"
                        >
                          #{remito.cart_id}
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {remito.estado === "pendiente" && (
                  <button
                    onClick={() => openConfirmModal(remito)}
                    disabled={confirmingId === remito.id}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {confirmingId === remito.id ? "Procesando..." : "✓ Confirmar Recepción"}
                  </button>
                )}
              </div>

              {/* Lista de items */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Items ({remito.items?.length || 0}):
                </h4>
                <div className="grid gap-3">
                  {remito.items?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-4 rounded flex items-center gap-4"
                    >
                      {/* Imagen del producto */}
                      {item.product?.image_url ? (
                        <img
                          src={`http://localhost:8080${item.product.image_url}`}
                          alt={item.product.name || "Producto"}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=Sin+Imagen";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          Sin imagen
                        </div>
                      )}
                      
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800">
                          {item.product?.name || `Producto ID: ${item.product_id}`}
                        </h5>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: {item.product_id}
                        </p>
                        {item.variant && (
                          <div className="text-sm text-gray-700 mt-2 space-y-1">
                            {item.variant.size && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Talle:</span>
                                <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-700">
                                  {item.variant.size}
                                </span>
                              </div>
                            )}
                            {item.variant.color && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Color:</span>
                                <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-700">
                                  {item.variant.color}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-500 mt-1">SKU: {item.variant.sku}</p>
                        )}
                      </div>
                      
                      {/* Cantidad */}
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Cantidad</div>
                        <div className="text-2xl font-bold text-gray-900">{item.cantidad}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {remito.observaciones && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Observaciones:</span> {remito.observaciones}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && selectedRemito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Confirmar Recepción
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Remito {selectedRemito.numero}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedRemito(null);
                    setObservaciones("");
                  }}
                  disabled={confirmingId !== null}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Información del movimiento */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Transferencia de Stock
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <span className="font-semibold">{selectedRemito.ubicacion_origen}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-semibold">{selectedRemito.ubicacion_destino}</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      El stock se moverá manteniendo la reserva activa
                    </p>
                  </div>
                </div>
              </div>

              {/* Items del remito */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Items a transferir:
                </p>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedRemito.items?.length || 0} {selectedRemito.items?.length === 1 ? "producto" : "productos"}
                </div>
              </div>

              {/* Campo de observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                  rows={3}
                  placeholder="Ej: Todo en buen estado, recibido completo..."
                  disabled={confirmingId !== null}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedRemito(null);
                    setObservaciones("");
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={confirmingId !== null}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarRecepcion}
                  disabled={confirmingId !== null}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {confirmingId ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmar Recepción
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
