"use client"
import React, { useEffect, useState } from "react";

type StockRow = { location: string; variant_id?: number | null; quantity: number };

type Props = {
  open: boolean;
  onClose: () => void;
  productId: number;
  onSaved?: () => void;
};

interface Location {
  ID: number;
  code: string;
  name: string;
  active: boolean;
}

export default function AddStockModal({ open, onClose, productId, onSaved }: Props) {
  const [rows, setRows] = useState<StockRow[]>([{ location: "", quantity: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Cargar ubicaciones activas desde la API
  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await fetch(`${API_URL}/locations?active=true`);
      if (res.ok) {
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setLoadingLocations(false);
    }
  };
  const [variants, setVariants] = useState<Array<{ ID?: number; id?: number; color?: string; size?: string }>>([]);

  useEffect(() => {
    // Inicializar con una fila vacía
    setRows([{ location: locations[0] ?? "", quantity: 0 }]);
  }, [open, locations]);

  useEffect(() => {
    if (!open) return;
    // Cargar variantes del producto si productId válido
    if (productId && productId > 0) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/products/${productId}/variants`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
        .then((r) => r.json())
        .then((data) => {
          setVariants(Array.isArray(data) ? data : []);
        })
        .catch(() => setVariants([]));
    } else {
      setVariants([]);
    }
  }, [open, productId]);

  const addRow = () => setRows((r) => [...r, { location: locations[0]?.code ?? "", quantity: 0 }]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<StockRow>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const validateRows = () => {
    if (rows.length === 0) return false;
    for (const r of rows) {
      if (!r.location) return false;
      if (r.quantity == null || Number.isNaN(r.quantity) || r.quantity < 0) return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateRows()) {
      setError("Corrige los campos: ubicación y cantidad son obligatorios y cantidad >= 0");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const body = { stocks: rows.map((r) => ({ location: r.location, variant_id: r.variant_id, quantity: r.quantity })) };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/products/${productId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al guardar stocks");
      }
      onSaved && onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-2">Agregar / Actualizar stocks (producto {productId})</h3>
        {loadingLocations ? (
          <div className="text-gray-500 py-4">Cargando ubicaciones...</div>
        ) : locations.length === 0 ? (
          <div className="text-red-500 py-4">No hay ubicaciones activas disponibles. Por favor, crea ubicaciones desde el panel de administración.</div>
        ) : (
          <>
            {rows.map((row, idx) => (
              <div key={`${row.location}-${row.variant_id ?? 'none'}-${idx}`} className="flex gap-2 items-center mb-2">
                <select className="border px-2 py-1" value={row.location} onChange={(e) => updateRow(idx, { location: e.target.value })}>
                  <option value="">Seleccionar ubicación</option>
                  {locations.map((loc) => (
                    <option key={loc.code} value={loc.code}>{loc.name}</option>
                  ))}
                </select>
                <select className="border px-2 py-1 w-48" value={row.variant_id ?? ""} onChange={(e) => updateRow(idx, { variant_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Producto (sin variante)</option>
                  {variants.map((v) => (
                    <option key={(v.ID ?? v.id) as number} value={(v.ID ?? v.id) as number}>{`${v.size ?? ""} ${v.color ?? ""}`.trim() || `Variante ${(v.ID ?? v.id)}`}</option>
                  ))}
                </select>
                <input className="border px-2 py-1 w-32" type="number" min={0} value={row.quantity} onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })} />
                <button type="button" className="text-red-600" onClick={() => removeRow(idx)}>Eliminar</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={addRow} disabled={locations.length === 0}>Añadir fila</button>
              <div className="flex-1" />
              <button className="bg-white px-3 py-1 rounded border" onClick={onClose}>Cancelar</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={submit} disabled={loading || locations.length === 0}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </>
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}
