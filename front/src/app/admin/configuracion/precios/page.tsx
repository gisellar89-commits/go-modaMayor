'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PriceTier {
  ID?: number;
  name: string;
  display_name: string;
  formula_type: 'multiplier' | 'percentage_markup' | 'flat_amount';
  multiplier: number;
  percentage: number;
  flat_amount: number;
  min_quantity: number;
  order_index: number;
  active: boolean;
  description: string;
  is_default: boolean;
  show_in_public: boolean;
  color_code: string;
}

export default function PreciosConfigPage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<{
    total_products: number;
    updated: number;
    errors: number;
    tiers_applied: number;
  } | null>(null);
  const [formData, setFormData] = useState<PriceTier>({
    name: '',
    display_name: '',
    formula_type: 'multiplier',
    multiplier: 1.0,
    percentage: 0.0,
    flat_amount: 0.0,
    min_quantity: 0,
    order_index: 1,
    active: true,
    description: '',
    is_default: false,
    show_in_public: true,
    color_code: '#3B82F6',
  });

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'encargado')) {
      router.push('/login');
      return;
    }
    loadTiers();
  }, [user, router]);

  const loadTiers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/price-tiers?include_inactive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setTiers(data.tiers || []);
    } catch (error) {
      console.error('Error al cargar niveles de precio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingTier
        ? `${process.env.NEXT_PUBLIC_API_URL}/settings/price-tiers/${editingTier.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL}/settings/price-tiers`;
      
      const method = editingTier ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert('Error: ' + (error.error || 'No se pudo guardar'));
        return;
      }

      alert(editingTier ? 'Nivel de precio actualizado' : 'Nivel de precio creado');
      setShowModal(false);
      setEditingTier(null);
      loadTiers();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este nivel de precio?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/price-tiers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert('Error: ' + (error.error || 'No se pudo eliminar'));
        return;
      }

      alert('Nivel de precio eliminado');
      loadTiers();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar');
    }
  };

  const openCreateModal = () => {
    const maxOrder = Math.max(...tiers.map(t => t.order_index), 0);
    setFormData({
      name: '',
      display_name: '',
      formula_type: 'multiplier',
      multiplier: 1.0,
      percentage: 0.0,
      flat_amount: 0.0,
      min_quantity: 0,
      order_index: maxOrder + 1,
      active: true,
      description: '',
      is_default: false,
      show_in_public: true,
      color_code: '#3B82F6',
    });
    setEditingTier(null);
    setShowModal(true);
  };

  const openEditModal = (tier: PriceTier) => {
    setFormData({ ...tier });
    setEditingTier(tier);
    setShowModal(true);
  };

  const handleRecalculateProducts = async () => {
    setShowRecalculateModal(false);
    setRecalculating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/price-tiers/recalculate-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert('Error: ' + (data.error || 'No se pudo recalcular'));
        return;
      }

      setRecalculateResult(data);
      setShowResultModal(true);
    } catch (error) {
      console.error('Error al recalcular:', error);
      alert('Error al recalcular productos');
    } finally {
      setRecalculating(false);
    }
  };

  const getFormulaDescription = (tier: PriceTier) => {
    switch (tier.formula_type) {
      case 'multiplier':
        return `Precio = Costo × ${tier.multiplier}`;
      case 'percentage_markup':
        return `Precio = Costo + (Costo × ${tier.percentage}%)`;
      case 'flat_amount':
        return `Precio = Costo + $${tier.flat_amount}`;
      default:
        return 'Fórmula desconocida';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <a href="/admin" className="hover:text-gray-700">Dashboard</a>
            <span className="mx-2">/</span>
            <span>Configuración de Precios</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Niveles de Precio</h1>
              <p className="text-gray-600 mt-1">
                Configura los niveles de precio y cómo se calculan según la cantidad comprada
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecalculateModal(true)}
                disabled={recalculating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {recalculating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recalculando...
                  </>
                ) : (
                  <>
                    🔄 Aplicar a Productos Existentes
                  </>
                )}
              </button>
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Crear Nivel
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Tiers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Orden</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fórmula</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cant. Mínima</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tiers.sort((a, b) => a.order_index - b.order_index).map((tier) => (
                <tr key={tier.ID} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                      {tier.order_index}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{tier.display_name}</div>
                      <div className="text-xs text-gray-500">{tier.name}</div>
                      {tier.is_default && (
                        <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Por defecto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-700">{getFormulaDescription(tier)}</div>
                    {tier.description && (
                      <div className="text-xs text-gray-500 mt-1">{tier.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">{tier.min_quantity}</span>
                    <span className="text-xs text-gray-500 ml-1">prendas</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        tier.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tier.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(tier)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Editar
                      </button>
                      {!tier.is_default && (
                        <button
                          onClick={() => handleDelete(tier.ID!)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los niveles se evalúan por <strong>orden</strong> (menor = mayor prioridad)</li>
            <li>• Se aplica el primer nivel que cumpla la cantidad mínima según el orden</li>
            <li>• El nivel marcado como &quot;Por defecto&quot; se usa cuando ningún otro aplica</li>
            <li>• Los cambios afectan a nuevos productos y pedidos automáticamente</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">🔄 Aplicar a Productos Existentes</h3>
            <p className="text-sm text-yellow-800">
            Para actualizar los precios de productos que ya existen en el sistema, usa el botón 
            <strong> &quot;Aplicar a Productos Existentes&quot;</strong>. Esto recalculará los precios mayorista, 
            descuento 1 y descuento 2 de todos los productos basándose en su costo y los niveles actuales.
          </p>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingTier ? 'Editar Nivel de Precio' : 'Crear Nivel de Precio'}
              </h2>

              <div className="space-y-4">
                {/* Nombre interno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Interno (clave)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ej: mayorista, descuento1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sin espacios, solo letras y números</p>
                </div>

                {/* Nombre para mostrar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre a Mostrar
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ej: Precio Mayorista"
                  />
                </div>

                {/* Tipo de fórmula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Fórmula
                  </label>
                  <select
                    value={formData.formula_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formula_type: e.target.value as PriceTier['formula_type'],
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="multiplier">Multiplicador (Costo × Factor)</option>
                    <option value="percentage_markup">Porcentaje de Markup (Costo + %)</option>
                    <option value="flat_amount">Monto Fijo (Costo + Monto)</option>
                  </select>
                </div>

                {/* Campos según tipo de fórmula */}
                {formData.formula_type === 'multiplier' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Multiplicador
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.multiplier}
                      onChange={(e) =>
                        setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="ej: 2.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precio = Costo × {formData.multiplier}
                    </p>
                  </div>
                )}

                {formData.formula_type === 'percentage_markup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="ej: 150"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precio = Costo + (Costo × {formData.percentage}%)
                    </p>
                  </div>
                )}

                {formData.formula_type === 'flat_amount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto Fijo ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.flat_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, flat_amount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="ej: 500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precio = Costo + ${formData.flat_amount}
                    </p>
                  </div>
                )}

                {/* Cantidad mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Mínima (prendas)
                  </label>
                  <input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ej: 6"
                  />
                </div>

                {/* Orden de prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden de Prioridad
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Menor número = mayor prioridad
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Descripción interna para el equipo"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Nivel por defecto</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.show_in_public}
                      onChange={(e) =>
                        setFormData({ ...formData, show_in_public: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Mostrar en listados públicos</span>
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTier(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para recalcular precios */}
      {showRecalculateModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Recalcular todos los precios?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Esta acción actualizará los precios mayorista de <strong>todos los productos</strong> según los niveles configurados actualmente.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>📊</span> Se aplicarán estos cambios:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {tiers.filter(t => t.active).sort((a, b) => a.order_index - b.order_index).map(tier => (
                  <li key={tier.ID} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>{tier.display_name}</strong>: {getFormulaDescription(tier)}
                      {tier.min_quantity > 0 && <span className="text-gray-500"> (desde {tier.min_quantity} prendas)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecalculateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecalculateProducts}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultado del recálculo */}
      {showResultModal && recalculateResult && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Recálculo completado!
              </h3>
              <p className="text-gray-600 text-sm">
                Los precios han sido actualizados exitosamente
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total de productos:</span>
                <span className="text-xl font-bold text-blue-600">{recalculateResult.total_products}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Actualizados:</span>
                <span className="text-xl font-bold text-green-600">{recalculateResult.updated}</span>
              </div>
              {recalculateResult.errors > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Errores:</span>
                  <span className="text-xl font-bold text-red-600">{recalculateResult.errors}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700 font-medium">Niveles aplicados:</span>
                <span className="text-xl font-bold text-purple-600">{recalculateResult.tiers_applied}</span>
              </div>
            </div>

            <button
              onClick={() => setShowResultModal(false)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
