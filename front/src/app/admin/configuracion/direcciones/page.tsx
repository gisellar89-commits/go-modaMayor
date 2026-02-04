"use client";

import { useState, useEffect } from "react";

interface ContactAddress {
  id?: number;
  name: string;
  address: string;
  business_hours: string;
  display_order: number;
}

export default function DireccionesPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [addresses, setAddresses] = useState<ContactAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<ContactAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/contact/addresses`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar direcciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (address: ContactAddress) => {
    const token = localStorage.getItem("token");
    try {
      const isEdit = address.id;
      const url = isEdit 
        ? `${API_URL}/settings/contact/addresses/${address.id}`
        : `${API_URL}/settings/contact/addresses`;
      
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(address),
      });

      if (!res.ok) throw new Error("Error al guardar");

      setMessage({type: "success", text: `Dirección ${isEdit ? 'actualizada' : 'creada'} correctamente`});
      fetchAddresses();
      setShowForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Error:", error);
      setMessage({type: "error", text: "Error al guardar la dirección"});
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/settings/contact/addresses/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar");

      setMessage({type: "success", text: "Dirección eliminada"});
      fetchAddresses();
    } catch (error) {
      console.error("Error:", error);
      setMessage({type: "error", text: "Error al eliminar"});
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-600">Cargando...</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
        Direcciones / Sucursales
      </h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 border border-green-200 text-green-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 text-sm">Gestiona las direcciones físicas de tus sucursales que se mostrarán en el sitio</p>
          <button
            onClick={() => {
              setEditingAddress({ name: "", address: "", business_hours: "", display_order: addresses.length });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
          >
            + Agregar Dirección
          </button>
        </div>

        {/* Lista de direcciones */}
        <div className="space-y-3 mt-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start hover:border-pink-300 transition-colors">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{addr.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                {addr.business_hours && (
                  <p className="text-sm text-gray-500 mt-1">🕐 {addr.business_hours}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Orden: {addr.display_order}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingAddress(addr);
                    setShowForm(true);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => addr.id && handleDelete(addr.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500">No hay direcciones configuradas</p>
              <p className="text-gray-400 text-sm mt-1">Agrega tu primera dirección para mostrarla en el sitio</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar */}
      {showForm && editingAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingAddress.id ? "Editar" : "Nueva"} Dirección
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la sucursal *
                </label>
                <input
                  type="text"
                  value={editingAddress.name}
                  onChange={(e) => setEditingAddress({...editingAddress, name: e.target.value})}
                  placeholder="Ej: Sucursal Centro, Local Once, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección completa *
                </label>
                <textarea
                  value={editingAddress.address}
                  onChange={(e) => setEditingAddress({...editingAddress, address: e.target.value})}
                  placeholder="Av. Corrientes 1234, CABA, Argentina"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de atención
                </label>
                <input
                  type="text"
                  value={editingAddress.business_hours}
                  onChange={(e) => setEditingAddress({...editingAddress, business_hours: e.target.value})}
                  placeholder="Lun - Vie: 9:00 - 18:00hs"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={editingAddress.display_order}
                  onChange={(e) => setEditingAddress({...editingAddress, display_order: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(editingAddress)}
                disabled={!editingAddress.name || !editingAddress.address}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
