"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";
import { useRouter } from "next/navigation";

type SocialLink = { platform: string; url: string };

export default function AdminTopbarPage() {
  const [centerText, setCenterText] = useState("");
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${API_BASE}/settings/topbar`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => r.statusText || 'Error');
          setError(`Error al obtener topbar: ${r.status} ${txt}`);
          return {} as any;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setCenterText(data.center_text ?? "");
        const socials = Array.isArray(data.social_links) ? data.social_links : [];
        setLinks(socials.map((s: any) => ({ platform: s.platform ?? s.name ?? '', url: s.url ?? s.href ?? '' })));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  function updateLink(idx: number, key: keyof SocialLink, value: string) {
    setLinks((prev) => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  }

  function addLink() {
    setLinks((prev) => [...prev, { platform: '', url: '' }]);
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('Debes iniciar sesión como admin o encargado para guardar.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/settings/topbar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ center_text: centerText, social_links: links })
      });
      if (!res.ok) {
        let body = '';
        try {
          const j = await res.json();
          body = JSON.stringify(j);
        } catch {
          body = await res.text().catch(() => '');
        }
        setError(`Error al guardar: ${res.status} ${body}`);
        return;
      }
      // success: agregar toast persistente (apilable) y refresh
      setError(null);
      const id = Date.now();
      setToasts((prev) => [{ id, text: 'Topbar guardado correctamente.' }, ...prev]);
      // Refresh data
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <main className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Editar Topbar</h1>
      {error && <div className="mb-4 text-sm text-red-600" role="alert">{error}</div>}
      {/* Toasters apilados en esquina superior derecha */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} className="max-w-sm w-full flex items-start gap-3 bg-white ring-1 ring-green-200 shadow-lg rounded p-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800" role="status" aria-live="polite">{t.text}</div>
              </div>
              <div>
                <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Cerrar notificación" className="inline-flex items-center justify-center h-8 w-8 rounded bg-green-700 text-white">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Texto central</label>
        <input value={centerText} onChange={(e) => setCenterText(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Redes sociales</h2>
          <button onClick={addLink} className="text-sm text-blue-600 hover:underline">Agregar</button>
        </div>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={`${l.platform || 'link'}-${i}`} className="flex gap-2 items-center">
              <input placeholder="Plataforma (instagram, facebook, whatsapp...)" value={l.platform} onChange={(e) => updateLink(i, 'platform', e.target.value)} className="flex-1 p-2 border rounded" />
              <input placeholder="URL" value={l.url} onChange={(e) => updateLink(i, 'url', e.target.value)} className="flex-2 p-2 border rounded" />
              <button onClick={() => removeLink(i)} className="text-red-600">Eliminar</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </main>
  );
}
