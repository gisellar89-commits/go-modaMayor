"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
}

export default function PerfilPage() {
  const auth = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Formulario de edición
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Si no está autenticado, redirigir a login
    if (!auth?.loading && !auth?.user) {
      router.replace('/login?redirect=/perfil');
      return;
    }

    if (auth?.user) {
      loadProfile();
    }
  }, [auth?.user, auth?.loading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Error al cargar perfil');
      }

      const data = await res.json();
      setProfile(data);
      setName(data.name);
      setPhone(data.phone || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      setMessage({ type: 'error', text: 'Error al cargar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'El nombre es obligatorio' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      
      // Actualizar también el contexto de auth
      if (auth?.refreshUser) {
        await auth.refreshUser();
      }

      setMessage({ type: 'success', text: '✓ Perfil actualizado correctamente' });
      setEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Error al actualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setEditing(false);
    setMessage(null);
  };

  // Traducción de roles
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      encargado: 'Encargado',
      vendedor: 'Vendedor',
      cliente: 'Cliente',
    };
    return roles[role] || role;
  };

  if (auth?.loading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">No se pudo cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      {/* Mensaje de éxito/error */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {!editing ? (
          // Vista de solo lectura
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-lg text-gray-900">{profile.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-900">{profile.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Teléfono</label>
                  <p className="text-lg text-gray-900">{profile.phone || 'No especificado'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de cuenta</label>
                  <p className="text-lg">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        profile.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : profile.role === 'encargado'
                          ? 'bg-blue-100 text-blue-800'
                          : profile.role === 'vendedor'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getRoleLabel(profile.role)}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Editar perfil
              </button>
            </div>

            {/* Información adicional */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Información de la cuenta</h3>
              <p className="text-sm text-gray-600">
                Tu email no puede ser modificado. Si necesitás cambiarlo, contactá al administrador.
              </p>
            </div>
          </div>
        ) : (
          // Formulario de edición
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">El email no puede ser modificado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sección de direcciones */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mis Direcciones</h2>
          <button
            onClick={() => router.push('/perfil/direcciones')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Gestionar direcciones
          </button>
        </div>
        <p className="text-gray-600">
          Gestioná tus direcciones de envío para hacer tus compras más rápidamente.
        </p>
      </div>

      {/* Sección de pedidos (si es cliente) */}
      {profile.role === 'cliente' && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Mis Pedidos</h2>
          <p className="text-gray-600 mb-4">
            Próximamente podrás ver el historial de tus pedidos aquí.
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver productos
          </button>
        </div>
      )}

      {/* Panel de admin */}
      {(profile.role === 'admin' || profile.role === 'encargado') && (
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md p-6 border border-purple-200">
          <h2 className="text-xl font-semibold mb-2 text-purple-900">Panel de Administración</h2>
          <p className="text-gray-700 mb-4">
            Tenés acceso al panel de administración del sistema.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ir al panel de admin
          </button>
        </div>
      )}
    </div>
  );
}
