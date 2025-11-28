"use client";
import React, { useEffect, useState } from 'react';
import KitForm from './KitForm';
import { fetchProducts, API_BASE } from '@/utils/api';

export default function AdminKitsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]));
    loadKits();
  }, []);

  const loadKits = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/kits`, { headers });
      if (!res.ok) throw new Error('Error al listar kits');
      const data = await res.json();
      setKits(Array.isArray(data) ? data : (data.items ?? []));
    } catch (err) {
      console.error(err);
      setKits([]);
    }
  };

  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    loadKits();
  };

  const onEdit = (k: any) => {
    setEditing(k);
    setShowForm(true);
  };

  const onDelete = async (k: any) => {
    if (!confirm('Eliminar kit?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/kits/${k.ID ?? k.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Error al eliminar');
      loadKits();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar kit');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kits / Combos</h1>
        <div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded">Nuevo kit</button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <KitForm products={products} onCancel={() => setShowForm(false)} onSaved={onSaved} editing={editing} />
        </div>
      )}

      <div>
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Precio Kit</th>
              <th className="p-2">Suma individuales</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {kits.map((k) => (
              <tr key={k.ID ?? k.id} className="border-t">
                <td className="p-2">{k.ID ?? k.id}</td>
                <td className="p-2">{k.name}</td>
                <td className="p-2">${(k.price ?? 0).toFixed(2)}</td>
                <td className="p-2">${(k.sum_individuals ?? 0).toFixed(2)}</td>
                <td className="p-2">
                  <button onClick={() => onEdit(k)} className="text-sm text-blue-600 mr-2">Editar</button>
                  <button onClick={() => onDelete(k)} className="text-sm text-red-600">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
