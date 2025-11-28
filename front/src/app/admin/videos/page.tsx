"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Video = { ID: number; title?: string; description?: string; video_url?: string; external_url?: string; thumbnail_url?: string; order: number; active: boolean };

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const draggingIndex = useRef<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/videos', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setErrorMsg('No autorizado. Por favor iniciá sesión como admin o encargado.');
      } else {
        setErrorMsg('Error al cargar videos: ' + res.statusText);
      }
      setVideos([]);
      return;
    }
    const data = await res.json();
    setVideos(data);
  }

  useEffect(() => { load(); }, []);

  async function upload(e: any) {
    e.preventDefault();
    if (!file && !externalUrl) return alert('Seleccioná un archivo de video o pegá una URL externa');
    const fd = new FormData();
    if (file) fd.append('video', file);
    if (thumb) fd.append('thumbnail', thumb);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('active', active ? '1' : '0');
    fd.append('order', String(order));
    if (externalUrl) fd.append('external_url', externalUrl);
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/videos', {
      method: 'POST',
      body: fd,
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      return alert('Error: ' + (t.error || res.statusText));
    }
    setFile(null); setThumb(null); setTitle(''); setDescription(''); setActive(true); setOrder(0);
    setExternalUrl('');
    await load();
  }

  async function remove(id: number) {
    if (!confirm('Eliminar video?')) return;
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/settings/videos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    await load();
  }

  async function toggleActive(v: Video) {
    const fd = new FormData();
    fd.append('active', v.active ? '0' : '1');
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/settings/videos/${v.ID}`, { method: 'PUT', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    await load();
  }

  function fullUrl(src?: string) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + src;
  }

  async function persistOrder(newList: Video[]) {
    setSavingOrder(true);
    try {
      const payload = newList.map((b, idx) => ({ id: b.ID, order: idx + 1 }));
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/settings/videos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideos(updated);
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
    const copy = [...videos];
    const [moved] = copy.splice(from, 1);
    copy.splice(idx, 0, moved);
    const withOrders = copy.map((b, i) => ({ ...b, order: i + 1 }));
    setVideos(withOrders);
    persistOrder(withOrders);
    draggingIndex.current = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Videos (Sección Home)</h1>
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
          <label className="block text-sm">Archivo de video</label>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm">O URL externa (YouTube / Vimeo / Instagram)</label>
          <input value={externalUrl ?? ""} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." className="w-full border p-2 rounded" />
          <div className="text-xs text-gray-500 mt-1">Pega una URL pública si el video está en YouTube, Vimeo o Instagram. Si pegas una URL, no hace falta subir archivo.</div>
        </div>
        <div>
          <label className="block text-sm">Thumbnail (opcional)</label>
          <input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm">Título</label>
          <input value={title ?? ""} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Descripción</label>
          <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Mostrar</label>
          <label className="flex items-center gap-2">Orden <input type="number" value={order ?? 0} onChange={(e) => setOrder(Number(e.target.value))} className="w-20 border p-1 rounded" /></label>
        </div>
        <div>
          <button className="btn-primary py-2 px-4">Subir</button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-medium mb-2">Lista de videos</h2>
        <div className="grid gap-4">
          {videos.map((v, idx) => (
            <div key={v.ID}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, idx)}
              className={`flex items-center gap-4 border p-3 rounded ${draggingIndex.current === idx ? 'opacity-60' : ''}`}>
              <div className="w-6 text-sm text-gray-700">{idx + 1}</div>
                <div className="w-40">
                  {v.external_url ? (
                    // small embed/thumbnail preview for external
                    <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 overflow-hidden">
                      {v.thumbnail_url ? <img src={fullUrl(v.thumbnail_url)} className="w-full h-full object-cover" /> : <span className="p-2">External</span>}
                    </div>
                  ) : (
                    <video src={fullUrl(v.video_url)} poster={fullUrl(v.thumbnail_url)} className="w-full h-20 object-cover rounded" />
                  )}
                </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{v.title || '(sin título)'}</div>
                    <div className="text-sm text-gray-600">{v.description || ''}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => toggleActive(v)} className="px-2 py-1 border rounded">{v.active ? 'Ocultar' : 'Mostrar'}</button>
                    <button onClick={() => remove(v.ID)} className="px-2 py-1 border rounded">Eliminar</button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">Orden: {v.order}</div>
              </div>
            </div>
          ))}
        </div>
        {savingOrder && <div className="text-sm text-gray-600 mt-2">Guardando nuevo orden...</div>}
      </section>
    </div>
  );
}
