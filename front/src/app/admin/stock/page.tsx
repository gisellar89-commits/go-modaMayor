"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchProducts, Product, LocationStock } from "../../../utils/api";

export default function StockAdminPage() {
  // Guardar todos los cambios de stock
  const handleSaveAll = async () => {
    setSaving("all");
    let ok = 0, error = 0;
    for (const stockId of Object.keys(editStock)) {
      const newValue = editStock[stockId];
      const product = products.find(p => p.location_stocks.some((s: any) => String(s.id) === stockId));
      const stock = product?.location_stocks.find((s: any) => String(s.id) === stockId);
      if (!product || !stock || stock.stock === newValue) continue;
      try {
  const token = localStorage.getItem("token") ?? undefined;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${API_URL}/location_stock/${stockId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ stock: newValue }),
        });
        if (!res.ok) throw new Error();
        setProducts(products => products.map(p => ({
          ...p,
          location_stocks: p.location_stocks.map((s: any) => s.id === stock.id ? { ...s, stock: newValue } : s)
        })));
        setFeedback(fb => ({ ...fb, [stockId]: "ok" }));
        ok++;
      } catch {
        setFeedback(fb => ({ ...fb, [stockId]: "error" }));
        error++;
      }
    }
    setSaving(null);
    setTimeout(() => setFeedback({}), 2000);
    alert(`Guardado: ${ok}, Errores: ${error}`);
  };
  // Estado para edición de stock
  const [editStock, setEditStock] = useState<{[key: string]: number}>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{[key: string]: string}>({});

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? false;

  useEffect(() => {
    if (!user || !["admin", "encargado", "vendedor"].includes(user.role)) return;
  const token = localStorage.getItem("token") ?? undefined;
    fetchProducts(token)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <main>Cargando...</main>;
  if (!user || !["admin", "encargado", "vendedor"].includes(user.role)) return <main>No tienes permisos para ver esta página.</main>;
  if (error) return <main className="text-red-500">{error}</main>;

  // Obtener ubicaciones únicas
  const ubicacionesSet = new Set<string>();
  products.forEach((product) => {
    ((product.location_stocks || []) as LocationStock[]).forEach((stock) => {
      if (stock.location) ubicacionesSet.add(stock.location);
    });
  });
  const ubicaciones = Array.from(ubicacionesSet);

  // Filtrar productos y variantes según búsqueda y ubicación
  const productosFiltrados = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.variants || []).some((v: any) => v.sku && v.sku.toLowerCase().includes(search.toLowerCase()))
    )
      .map((product) => ({
      ...product,
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        location_stocks: ((product.location_stocks || []) as LocationStock[]).filter((stock) =>
          (stock.variant_id === variant.ID || stock.variant_id === variant.id) &&
          (ubicacion ? stock.location === ubicacion : true)
        ),
      })),
    }));

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de stock por ubicación y variante</h1>
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-2 py-1 rounded w-64"
        />
        <select
          value={ubicacion}
          onChange={e => setUbicacion(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Todas las ubicaciones</option>
          {ubicaciones.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      {productosFiltrados.length === 0 ? (
        <div>No hay productos para mostrar.</div>
      ) : (
        <>
          {user && ["admin", "encargado"].includes(user.role) && (
            <div className="mb-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
                disabled={saving === "all"}
                onClick={handleSaveAll}
              >Guardar todos</button>
            </div>
          )}
          <div className="space-y-8">
            {productosFiltrados.map((product) => (
              <div key={product.ID || product.id} className="border rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <div className="mb-2 text-gray-600">{product.description}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Variante</th>
                        <th className="border px-2 py-1">Talle</th>
                        <th className="border px-2 py-1">Color</th>
                        <th className="border px-2 py-1">SKU</th>
                        <th className="border px-2 py-1">Ubicación</th>
                        <th className="border px-2 py-1">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((variant: any) => (
                          <React.Fragment key={variant.ID || variant.id}>
                            {(variant.location_stocks || []).map((stock: any) => (
                              <tr key={variant.ID + "-" + stock.location}>
                                <td className="border px-2 py-1">{variant.ID || variant.id}</td>
                                <td className="border px-2 py-1">{variant.size}</td>
                                <td className="border px-2 py-1">{variant.color}</td>
                                <td className="border px-2 py-1">{variant.sku}</td>
                                <td className="border px-2 py-1">{stock.location}</td>
                                <td className={`border px-2 py-1 ${saving === String(stock.id) ? "bg-yellow-100" : feedback[stock.id] === "ok" ? "bg-green-100" : feedback[stock.id] === "error" ? "bg-red-100" : ""}`}>
                                  {user && ["admin", "encargado"].includes(user.role) ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min={0}
                                        value={editStock[stock.id] !== undefined ? editStock[stock.id] : stock.stock}
                                        onChange={e => setEditStock({ ...editStock, [stock.id]: Number(e.target.value) })}
                                        className="border px-1 py-0.5 w-16 rounded"
                                      />
                                      <button
                                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                        disabled={saving === String(stock.id) || editStock[stock.id] === stock.stock}
                                        onClick={async () => {
                                          setSaving(String(stock.id));
                                          setFeedback(fb => ({ ...fb, [stock.id]: "" }));
                                          try {
                                            const token = localStorage.getItem("token") ?? undefined;
                                            const res = await fetch(`${API_URL}/location_stock/${stock.id}`, {
                                              method: "PUT",
                                              headers: {
                                                "Content-Type": "application/json",
                                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                              },
                                              body: JSON.stringify({ stock: editStock[stock.id] }),
                                            });
                                            if (!res.ok) throw new Error("No se pudo actualizar el stock");
                                            setProducts(products => products.map(p => ({
                                              ...p,
                                              location_stocks: p.location_stocks.map((s: any) => s.id === stock.id ? { ...s, stock: editStock[stock.id] } : s)
                                            })));
                                            setFeedback(fb => ({ ...fb, [stock.id]: "ok" }));
                                          } catch (e) {
                                            setFeedback(fb => ({ ...fb, [stock.id]: "error" }));
                                          } finally {
                                            setSaving(null);
                                            setTimeout(() => setFeedback(fb => ({ ...fb, [stock.id]: "" })), 2000);
                                          }
                                        }}
                                      >Guardar</button>
                                      {feedback[stock.id] === "ok" && <span className="text-green-600 text-xs">Guardado</span>}
                                      {feedback[stock.id] === "error" && <span className="text-red-600 text-xs">Error</span>}
                                    </div>
                                  ) : (
                                    stock.stock
                                  )}
                                </td>
                              </tr>
                            ))}
                            {/* UI para agregar stock en ubicaciones nuevas */}
                            {user && ["admin", "encargado"].includes(user.role) && (
                              ubicaciones.filter(u => !(variant.location_stocks || []).some((s: any) => s.location === u)).map(u => (
                                <tr key={variant.ID + "-add-" + u} className="bg-yellow-50">
                                  <td className="border px-2 py-1">{variant.ID || variant.id}</td>
                                  <td className="border px-2 py-1">{variant.size}</td>
                                  <td className="border px-2 py-1">{variant.color}</td>
                                  <td className="border px-2 py-1">{variant.sku}</td>
                                  <td className="border px-2 py-1">{u}</td>
                                  <td className="border px-2 py-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min={0}
                                        value={editStock[`${variant.ID || variant.id}-add-${u}`] || ""}
                                        onChange={e => setEditStock({ ...editStock, [`${variant.ID || variant.id}-add-${u}`]: Number(e.target.value) })}
                                        className="border px-1 py-0.5 w-16 rounded"
                                      />
                                      <button
                                        className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                                        disabled={saving === `${variant.ID || variant.id}-add-${u}` || !editStock[`${variant.ID || variant.id}-add-${u}`]}
                                        onClick={async () => {
                                          setSaving(`${variant.ID || variant.id}-add-${u}`);
                                          setFeedback(fb => ({ ...fb, [`${variant.ID || variant.id}-add-${u}`]: "" }));
                                          try {
                                            const token = localStorage.getItem("token") ?? undefined;
                                            const res = await fetch(`http://localhost:8080/variants/${variant.ID || variant.id}/stock`, {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                              },
                                              body: JSON.stringify({ location: u, stock: editStock[`${variant.ID || variant.id}-add-${u}`] }),
                                            });
                                            if (!res.ok) throw new Error("No se pudo agregar el stock");
                                            // Actualizar productos (idealmente refetch, aquí solo feedback)
                                            setFeedback(fb => ({ ...fb, [`${variant.ID || variant.id}-add-${u}`]: "ok" }));
                                          } catch (e) {
                                            setFeedback(fb => ({ ...fb, [`${variant.ID || variant.id}-add-${u}`]: "error" }));
                                          } finally {
                                            setSaving(null);
                                            setTimeout(() => setFeedback(fb => ({ ...fb, [`${variant.ID || variant.id}-add-${u}`]: "" })), 2000);
                                          }
                                        }}
                                      >Agregar</button>
                                      {feedback[`${variant.ID || variant.id}-add-${u}`] === "ok" && <span className="text-green-600 text-xs">Agregado</span>}
                                      {feedback[`${variant.ID || variant.id}-add-${u}`] === "error" && <span className="text-red-600 text-xs">Error</span>}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr><td colSpan={6} className="border px-2 py-1 text-center text-gray-400">Sin variantes</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
