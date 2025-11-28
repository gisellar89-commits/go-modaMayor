"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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

interface User {
  ID?: number;
  id?: number;
  name: string;
  email: string;
}

export default function UserAddressesAdminPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndAddresses();
  }, [userId]);

  const fetchUserAndAddresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch addresses
      const resAddresses = await fetch(`http://localhost:8080/addresses/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resAddresses.ok) {
        const errorData = await resAddresses.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${resAddresses.status}: No se pudieron cargar las direcciones`);
      }
      
      const addressesData = await resAddresses.json();
      setAddresses(addressesData || []);
      
      // Extract user info from addresses or fetch separately if needed
      if (addressesData && addressesData.length > 0) {
        // We'll set a basic user object, you might want to fetch full user details
        setUser({ name: "Usuario", email: "" } as User);
      }
      
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      const token = localStorage.getItem("token");
      const addressId = address.id || address.ID;
      const res = await fetch(`http://localhost:8080/addresses/${addressId}/set-default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("No se pudo marcar como predeterminada");

      setSuccessMessage("Dirección predeterminada actualizada");
      fetchUserAndAddresses();
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
      fetchUserAndAddresses();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
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
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/usuarios")}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a usuarios
          </button>
          <h1 className="text-2xl font-bold">Direcciones del Cliente</h1>
          <p className="text-gray-600">ID de usuario: {userId}</p>
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
            <p className="text-gray-600">Este cliente no tiene direcciones guardadas</p>
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
                        className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                        title="Marcar como predeterminada"
                      >
                        Predeterminada
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(address)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded hover:bg-red-50"
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
