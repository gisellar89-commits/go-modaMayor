"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts, fetchProductsPaged, API_BASE } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

type KitItem = {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  unit_price?: number;
};

export default function KitForm({ products = [], onCancel, onSaved, editing = null }: any) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState<number | ''>(editing?.price ?? '');
  const [items, setItems] = useState<KitItem[]>(editing?.items ?? []);
  const [allProducts, setAllProducts] = useState<any[]>(products ?? []);
  const auth = useAuth();
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [queryInputs, setQueryInputs] = useState<string[]>(() => items.map((it) => ''));
  const [suggestionsMap, setSuggestionsMap] = useState<Record<number, any[]>>({});
  const timersRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!products || products.length === 0) {
      fetchProducts().then(setAllProducts).catch(() => setAllProducts([]));
    }
  }, [products]);

  const addEmptyItem = () => {
    setItems([...items, { product_id: allProducts[0]?.ID ?? allProducts[0]?.id ?? 0, quantity: 1 }]);
    setQueryInputs((q) => [...q, '']);
  };

  const updateItem = (idx: number, patch: Partial<KitItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    setQueryInputs((q) => q.filter((_, i) => i !== idx));
  };

  const computeSum = useMemo(() => {
    let s = 0;
    for (const it of items) {
      const prod = allProducts.find((p) => p.ID === it.product_id || p.id === it.product_id);
      const price = it.unit_price ?? (prod?.wholesale_price ?? prod?.price ?? 0);
      s += price * (it.quantity ?? 1);
    }
    return s;
  }, [items, allProducts]);

  const isValid = useMemo(() => {
    if (!name || name.trim() === '') return false;
    if (!items || items.length === 0) return false;
    for (const it of items) {
      if (!it.product_id || it.product_id === 0) return false;
      if (!it.quantity || it.quantity <= 0) return false;
    }
    return true;
  }, [name, items]);

  const submit = async () => {
    const payload = {
      name,
      description,
      price: typeof price === 'number' ? price : 0,
      items: items.map((it) => ({ product_id: it.product_id, variant_id: it.variant_id, quantity: it.quantity, unit_price: it.unit_price ?? 0 })),
    };
    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const method = editing && editing.ID ? 'PUT' : 'POST';
      const url = editing && editing.ID ? `${API_BASE}/kits/${editing.ID}` : `${API_BASE}/kits`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al crear/actualizar kit');
      onSaved && onSaved();
      // reset form local state if creating
      if (!editing) {
        setName(''); setDescription(''); setPrice(''); setItems([]);
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar kit');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      {/* DEBUG BANNER to verify file changes are loaded */}
      <div className="mb-2 p-2 bg-yellow-100 text-sm text-yellow-800 rounded">KitForm debug: componente cargado (ver panel abajo)</div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{editing ? 'Editar kit' : 'Nuevo kit'}</h2>
        <div>
          <button className="mr-2 text-sm text-gray-600" onClick={onCancel}>Cancelar</button>
          <button disabled={!isValid || saving} className={`px-3 py-1 rounded text-sm ${!isValid || saving ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white'}`} onClick={submit}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      {!isValid && (
        <div className="mb-2 text-sm text-red-600">El formulario no es válido: nombre y al menos 1 item con cantidad positiva son obligatorios.</div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="p-2 border rounded" />
        <input value={price === '' ? '' : String(price)} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Precio del kit (opcional)" className="p-2 border rounded" />
      </div>

      <div className="mb-4">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Items</h3>
          <div>
            <input placeholder="Buscar producto..." value={filter} onChange={(e) => setFilter(e.target.value)} className="p-1 border rounded mr-2" />
            <button className="text-sm text-blue-600" onClick={addEmptyItem}>Agregar item</button>
          </div>
        </div>
        {items.map((it, idx) => {
          const prod = allProducts.find((p) => p.ID === it.product_id || p.id === it.product_id);
          const defaultUnit = prod?.wholesale_price ?? prod?.price ?? 0;
          const variants = prod?.variants || prod?.Variants || [];
          const queryValue = queryInputs[idx] ?? '';
          const suggestions = suggestionsMap[idx] ?? [];
          return (
            <div key={`${it.product_id ?? 'new'}-${idx}`} className="flex items-center gap-2 mb-2 relative">
              <div style={{ minWidth: 260 }}>
                <input
                  className="p-2 border rounded w-full"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={queryValue || prod?.name || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQueryInputs((q) => {
                      const next = [...q];
                      next[idx] = v;
                      return next;
                    });
                    // debounce search
                    if (timersRef.current[idx]) window.clearTimeout(timersRef.current[idx]);
                    timersRef.current[idx] = window.setTimeout(async () => {
                      try {
                        console.debug('[KitForm] search trigger', idx, v);
                        if (!v || v.trim() === '') {
                          setSuggestionsMap((s) => ({ ...s, [idx]: [] }));
                          return;
                        }
                        const resp = await fetchProductsPaged({ search: v, limit: 10 });
                        console.debug('[KitForm] suggestions result', idx, resp);
                        setSuggestionsMap((s) => ({ ...s, [idx]: resp.items ?? resp }));
                      } catch (err) {
                        console.error('[KitForm] suggestions error', err);
                        setSuggestionsMap((s) => ({ ...s, [idx]: [] }));
                      }
                    }, 250) as unknown as number;
                  }}
                />
                {Array.isArray(suggestions) && suggestions.length > 0 && (
                  <ul className="absolute z-20 bg-white border rounded mt-1 max-h-48 overflow-auto w-full shadow">
                    {suggestions.map((s: any) => (
                      <li key={s.ID ?? s.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
                        updateItem(idx, { product_id: s.ID ?? s.id, variant_id: undefined });
                        setQueryInputs((q) => { const next = [...q]; next[idx] = s.name; return next; });
                        setSuggestionsMap((m) => ({ ...m, [idx]: [] }));
                      }}>{s.name} {((s.Variants && s.Variants.length > 0) || (s.variants && s.variants.length > 0)) ? '(con variantes)' : ''} {s?.sku ? `- ${s.sku}` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>
              {Array.isArray(variants) && variants.length > 0 && (
                <select value={it.variant_id ?? ''} onChange={(e) => updateItem(idx, { variant_id: e.target.value === '' ? undefined : Number(e.target.value) })} className="p-2 border rounded">
                  <option value="">-- Variante --</option>
                  {variants.map((v: any) => (
                    <option key={v.ID ?? v.id} value={v.ID ?? v.id}>{v.name ?? v.value ?? v.sku ?? `Var ${v.ID ?? v.id}`}</option>
                  ))}
                </select>
              )}
              <input type="number" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="w-20 p-2 border rounded" />
              <input type="number" value={it.unit_price ?? ''} onChange={(e) => updateItem(idx, { unit_price: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Unit price (opcional)" className="w-40 p-2 border rounded" />
              <button className="text-xs text-gray-600" onClick={() => updateItem(idx, { unit_price: defaultUnit })}>Usar precio por defecto (${defaultUnit})</button>
              <button className="text-red-600" onClick={() => { removeItem(idx); setQueryInputs((q) => q.filter((_,i)=>i!==idx)); }}>Eliminar</button>
            </div>
          );
        })}
        <div className="mt-2 text-sm text-gray-600">Suma de individuales: ${computeSum.toFixed(2)}</div>
      </div>
      {/* Visible debug panel to inspect queries and suggestions */}
      <div className="mt-4 p-2 bg-gray-50 border rounded text-sm">
        <div className="font-semibold mb-1">DEBUG: queryInputs</div>
        <pre className="text-xs max-h-40 overflow-auto">{JSON.stringify(queryInputs, null, 2)}</pre>
        <div className="font-semibold mt-2 mb-1">DEBUG: suggestionsMap (showing up to 5 keys)</div>
        <pre className="text-xs max-h-40 overflow-auto">{JSON.stringify(Object.fromEntries(Object.entries(suggestionsMap).slice(0,5)), null, 2)}</pre>
      </div>
    </div>
  );
}
