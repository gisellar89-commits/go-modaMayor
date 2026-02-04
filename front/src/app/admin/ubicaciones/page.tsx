"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface Location {
  ID: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  display_order: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export default function LocationsAdminPage() {
  const auth = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
    display_order: 0
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/locations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Error al cargar ubicaciones");
      
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      active: true,
      display_order: locations.length + 1
    });
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (location: Location) => {
    setFormData({
      code: location.code,
      name: location.name,
      description: location.description || "",
      active: location.active,
      display_order: location.display_order
    });
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingLocation
        ? `${API_URL}/admin/locations/${editingLocation.ID}`
        : `${API_URL}/admin/locations`;
      
      const method = editingLocation ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar ubicación");
      }

      setSuccess(editingLocation ? "Ubicación actualizada correctamente" : "Ubicación creada correctamente");
      closeModal();
      loadLocations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ubicación?")) return;

    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/locations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar ubicación");
      }

      setSuccess("Ubicación eliminada correctamente");
      loadLocations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando ubicaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Ubicaciones</h1>
            <p className="text-gray-600 mt-1">Administra las ubicaciones físicas para control de stock</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-pink-600 transition-all shadow-lg"
          >
            + Nueva Ubicación
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay ubicaciones registradas
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr key={location.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {location.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {location.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {location.description || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          location.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {location.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(location.ID)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ej: deposito"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código único para identificar la ubicación (sin espacios)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ej: Depósito Central"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
                  placeholder="Descripción opcional de la ubicación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Ubicación activa
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-pink-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-pink-600 transition-all"
                >
                  {editingLocation ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
