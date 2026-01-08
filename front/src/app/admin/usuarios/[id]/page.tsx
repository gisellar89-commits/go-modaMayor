"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface User {
  ID?: number;
  id?: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  working_from?: string;
  working_to?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("No se pudo cargar el usuario");
      
      const data = await res.json();
      setUser(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "vendedor": return "bg-blue-100 text-blue-800";
      case "encargado": return "bg-green-100 text-green-800";
      case "cliente": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Cargando usuario...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Usuario no encontrado"}
          </div>
          <button
            onClick={() => router.push("/admin/usuarios")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Detalle de Usuario</h1>
            <div className="flex gap-2">
              {user.role === "cliente" && (
                <button
                  onClick={() => router.push(`/admin/usuarios/${userId}/direcciones`)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ver Direcciones
                </button>
              )}
              <button
                onClick={() => router.push("/admin/usuarios")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* Información Principal */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Rol</label>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Estado</label>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {user.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ID</label>
                <p className="text-gray-900">{user.id || user.ID}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Teléfono</label>
                <p className="text-gray-900">{user.phone || "-"}</p>
              </div>

              {/* Fecha de creación */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Fecha de registro</label>
                <p className="text-gray-900">{formatDate(user.CreatedAt)}</p>
              </div>

              {/* Última actualización */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Última actualización</label>
                <p className="text-gray-900">{formatDate(user.UpdatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Horario de Trabajo (solo para vendedores) */}
        {(user.role === "vendedor" || user.role === "encargado") && (user.working_from || user.working_to) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Horario de Trabajo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Desde</label>
                <p className="text-lg font-semibold text-gray-900">{user.working_from || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Hasta</label>
                <p className="text-lg font-semibold text-gray-900">{user.working_to || "-"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/admin/usuarios")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Usuario
            </button>
            
            {user.role === "cliente" && (
              <button
                onClick={() => router.push(`/admin/usuarios/${userId}/direcciones`)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver Direcciones
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
                  // Implementar lógica de eliminación
                  router.push("/admin/usuarios");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
