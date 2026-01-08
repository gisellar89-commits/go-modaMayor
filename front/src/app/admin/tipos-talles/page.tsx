"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface SizeValue {
  ID: number;
  size_type_id: number;
  value: string;
  ordinal: number;
}

interface SizeType {
  ID: number;
  key: string;
  name: string;
  description?: string;
  is_singleton: boolean;
  values?: SizeValue[];
}

export default function TiposTallesPage() {
  const auth = useAuth();
  const [sizeTypes, setSizeTypes] = useState<SizeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados del formulario de tipo de talle
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<SizeType | null>(null);
  const [formType, setFormType] = useState({ key: "", name: "", description: "", is_singleton: false });
  
  // Estados del formulario de valores
  const [showValueForm, setShowValueForm] = useState(false);
  const [editingValue, setEditingValue] = useState<SizeValue | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [formValue, setFormValue] = useState({ value: "", ordinal: 0 });

  useEffect(() => {
    loadSizeTypes();
  }, []);

  const loadSizeTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/size-types", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Error cargando tipos de talles");
      const data = await res.json();
      setSizeTypes(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/size-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formType)
      });
      if (!res.ok) throw new Error("Error creando tipo de talle");
      setSuccess("Tipo de talle creado exitosamente");
      setShowTypeForm(false);
      setFormType({ key: "", name: "", description: "", is_singleton: false });
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/size-types/${editingType.ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formType)
      });
      if (!res.ok) throw new Error("Error actualizando tipo de talle");
      setSuccess("Tipo de talle actualizado exitosamente");
      setShowTypeForm(false);
      setEditingType(null);
      setFormType({ key: "", name: "", description: "", is_singleton: false });
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este tipo de talle?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/size-types/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Error eliminando tipo de talle");
      setSuccess("Tipo de talle eliminado");
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/size-values", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formValue, size_type_id: selectedTypeId })
      });
      if (!res.ok) throw new Error("Error creando valor");
      setSuccess("Valor agregado exitosamente");
      setShowValueForm(false);
      setFormValue({ value: "", ordinal: 0 });
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingValue || !selectedTypeId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/size-values/${editingValue.ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formValue, size_type_id: selectedTypeId })
      });
      if (!res.ok) throw new Error("Error actualizando valor");
      setSuccess("Valor actualizado exitosamente");
      setShowValueForm(false);
      setEditingValue(null);
      setFormValue({ value: "", ordinal: 0 });
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteValue = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este valor?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/size-values/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Error eliminando valor");
      setSuccess("Valor eliminado");
      loadSizeTypes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de Talles</h1>
        <button
          onClick={() => {
            setEditingType(null);
            setFormType({ key: "", name: "", description: "", is_singleton: false });
            setShowTypeForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo Tipo
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

      <div className="grid gap-4">
        {sizeTypes.map((type) => (
          <div key={type.ID} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                <p className="text-sm text-gray-600">Clave: <code className="bg-gray-100 px-1 rounded">{type.key}</code></p>
                {type.description && <p className="text-sm text-gray-500 mt-1">{type.description}</p>}
                {type.is_singleton && <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Talle único</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingType(type);
                    setFormType({ 
                      key: type.key, 
                      name: type.name, 
                      description: type.description || "", 
                      is_singleton: type.is_singleton 
                    });
                    setShowTypeForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteType(type.ID)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm text-gray-700">Valores:</h4>
                <button
                  onClick={() => {
                    setSelectedTypeId(type.ID);
                    setEditingValue(null);
                    setFormValue({ value: "", ordinal: (type.values?.length || 0) + 1 });
                    setShowValueForm(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar valor
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {type.values && type.values.length > 0 ? (
                  type.values.map((val) => (
                    <div key={val.ID} className="bg-gray-100 px-3 py-1 rounded flex items-center gap-2">
                      <span className="font-medium text-gray-900">{val.value}</span>
                      <span className="text-xs text-gray-500">(orden: {val.ordinal})</span>
                      <button
                        onClick={() => {
                          setSelectedTypeId(type.ID);
                          setEditingValue(val);
                          setFormValue({ value: val.value, ordinal: val.ordinal });
                          setShowValueForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteValue(val.ID)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">Sin valores</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para tipo de talle */}
      {showTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingType ? "Editar Tipo de Talle" : "Nuevo Tipo de Talle"}
            </h2>
            <form onSubmit={editingType ? handleUpdateType : handleCreateType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Clave *</label>
                <input
                  type="text"
                  value={formType.key}
                  onChange={(e) => setFormType({ ...formType, key: e.target.value })}
                  className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
                  required
                  placeholder="ej: letras, numericos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Nombre *</label>
                <input
                  type="text"
                  value={formType.name}
                  onChange={(e) => setFormType({ ...formType, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
                  required
                  placeholder="ej: Letras (S/M/L)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Descripción</label>
                <textarea
                  value={formType.description}
                  onChange={(e) => setFormType({ ...formType, description: e.target.value })}
                  className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
                  rows={2}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_singleton"
                  checked={formType.is_singleton}
                  onChange={(e) => setFormType({ ...formType, is_singleton: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_singleton" className="text-sm text-gray-900">Talle único (sin variantes)</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeForm(false);
                    setEditingType(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingType ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para valor */}
      {showValueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingValue ? "Editar Valor" : "Nuevo Valor"}
            </h2>
            <form onSubmit={editingValue ? handleUpdateValue : handleCreateValue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Valor *</label>
                <input
                  type="text"
                  value={formValue.value}
                  onChange={(e) => setFormValue({ ...formValue, value: e.target.value })}
                  className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
                  required
                  placeholder="ej: M, 42, XL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Orden de visualización</label>
                <input
                  type="number"
                  value={formValue.ordinal}
                  onChange={(e) => setFormValue({ ...formValue, ordinal: Number(e.target.value) })}
                  className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
                  placeholder="1, 2, 3..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowValueForm(false);
                    setEditingValue(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingValue ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
