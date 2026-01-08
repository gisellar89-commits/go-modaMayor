'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HomeSectionConfig {
  id: number;
  section_key: string;
  title: string;
  enabled: boolean;
  display_order: number;
  limit_products: number;
  show_mode: 'manual' | 'auto' | 'both';
}

const SECTION_ICONS: Record<string, string> = {
  new_arrivals: '🆕',
  featured: '⭐',
  offers: '🏷️',
  trending: '🔥',
  bestsellers: '👑',
};

const SECTION_COLORS: Record<string, string> = {
  new_arrivals: 'bg-blue-500',
  featured: 'bg-yellow-500',
  offers: 'bg-red-500',
  trending: 'bg-orange-500',
  bestsellers: 'bg-purple-500',
};

export default function ConfigSeccionesHome() {
  const router = useRouter();
  const [configs, setConfigs] = useState<HomeSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<HomeSectionConfig | null>(null);
  const [newSection, setNewSection] = useState({
    section_key: '',
    title: '',
    limit_products: 12,
    show_mode: 'both' as 'manual' | 'auto' | 'both',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:8080/settings/home_section_configs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setConfigs(data.sort((a: HomeSectionConfig, b: HomeSectionConfig) => a.display_order - b.display_order));
    } catch (err) {
      console.error(err);
      showMessage('error', 'Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleToggleEnabled = (id: number) => {
    setConfigs(prev =>
      prev.map(config =>
        config.id === id ? { ...config, enabled: !config.enabled } : config
      )
    );
  };

  const handleUpdateField = (id: number, field: keyof HomeSectionConfig, value: any) => {
    setConfigs(prev =>
      prev.map(config =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newConfigs = [...configs];
    [newConfigs[index - 1], newConfigs[index]] = [newConfigs[index], newConfigs[index - 1]];
    newConfigs.forEach((config, idx) => {
      config.display_order = idx + 1;
    });
    setConfigs(newConfigs);
  };

  const handleMoveDown = (index: number) => {
    if (index === configs.length - 1) return;
    const newConfigs = [...configs];
    [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
    newConfigs.forEach((config, idx) => {
      config.display_order = idx + 1;
    });
    setConfigs(newConfigs);
  };

  const handleCreateSection = async () => {
    if (!newSection.section_key.trim() || !newSection.title.trim()) {
      showMessage('error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:8080/settings/home_section_configs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_key: newSection.section_key.trim(),
          title: newSection.title.trim(),
          enabled: true,
          display_order: configs.length + 1,
          limit_products: newSection.limit_products,
          show_mode: newSection.show_mode,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear la sección');
      }

      showMessage('success', '✅ Sección creada correctamente');
      setShowCreateModal(false);
      setNewSection({ section_key: '', title: '', limit_products: 12, show_mode: 'both' });
      loadConfigs();
    } catch (err: any) {
      console.error(err);
      showMessage('error', err.message);
    }
  };

  const handleDeleteSection = async () => {
    if (!selectedConfig) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`http://localhost:8080/settings/home_section_configs/${selectedConfig.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Error al eliminar la sección');

      showMessage('success', '✅ Sección eliminada correctamente');
      setShowDeleteModal(false);
      setSelectedConfig(null);
      loadConfigs();
    } catch (err) {
      console.error(err);
      showMessage('error', '❌ Error al eliminar la sección');
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const promises = configs.map(config =>
        fetch(`http://localhost:8080/settings/home_section_configs/${config.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: config.title,
            enabled: config.enabled,
            display_order: config.display_order,
            limit_products: config.limit_products,
            show_mode: config.show_mode,
          }),
        })
      );

      await Promise.all(promises);
      showMessage('success', '✅ Configuraciones guardadas correctamente');
      loadConfigs();
    } catch (err) {
      console.error(err);
      showMessage('error', '❌ Error al guardar las configuraciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-xl text-gray-600">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-8">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración de Secciones del Home</h1>
              <p className="text-gray-600 mt-1">
                Gestiona qué secciones se muestran, su orden y límite de productos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                ➕ Nueva Sección
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {message && (
            <div
              className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
                message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white font-semibold animate-slide-in`}
            >
              {message.text}
            </div>
          )}

          {/* Configs List */}
          <div className="space-y-4">
            {configs.map((config, index) => (
              <div
                key={`config-${config.id}-${index}`}
                className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                  SECTION_COLORS[config.section_key] || 'border-gray-400'
                } transition-all ${config.enabled ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-6">
                  {/* Icon & Toggle */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">
                      {SECTION_ICONS[config.section_key] || '📦'}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => handleToggleEnabled(config.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                    <span className="text-xs text-gray-600 font-medium">
                      {config.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Config Fields */}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => handleUpdateField(config.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Clave de Sección
                      </label>
                      <input
                        type="text"
                        value={config.section_key}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Límite de Productos
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={config.limit_products}
                        onChange={(e) =>
                          handleUpdateField(config.id, 'limit_products', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Modo de Visualización
                      </label>
                      <select
                        value={config.show_mode}
                        onChange={(e) =>
                          handleUpdateField(config.id, 'show_mode', e.target.value as 'manual' | 'auto' | 'both')
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="manual">Manual (curación)</option>
                        <option value="auto">Automático (tags)</option>
                        <option value="both">Ambos (combinado)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reorder & Delete Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Subir"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === configs.length - 1}
                      className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Bajar"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <span className="font-semibold">Orden de visualización:</span> #{config.display_order}
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Ayuda</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Manual:</strong> Mostrar solo productos agregados manualmente en la sección</li>
              <li><strong>Automático:</strong> Mostrar productos basados en tags (nuevos ingresos, destacados, etc.)</li>
              <li><strong>Ambos:</strong> Combinar productos manuales con automáticos hasta alcanzar el límite</li>
              <li><strong>Límite de productos:</strong> Cantidad máxima de productos a mostrar en esa sección</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Crear Nueva Sección */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">➕ Nueva Sección</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Clave de Sección *
                </label>
                <input
                  type="text"
                  value={newSection.section_key}
                  onChange={(e) => setNewSection({ ...newSection, section_key: e.target.value })}
                  placeholder="ej: custom_section"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Identificador único sin espacios</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="ej: Mi Sección"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Límite de Productos
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newSection.limit_products}
                  onChange={(e) => setNewSection({ ...newSection, limit_products: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Modo de Visualización
                </label>
                <select
                  value={newSection.show_mode}
                  onChange={(e) => setNewSection({ ...newSection, show_mode: e.target.value as 'manual' | 'auto' | 'both' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="manual">Manual (curación)</option>
                  <option value="auto">Automático (tags)</option>
                  <option value="both">Ambos (combinado)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateSection}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Crear Sección
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSection({ section_key: '', title: '', limit_products: 12, show_mode: 'both' });
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {showDeleteModal && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Eliminar Sección</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar la sección <strong>"{selectedConfig.section_key}"</strong>?
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteSection}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedConfig(null);
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
