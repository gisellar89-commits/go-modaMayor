"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function AnunciosAdminPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/ads", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("No se pudieron obtener los anuncios");
        return res.json();
      })
      .then(setAds)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de anuncios y videos</h1>
      <div className="mb-4 flex gap-4 items-center">
        <Link href="/admin/anuncios/nuevo">
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">Nuevo anuncio/video</button>
        </Link>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : ads.length === 0 ? (
        <div>No hay anuncios ni videos registrados.</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Título</th>
              <th className="border px-2 py-1">Tipo</th>
              <th className="border px-2 py-1">Activo</th>
              <th className="border px-2 py-1">Destacado</th>
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.ID || ad.id}>
                <td className="border px-2 py-1">{ad.title}</td>
                <td className="border px-2 py-1">{ad.type}</td>
                <td className="border px-2 py-1">{ad.active ? "Sí" : "No"}</td>
                <td className="border px-2 py-1">{ad.featured ? "Sí" : "No"}</td>
                <td className="border px-2 py-1">
                  <Link href={`/admin/anuncios/${ad.ID || ad.id}/editar`}>
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Editar</button>
                  </Link>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => {/* eliminar anuncio */}}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
