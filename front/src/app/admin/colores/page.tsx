"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface Color {
  ID: number;
  key: string;
  name: string;
  hex: string;
  active: boolean;
}

export default function ColoresPage() {
  const auth = useAuth();
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);
  const [form, setForm] = useState({ key: "", name: "", hex: "#000000", active: true });

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/colors", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Error cargando colores");
      const data = await res.json();
      setColors(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/colors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Error creando color");
      setSuccess("Color creado exitosamente");
      setShowForm(false);
      setForm({ key: "", name: "", hex: "#000000", active: true });
      loadColors();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/colors/${editing.ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Error actualizando color");
      setSuccess("Color actualizado exitosamente");
      setShowForm(false);
      setEditing(null);
      setForm({ key: "", name: "", hex: "#000000", active: true });
      loadColors();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este color?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/colors/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Error eliminando color");
      setSuccess("Color eliminado");
      loadColors();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Colores</h1>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ key: "", name: "", hex: "#000000", active: true });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo Color
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color) => (
          <div key={color.ID} className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div
                className="w-16 h-16 rounded border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{color.name}</h3>
                <p className="text-sm text-gray-600">
                  Clave: <code className="bg-gray-100 px-1 rounded">{color.key}</code>
                </p>
                <p className="text-sm text-gray-600 font-mono">{color.hex}</p>
                <div className="mt-2">
                  {color.active ? (
                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button
                onClick={() => {
                  setEditing(color);
                  setForm({ 
                    key: color.key, 
                    name: color.name, 
                    hex: color.hex, 
                    active: color.active 
                  });
                  setShowForm(true);
                }}
                className="flex-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(color.ID)}
                className="flex-1 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {colors.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay colores registrados. Agrega el primero.
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Editar Color" : "Nuevo Color"}
            </h2>
            <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Clave *</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  required
                  placeholder="ej: negro, azul-marino"
                />
                <p className="text-xs text-gray-500 mt-1">Identificador único sin espacios</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  required
                  placeholder="ej: Negro, Azul Marino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color (Hex) *</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.hex}
                    onChange={(e) => setForm({ ...form, hex: e.target.value })}
                    className="w-16 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.hex}
                    onChange={(e) => setForm({ ...form, hex: e.target.value })}
                    className="flex-1 border px-3 py-2 rounded font-mono"
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Formato: #RRGGBB</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm">Activo</label>
              </div>
              
              {/* Preview */}
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: form.hex }}
                  />
                  <div>
                    <p className="font-medium">{form.name || "Nombre del color"}</p>
                    <p className="text-sm text-gray-600 font-mono">{form.hex}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
