"use client"
import React, { useEffect, useState, use as useReact } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Variant = { ID?: number; id?: number; color?: string; size?: string };
type LocationStock = { ID?: number; id?: number; product_id?: number; variant_id?: number | null; location?: string; stock?: number };

export default function ProductStocksPage({ params }: { params: any }) {
  const router = useRouter();
  const resolvedParams = useReact(params) as { id?: string };
  const productId = Number(resolvedParams.id || params.id || 0);
  const [product, setProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stocks, setStocks] = useState<LocationStock[]>([]);
  const [rows, setRows] = useState<Array<{ location: string; variant_id?: number; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (v: any) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (Array.isArray(v)) return v.map(x => (x?.name || x?.Name || String(x))).join(", ");
    if (typeof v === "object") return (v.name || v.Name || v.title || v.Title) ?? JSON.stringify(v);
    return String(v);
  }

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/products/${productId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then((r) => r.json())
      .then((p) => {
        setProduct(p);
        setVariants(Array.isArray(p.Variants) || Array.isArray(p.variants) ? (p.Variants || p.variants) : []);
        setStocks(Array.isArray(p.LocationStocks) || Array.isArray(p.location_stocks) ? (p.LocationStocks || p.location_stocks) : []);
      })
      .catch((e) => setError(String(e)));
  }, [productId]);

  const DEFAULT_LOCATIONS = (process.env.NEXT_PUBLIC_LOCATIONS || "deposito,mendoza,salta").split(",").map(s => s.trim()).filter(Boolean);
  const findAvailableCombination = () => {
    const used = new Set<string>();
    // mark existing stocks
    stocks.forEach(s => used.add(`${s.location}::${s.variant_id ?? "_product_"}`));
    // mark rows already in the form
    rows.forEach(r => used.add(`${r.location}::${r.variant_id ?? "_product_"}`));

    // if there are variants, try combinations location x variant
    if (variants.length > 0) {
      for (const loc of DEFAULT_LOCATIONS) {
        for (const v of variants) {
          const vid = (v.ID ?? v.id) as number;
          const key = `${loc}::${vid}`;
          if (!used.has(key)) return { location: loc, variant_id: vid };
        }
      }
      // also allow product-level (no variant) if free
      for (const loc of DEFAULT_LOCATIONS) {
        const key = `${loc}::_product_`;
        if (!used.has(key)) return { location: loc };
      }
    } else {
      // no variants: only product-level rows
      for (const loc of DEFAULT_LOCATIONS) {
        const key = `${loc}::_product_`;
        if (!used.has(key)) return { location: loc };
      }
    }
    return null;
  }

  const addRow = () => {
    setError(null);
    const avail = findAvailableCombination();
    if (!avail) {
      const msg = "No quedan combinaciones disponibles para agregar";
      setError(msg);
      toast.error?.(msg);
      return;
    }
    setRows(r => [...r, { location: avail.location, variant_id: avail.variant_id, quantity: 0 }]);
  };

  const usedSetExcluding = (excludeIdx?: number) => {
    const used = new Set<string>();
    stocks.forEach(s => used.add(`${s.location}::${s.variant_id ?? "_product_"}`));
    rows.forEach((r, i) => { if (i !== excludeIdx) used.add(`${r.location}::${r.variant_id ?? "_product_"}`) });
    return used;
  }
  const updateRow = (idx: number, patch: Partial<{ location: string; variant_id?: number; quantity: number }>) => setRows(r => r.map((v,i) => i===idx ? { ...v, ...patch } : v));
  const removeRow = (idx: number) => setRows(r => r.filter((_,i) => i!==idx));

  const submit = async () => {
    setLoading(true);
    setError(null);
    // Validar duplicados: misma location + variant_id
    const seen = new Set<string>();
    for (const r of rows) {
      const key = `${r.location}::${r.variant_id ?? "_product_"}`;
      if (seen.has(key)) {
        const msg = `Fila duplicada: ubicación ${r.location} ${r.variant_id ? `(var ${r.variant_id})` : "(producto)"}`;
        setError(msg);
        toast.error?.(msg);
        setLoading(false);
        return;
      }
      seen.add(key);
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const body = { stocks: rows.map(r => ({ location: r.location, variant_id: r.variant_id, quantity: r.quantity })) };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/products/${productId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setStocks(json.stocks || json);
      setRows([]);
      toast.success?.("Stocks guardados");
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      toast.error?.(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gestionar stocks - Producto {productId}</h1>
        <div className="flex gap-2">
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => router.back()}>Volver</button>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Detalle del producto</h2>
        {product ? (
          <div className="mb-4 p-4 border rounded bg-white shadow-sm flex gap-4 items-start">
            {/* Imagen */}
            <div className="w-36 h-36 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {(() => {
                const img = product.Image || product.image || (product.Images && product.Images[0] && (product.Images[0].URL || product.Images[0].url)) || (product.images && product.images[0] && (product.images[0].url || product.images[0].URL));
                const src = img || "/file.svg";
                return <img src={src} alt={(product.Name || product.name) ?? `Producto ${productId}`} className="w-full h-full object-cover" />;
              })()}
            </div>

            {/* Datos */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{(product.Name || product.name) ?? `Producto ${productId}`}</h3>
                <div className="text-lg font-medium text-gray-800">{fmt(product.Price ?? product.price) ? `$${fmt(product.Price ?? product.price)}` : null}</div>
              </div>
              { (product.Description || product.description) && <p className="text-sm text-gray-700 mt-2">{(product.Description || product.description)?.slice(0,200)}</p> }

              {/* Metadatos útiles */}
              <div className="mt-3 text-sm text-gray-600">
                { (product.SKU || product.sku) && <div><span className="font-medium">SKU:</span> {fmt(product.SKU ?? product.sku)}</div> }
                { (product.Category || product.category) && <div><span className="font-medium">Categoría:</span> {fmt(product.Category ?? product.category)}</div> }
              </div>

              {/* Variantes compactas */}
              {variants.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-1">Variantes</div>
                  <div className="flex gap-2 flex-wrap">
                    {variants.map(v => {
                      const vid = (v.ID ?? v.id) as number;
                      const label = `${v.size ?? ""}${v.size && v.color ? " · " : ""}${v.color ?? ""}${(v as any).sku ? ` · ${(v as any).sku}` : ""}`.trim();
                      return (
                        <div key={vid} className="px-2 py-1 bg-gray-100 text-xs rounded">{label || `Var ${vid}`}</div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (<div className="text-sm text-gray-600 mb-4">Cargando producto...</div>)}

        <h2 className="font-semibold mb-2">Stocks actuales</h2>
        <table className="min-w-full border mb-2">
          <thead>
            <tr className="bg-gray-100"><th className="border px-2 py-1">ID</th><th className="border px-2 py-1">Ubicación</th><th className="border px-2 py-1">Variant</th><th className="border px-2 py-1">Cantidad</th></tr>
          </thead>
          <tbody>
            {stocks.map(s => (
              <tr key={(s.ID || s.id) as any}>
                <td className="border px-2 py-1">{s.ID || s.id}</td>
                <td className="border px-2 py-1">{s.location}</td>
                <td className="border px-2 py-1">{(() => {
                  if (!s.variant_id) return "(producto)";
                  const v = variants.find(x => (x.ID || x.id) === s.variant_id);
                  if (!v) return `Variante ${s.variant_id}`;
                  return `${v.size ?? ""}${v.size && v.color ? " - " : ""}${v.color ?? ""}${(v as any).sku ? ` (${(v as any).sku})` : ""}`.trim();
                })()}</td>
                <td className="border px-2 py-1">{s.stock}</td>
              </tr>
            ))}
            {stocks.length === 0 && (<tr><td className="p-2" colSpan={4}>No hay stocks aún</td></tr>)}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Agregar stocks</h2>
        {rows.map((r, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <select className="border px-2 py-1" value={r.location} onChange={(e) => updateRow(idx, { location: e.target.value })}>
              {DEFAULT_LOCATIONS.map((loc) => {
                const used = usedSetExcluding(idx);
                // If variant selected, check specific combo
                const variantPart = r.variant_id ? `::${r.variant_id}` : "::_product_";
                const disabled = used.has(`${loc}${variantPart}`) && !(r.location === loc);
                return <option key={loc} value={loc} disabled={disabled}>{loc}</option>
              })}
            </select>
            <select className="border px-2 py-1 w-48" value={r.variant_id ?? ""} onChange={(e) => updateRow(idx, { variant_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="" disabled={usedSetExcluding(idx).has(`${r.location}::_product_`)}>Producto (sin variante)</option>
              {variants.map(v => {
                const vid = (v.ID ?? v.id) as number;
                const label = `${v.size ?? ""}${v.size && v.color ? " - " : ""}${v.color ?? ""}${(v as any).sku ? ` (${(v as any).sku})` : ""}`.trim();
                const disabled = usedSetExcluding(idx).has(`${r.location}::${vid}`) && r.variant_id !== vid;
                return <option key={vid} value={vid} disabled={disabled}>{label || `Variante ${vid}`}</option>;
              })}
            </select>
            <input className="border px-2 py-1 w-32" type="number" min={0} value={r.quantity} onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })} />
            <button className="text-red-600" onClick={() => removeRow(idx)}>Eliminar</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={addRow}>Añadir fila</button>
          <div className="flex-1" />
          <button className="bg-white px-3 py-1 rounded border" onClick={() => router.back()}>Cancelar</button>
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={submit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </section>
    </main>
  )
}
