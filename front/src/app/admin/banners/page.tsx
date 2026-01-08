"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Banner = { ID: number; image_url: string; alt_text?: string; link?: string; order: number; active: boolean };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const draggingIndex = useRef<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [link, setLink] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/banners', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setErrorMsg('No autorizado. Por favor iniciá sesión como admin o encargado.');
      } else {
        setErrorMsg('Error al cargar banners: ' + res.statusText);
      }
      setBanners([]);
      return;
    }
    const data = await res.json();
    setBanners(data);
  }

  useEffect(() => { load(); }, []);

  async function upload(e: any) {
    e.preventDefault();
    if (!file) return alert('Seleccioná una imagen');
    const fd = new FormData();
    fd.append('image', file);
    fd.append('alt_text', alt);
    fd.append('link', link);
    fd.append('active', active ? '1' : '0');
    fd.append('order', String(order));
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/banners', {
      method: 'POST',
      body: fd,
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      return alert('Error: ' + (t.error || res.statusText));
    }
    setFile(null); setAlt(''); setLink(''); setActive(true); setOrder(0);
    await load();
  }

  async function remove(id: number) {
    if (!confirm('Eliminar banner?')) return;
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/settings/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    await load();
  }

  async function toggleActive(b: Banner) {
    const fd = new FormData();
    fd.append('active', b.active ? '0' : '1');
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/settings/banners/${b.ID}`, { method: 'PUT', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    await load();
  }

  function imgUrl(src?: string) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + src;
  }

  async function persistOrder(newList: Banner[]) {
    setSavingOrder(true);
    try {
      const payload = newList.map((b, idx) => ({ id: b.ID, order: idx + 1 }));
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/banners/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setBanners(updated);
      } else {
        console.error('Reorder failed', res.statusText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingOrder(false);
    }
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    draggingIndex.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = draggingIndex.current;
    if (from == null) return;
    if (from === idx) return;
    const copy = [...banners];
    const [moved] = copy.splice(from, 1);
    copy.splice(idx, 0, moved);
    // update local order numbers for UX
    const withOrders = copy.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(withOrders);
    // persist
    persistOrder(withOrders);
    draggingIndex.current = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Banners (Home Carousel)</h1>
      {errorMsg && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-800">{errorMsg}</div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/login')} className="px-3 py-1 bg-yellow-600 text-white rounded">Ir a login</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={upload} className="mb-6 space-y-2">
        <div>
          <label className="block text-sm text-gray-900 mb-1">Imagen</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              Seleccionar archivo
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
            <span className="text-sm text-gray-600">{file ? file.name : 'Sin archivos seleccionados'}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-900">Alt text</label>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="w-full border p-2 rounded text-gray-900 placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-900">Link (opcional)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full border p-2 rounded text-gray-900 placeholder:text-gray-400" />
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-gray-900"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Mostrar</label>
          <label className="flex items-center gap-2 text-gray-900">Orden <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-20 border p-1 rounded text-gray-900" /></label>
        </div>
        <div>
          <button className="btn-primary py-2 px-4">Subir</button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Lista de banners</h2>
        <div className="grid gap-4">
          {banners.map((b, idx) => (
            <div key={b.ID}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, idx)}
              className={`flex items-center gap-4 border p-3 rounded ${draggingIndex.current === idx ? 'opacity-60' : ''}`}>
              <div className="w-6 text-sm text-gray-700">{idx + 1}</div>
              <img src={imgUrl(b.image_url)} alt={b.alt_text || ''} className="w-36 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{b.alt_text || '(sin alt)'}</div>
                    <div className="text-sm text-gray-600">{b.link || ''}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => toggleActive(b)} className="px-2 py-1 border rounded text-gray-900">{b.active ? 'Ocultar' : 'Mostrar'}</button>
                    <button onClick={() => remove(b.ID)} className="px-2 py-1 border rounded text-gray-900">Eliminar</button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">Orden: {b.order}</div>
              </div>
            </div>
          ))}
        </div>
        {savingOrder && <div className="text-sm text-gray-600 mt-2">Guardando nuevo orden...</div>}
      </section>
    </div>
  );
}
