"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Address {
  ID?: number;
  id?: number;
  user_id: number;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  street: string;
  floor?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  reference?: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const auth = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal para crear/editar dirección
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: "",
    recipient_name: "",
    recipient_phone: "",
    street: "",
    floor: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Argentina",
    reference: "",
    is_default: false
  });

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!auth?.loading && !auth?.user) {
      router.replace('/login?redirect=/perfil/direcciones');
      return;
    }

    if (auth?.user) {
      fetchAddresses(auth.user.id);
    }
  }, [auth?.user, auth?.loading, router]);

  const fetchAddresses = async (uid: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/addresses/user/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}: No se pudieron cargar las direcciones`);
      }
      
      const data = await res.json();
      setAddresses(data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label,
        recipient_name: address.recipient_name,
        recipient_phone: address.recipient_phone,
        street: address.street,
        floor: address.floor || "",
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        reference: address.reference || "",
        is_default: address.is_default
      });
    } else {
      setEditingAddress(null);
      setFormData({
        label: "",
        recipient_name: "",
        recipient_phone: "",
        street: "",
        floor: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Argentina",
        reference: "",
        is_default: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!auth?.user) {
      setError("No se pudo identificar al usuario");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingAddress 
        ? `${API_BASE}/addresses/${editingAddress.id || editingAddress.ID}`
        : `${API_BASE}/addresses`;
      
      const method = editingAddress ? "PUT" : "POST";
      const body = editingAddress 
        ? formData 
        : { ...formData, user_id: auth.user.id };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar la dirección");
      }

      setSuccessMessage(editingAddress ? "Dirección actualizada" : "Dirección creada");
      handleCloseModal();
      fetchAddresses(auth.user.id);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      const token = localStorage.getItem("token");
      const addressId = address.id || address.ID;
      const res = await fetch(`${API_BASE}/addresses/${addressId}/set-default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("No se pudo marcar como predeterminada");

      setSuccessMessage("Dirección marcada como predeterminada");
      if (auth?.user) {
        fetchAddresses(auth.user.id);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm("¿Estás seguro de eliminar esta dirección?")) return;

    try {
      const token = localStorage.getItem("token");
      const addressId = address.id || address.ID;
      const res = await fetch(`http://localhost:8080/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("No se pudo eliminar la dirección");

      setSuccessMessage("Dirección eliminada");
      if (auth?.user) {
        fetchAddresses(auth.user.id);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (auth?.loading || loading) {
    return (
      <div className="min-h-screen p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Cargando direcciones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/perfil')}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Mi Perfil
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis Direcciones de Envío</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Dirección
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-600 mb-4">No tienes direcciones guardadas</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Agregar primera dirección
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address.id || address.ID}
                className={`bg-white rounded-lg shadow p-6 ${address.is_default ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {address.label && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                          {address.label}
                        </span>
                      )}
                      {address.is_default && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-lg">{address.recipient_name}</p>
                    <p className="text-gray-600">{address.recipient_phone}</p>
                    <p className="text-gray-700 mt-2">
                      {address.street}
                      {address.floor && `, ${address.floor}`}
                    </p>
                    <p className="text-gray-700">
                      {address.city}, {address.state} ({address.postal_code})
                    </p>
                    <p className="text-gray-600">{address.country}</p>
                    {address.reference && (
                      <p className="text-gray-500 text-sm mt-2">
                        <span className="font-medium">Referencia:</span> {address.reference}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Marcar como predeterminada"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(address)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(address)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Dirección */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiqueta (opcional)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ej: Casa, Trabajo, Casa de mamá"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del destinatario *
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono del destinatario *
                  </label>
                  <input
                    type="tel"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y número *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Ej: Av. Corrientes 1234"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso/Depto (opcional)
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="Ej: Piso 3, Depto B"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    C.P. *
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias adicionales (opcional)
                </label>
                <textarea
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Ej: Casa esquina, portón verde"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_default || false}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Marcar como dirección predeterminada
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingAddress ? "Guardar Cambios" : "Crear Dirección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
