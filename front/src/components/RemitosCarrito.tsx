"use client";

import { useState, useEffect } from "react";

interface RemitoInternoItem {
  id: number;
  cantidad: number;
  product_id: number;
  variant_id: number | null;
}

interface RemitoInterno {
  id: number;
  numero: string;
  ubicacion_origen: string;
  ubicacion_destino: string;
  estado: string;
  fecha_envio: string | null;
  fecha_recepcion: string | null;
  observaciones: string;
  created_at: string;
  items: RemitoInternoItem[];
}

interface RemitosCarritoProps {
  cartId: number;
}

export default function RemitosCarrito({ cartId }: RemitosCarritoProps) {
  const [remitos, setRemitos] = useState<RemitoInterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (cartId) {
      fetchRemitos();
    }
  }, [cartId]);

  const fetchRemitos = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${API_URL}/carts/${cartId}/remitos-internos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRemitos(data || []);
      }
    } catch (error) {
      console.error("Error al cargar remitos:", error);
    } finally {
      setLoading(false);
    }
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
      pendiente: "⏳ Pendiente",
      en_transito: "🚚 En Tránsito",
      recibido: "✅ Recibido",
      cancelado: "❌ Cancelado",
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
      <div className="text-sm text-gray-500 italic">
        Cargando remitos internos...
      </div>
    );
  }

  if (!remitos || remitos.length === 0) {
    return null; // No mostrar nada si no hay remitos
  }

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          📦 Remitos Internos ({remitos.length})
        </h4>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {remitos.map((remito) => (
            <div
              key={remito.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{remito.numero}</p>
                  <p className="text-sm text-gray-600">
                    {remito.ubicacion_origen} → {remito.ubicacion_destino}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(
                    remito.estado
                  )}`}
                >
                  {getEstadoLabel(remito.estado)}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>📅 Enviado: {formatFecha(remito.fecha_envio)}</p>
                {remito.fecha_recepcion && (
                  <p>✅ Recibido: {formatFecha(remito.fecha_recepcion)}</p>
                )}
                {remito.items && remito.items.length > 0 && (
                  <p>📦 Items: {remito.items.length} producto(s)</p>
                )}
              </div>

              {remito.observaciones && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                  <span className="font-semibold">Obs:</span> {remito.observaciones}
                </div>
              )}
            </div>
          ))}

          <div className="bg-blue-50 rounded p-3 text-xs text-blue-800">
            ℹ️ Los remitos internos se generan automáticamente cuando hay stock
            en sucursales que debe trasladarse a depósito.
          </div>
        </div>
      )}
    </div>
  );
}
