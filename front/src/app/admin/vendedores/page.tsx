"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "../../../utils/api";

export default function VendedoresAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("No se pudieron obtener los usuarios");
        return res.json();
      })
      .then(data => setUsers(data.filter((u: any) => ["vendedor", "encargado"].includes(u.role))))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // editable state per user
  const [edits, setEdits] = useState<Record<string, { active: boolean; working_from: string; working_to: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // initialize edits when users loaded
    const map: Record<string, { active: boolean; working_from: string; working_to: string }> = {};
    users.forEach(u => {
      map[String(u.id ?? u.ID ?? u.ID)] = {
        active: u.active ?? true,
        working_from: u.working_from ?? u.WorkingFrom ?? "",
        working_to: u.working_to ?? u.WorkingTo ?? "",
      };
    });
    setEdits(map);
  }, [users]);

  async function saveUser(u: any) {
    const id = u.id ?? u.ID ?? u.ID;
    const e = edits[String(id)];
    if (!e) return;
    setSaving(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ active: e.active, working_from: e.working_from, working_to: e.working_to }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      const updated = await res.json();
      setUsers(prev => prev.map(p => (p.id === updated.id || p.ID === updated.ID ? updated : p)));
      // small success indicator (could be expanded)
      setTimeout(() => setSaving(s => ({ ...s, [id]: false })), 700);
    } catch (err: any) {
      setSaving(s => ({ ...s, [id]: false }));
      alert(err?.message || "Error al guardar usuario");
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de vendedores y encargados</h1>
      <div className="mb-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-2 py-1 rounded w-64"
        />
        <Link href="/admin/vendedores/nuevo">
          <button className="bg-orange-600 text-white px-4 py-2 rounded font-semibold">Nuevo vendedor/encargado</button>
        </Link>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Rol</th>
              <th className="border px-2 py-1">Activo</th>
              <th className="border px-2 py-1">Desde</th>
              <th className="border px-2 py-1">Hasta</th>
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u =>
              u.name.toLowerCase().includes(search.toLowerCase()) ||
              u.email.toLowerCase().includes(search.toLowerCase())
            ).map(u => {
              const id = String(u.id ?? u.ID ?? u.ID);
              const e = edits[id] ?? { active: true, working_from: "", working_to: "" };
              return (
                <tr key={id}>
                  <td className="border px-2 py-1">{u.name}</td>
                  <td className="border px-2 py-1">{u.email}</td>
                  <td className="border px-2 py-1">{u.role}</td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={!!e.active}
                      onChange={ev => setEdits(prev => ({ ...prev, [id]: { ...e, active: ev.target.checked } }))}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={e.working_from}
                      onChange={ev => setEdits(prev => ({ ...prev, [id]: { ...e, working_from: ev.target.value } }))}
                      className="border px-2 py-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={e.working_to}
                      onChange={ev => setEdits(prev => ({ ...prev, [id]: { ...e, working_to: ev.target.value } }))}
                      className="border px-2 py-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                      onClick={() => saveUser(u)}
                      disabled={!!saving[id]}
                    >
                      {saving[id] ? "Guardando..." : "Guardar"}
                    </button>
                    <Link href={`/admin/vendedores/${id}`}>
                      <button className="bg-gray-200 px-3 py-1 rounded">Ver</button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
