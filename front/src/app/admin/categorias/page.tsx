"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CategoriasAdmin() {
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleEdit = (cat: any) => {
    setEditId(cat.id || cat.ID);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!editName.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo editar la categoría");
      setSuccess("Categoría editada exitosamente");
      setEditId(null);
      setEditName("");
      setEditDescription("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    setError(null);
    setSuccess(null);
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la categoría");
      setSuccess("Categoría eliminada exitosamente");
    } catch (e: any) {
      setError(e.message);
    }
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const _token = localStorage.getItem("token") ?? undefined;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      headers: _token ? { Authorization: `Bearer ${_token}` } : {}
    })
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la categoría");
      setSuccess("Categoría creada exitosamente");
      setName("");
      setDescription("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <section className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Administrar categorías</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <input type="text" placeholder="Nombre de categoría" value={name} onChange={e => setName(e.target.value)} required className="border px-2 py-1 text-gray-900 placeholder:text-gray-400" />
        <input type="text" placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} className="border px-2 py-1 text-gray-900 placeholder:text-gray-400" />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Crear categoría</button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
      <h3 className="text-lg font-semibold mb-2 text-gray-900">Listado de categorías</h3>
      <ul className="border rounded divide-y">
        {categories.map(cat => (
          <li key={cat.id || cat.ID} className="p-2 flex items-center justify-between gap-1">
            {editId === (cat.id || cat.ID) ? (
              <form onSubmit={handleEditSubmit} className="flex items-center gap-2 w-full">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required className="border px-2 py-1 text-gray-900" />
                <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} className="border px-2 py-1 text-gray-900" />
                <div className="flex gap-2 ml-auto">
                  <button type="submit" className="bg-green-600 text-white px-2 py-1 rounded">Guardar</button>
                  <button type="button" className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditId(null)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{cat.name}</span>
                  <span className="text-sm text-gray-600">{cat.description}</span>
                </div>
                <div className="flex gap-2 ml-auto">
                  <button className="p-1" title="Editar" onClick={() => handleEdit(cat)}>
                    <Image src="/edit.svg" alt="Editar" width={20} height={20} />
                  </button>
                  <button className="p-1" title="Eliminar" onClick={() => handleDelete(cat.id || cat.ID)}>
                    <Image src="/trash.svg" alt="Eliminar" width={20} height={20} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
