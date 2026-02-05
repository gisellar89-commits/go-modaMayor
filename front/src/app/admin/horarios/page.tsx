"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/hooks/useNotification';

interface StoreHours {
  id: number;
  weekday_morning_open: string | null;
  weekday_morning_close: string | null;
  weekday_afternoon_open: string | null;
  weekday_afternoon_close: string | null;
  saturday_morning_open: string | null;
  saturday_morning_close: string | null;
  saturday_afternoon_open: string | null;
  saturday_afternoon_close: string | null;
}

interface StoreHoliday {
  id: number;
  date: string;
  name: string;
}

export default function HorariosPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showConfirm, ToastContainer } = useNotification();
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [holidays, setHolidays] = useState<StoreHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [weekdayMorningOpen, setWeekdayMorningOpen] = useState('');
  const [weekdayMorningClose, setWeekdayMorningClose] = useState('');
  const [weekdayAfternoonEnabled, setWeekdayAfternoonEnabled] = useState(false);
  const [weekdayAfternoonOpen, setWeekdayAfternoonOpen] = useState('');
  const [weekdayAfternoonClose, setWeekdayAfternoonClose] = useState('');
  
  const [saturdayEnabled, setSaturdayEnabled] = useState(false);
  const [saturdayMorningOpen, setSaturdayMorningOpen] = useState('');
  const [saturdayMorningClose, setSaturdayMorningClose] = useState('');
  const [saturdayAfternoonEnabled, setSaturdayAfternoonEnabled] = useState(false);
  const [saturdayAfternoonOpen, setSaturdayAfternoonOpen] = useState('');
  const [saturdayAfternoonClose, setSaturdayAfternoonClose] = useState('');
  
  // Holiday form
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch store hours
      const hoursRes = await fetch(`${API_URL}/settings/store-hours`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (hoursRes.ok) {
        const data = await hoursRes.json();
        setHours(data);
        
        // Populate form fields
        if (data.weekday_morning_open) {
          setWeekdayMorningOpen(formatTime(data.weekday_morning_open));
        }
        if (data.weekday_morning_close) {
          setWeekdayMorningClose(formatTime(data.weekday_morning_close));
        }
        if (data.weekday_afternoon_open) {
          setWeekdayAfternoonEnabled(true);
          setWeekdayAfternoonOpen(formatTime(data.weekday_afternoon_open));
        }
        if (data.weekday_afternoon_close) {
          setWeekdayAfternoonClose(formatTime(data.weekday_afternoon_close));
        }
        
        if (data.saturday_morning_open) {
          setSaturdayEnabled(true);
          setSaturdayMorningOpen(formatTime(data.saturday_morning_open));
        }
        if (data.saturday_morning_close) {
          setSaturdayMorningClose(formatTime(data.saturday_morning_close));
        }
        if (data.saturday_afternoon_open) {
          setSaturdayAfternoonEnabled(true);
          setSaturdayAfternoonOpen(formatTime(data.saturday_afternoon_open));
        }
        if (data.saturday_afternoon_close) {
          setSaturdayAfternoonClose(formatTime(data.saturday_afternoon_close));
        }
      }

      // Fetch holidays
      const holidaysRes = await fetch(`${API_URL}/settings/holidays`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        setHolidays(data || []);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toTimeString().substring(0, 5);
    } catch {
      return '';
    }
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        weekday_morning_open: weekdayMorningOpen,
        weekday_morning_close: weekdayMorningClose,
        weekday_afternoon_open: weekdayAfternoonEnabled ? weekdayAfternoonOpen : '',
        weekday_afternoon_close: weekdayAfternoonEnabled ? weekdayAfternoonClose : '',
        saturday_morning_open: saturdayEnabled ? saturdayMorningOpen : '',
        saturday_morning_close: saturdayEnabled ? saturdayMorningClose : '',
        saturday_afternoon_open: saturdayAfternoonEnabled ? saturdayAfternoonOpen : '',
        saturday_afternoon_close: saturdayAfternoonEnabled ? saturdayAfternoonClose : '',
      };

      const res = await fetch(`${API_URL}/settings/store-hours`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showSuccess('Horarios guardados exitosamente');
        fetchData();
      } else {
        const error = await res.json();
        showError(error.error || 'No se pudieron guardar los horarios');
      }
    } catch (error) {
      console.error('Error guardando horarios:', error);
      showError('Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate || !newHolidayName) {
      showWarning('Complete fecha y nombre del feriado');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newHolidayDate,
          name: newHolidayName,
        }),
      });

      if (res.ok) {
        setNewHolidayDate('');
        setNewHolidayName('');
        showSuccess('Feriado agregado exitosamente');
        fetchData();
      } else {
        const error = await res.json();
        showError(error.error || 'No se pudo agregar el feriado');
      }
    } catch (error) {
      console.error('Error agregando feriado:', error);
      showError('Error al agregar feriado');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    showConfirm(
      '¿Eliminar feriado?',
      'Esta acción no se puede deshacer.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/settings/holidays/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (res.ok) {
            showSuccess('Feriado eliminado exitosamente');
            fetchData();
          } else {
            showError('Error al eliminar feriado');
          }
        } catch (error) {
          console.error('Error eliminando feriado:', error);
          showError('Error al eliminar feriado');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Configuración de Horarios</h1>
      
      {/* Horarios de Lunes a Viernes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Lunes a Viernes</h2>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2 text-gray-700">Turno Mañana (requerido)</h3>
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Apertura</label>
              <input
                type="time"
                value={weekdayMorningOpen}
                onChange={(e) => setWeekdayMorningOpen(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <span className="mt-6">-</span>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cierre</label>
              <input
                type="time"
                value={weekdayMorningClose}
                onChange={(e) => setWeekdayMorningClose(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={weekdayAfternoonEnabled}
              onChange={(e) => setWeekdayAfternoonEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-700">Turno Tarde (opcional)</span>
          </label>
          
          {weekdayAfternoonEnabled && (
            <div className="flex gap-4 items-center ml-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Apertura</label>
                <input
                  type="time"
                  value={weekdayAfternoonOpen}
                  onChange={(e) => setWeekdayAfternoonOpen(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
              <span className="mt-6">-</span>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cierre</label>
                <input
                  type="time"
                  value={weekdayAfternoonClose}
                  onChange={(e) => setWeekdayAfternoonClose(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Horarios de Sábado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={saturdayEnabled}
            onChange={(e) => setSaturdayEnabled(e.target.checked)}
            className="w-5 h-5"
          />
          <h2 className="text-xl font-semibold text-pink-600">Sábado</h2>
        </div>
        
        {saturdayEnabled && (
          <>
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-gray-700">Turno Mañana</h3>
              <div className="flex gap-4 items-center">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Apertura</label>
                  <input
                    type="time"
                    value={saturdayMorningOpen}
                    onChange={(e) => setSaturdayMorningOpen(e.target.value)}
                    className="border rounded px-3 py-2"
                  />
                </div>
                <span className="mt-6">-</span>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cierre</label>
                  <input
                    type="time"
                    value={saturdayMorningClose}
                    onChange={(e) => setSaturdayMorningClose(e.target.value)}
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={saturdayAfternoonEnabled}
                  onChange={(e) => setSaturdayAfternoonEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-700">Turno Tarde (opcional)</span>
              </label>
              
              {saturdayAfternoonEnabled && (
                <div className="flex gap-4 items-center ml-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Apertura</label>
                    <input
                      type="time"
                      value={saturdayAfternoonOpen}
                      onChange={(e) => setSaturdayAfternoonOpen(e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <span className="mt-6">-</span>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cierre</label>
                    <input
                      type="time"
                      value={saturdayAfternoonClose}
                      onChange={(e) => setSaturdayAfternoonClose(e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Domingo (siempre cerrado) */}
      <div className="bg-gray-100 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-600">Domingo</h2>
        <p className="text-gray-500 mt-2">Cerrado</p>
      </div>

      {/* Botón Guardar Horarios */}
      <div className="mb-8">
        <button
          onClick={handleSaveHours}
          disabled={saving}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 disabled:bg-gray-400 font-medium"
        >
          {saving ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>

      {/* Feriados */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Feriados y Días No Laborables</h2>
        
        <div className="mb-6">
          <h3 className="font-medium mb-3 text-gray-700">Agregar Feriado</h3>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="Ej: Año Nuevo"
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <button
              onClick={handleAddHoliday}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Agregar
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 text-gray-700">Feriados Registrados</h3>
          {holidays.length === 0 ? (
            <p className="text-gray-500 italic">No hay feriados registrados</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex justify-between items-center border rounded px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <span className="font-medium">{holiday.name}</span>
                    <span className="text-gray-500 ml-3">
                      {new Date(holiday.date).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
