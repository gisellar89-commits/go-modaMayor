import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { API_BASE } from "../utils/api";

export interface Variant {
  ID?: number;
  id?: number;
  product_id?: number;
  color?: string;
  size?: string;
  sku?: string;
  image_url?: string;
  __file?: File | null;
}

type Props = {
  productId: number;
  show: boolean;
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
};

export default function VariantsTable({ productId, show, variants, setVariants }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVariant, setEditVariant] = useState<Variant | null>(null);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});

  // Ya no carga variantes por sí mismo, el padre controla variants/setVariants

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;

  const createVariantAPI = async (v: Variant) => {
    if (!productId) throw new Error('Producto no guardado');
    const token = getToken();
    const res = await fetch(`${API_BASE}/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(v),
    });
    if (!res.ok) throw new Error('Error al crear variante');
    return res.json();
  };

  const updateVariantAPI = async (id: number, v: Variant) => {
    const token = getToken();
    // find index to mark saving if relevant (not always available here)
    const res = await fetch(`${API_BASE}/variants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(v),
    });
    if (!res.ok) throw new Error('Error al actualizar variante');
    return res.json();
  };

  const deleteVariantAPI = async (id: number) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/variants/${id}`, {
      method: 'DELETE',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error('Error al eliminar variante');
    return true;
  };

  const handleDelete = async (variantId: number | undefined) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta variante?")) return;
    try {
      if (variantId && productId) {
        await deleteVariantAPI(variantId);
        toast.success('Variante eliminada');
        setVariants(variants.filter((v: Variant) => (v.ID || v.id) !== variantId));
        return;
      }
      // fallback local
      setVariants(variants.filter((v: Variant) => (v.ID || v.id) !== variantId));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al eliminar variante');
    }
  };

  const uploadVariantImage = async (variantId: number | undefined, file: File, idx: number) => {
    if (!variantId) {
      toast.error("Guarda la variante antes de subir una imagen");
      return;
    }
    try {
      setUploading((s) => ({ ...s, [idx]: true }));
      setRowError(prev => ({ ...prev, [idx]: '' }));
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${API_BASE}/variants/${variantId}/image`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al subir imagen");
      }
      const updated = await res.json();
      // Actualizar inmediatamente la UI con la variante actualizada
      const next = variants.map((v: Variant) => ((v.ID || v.id) === (updated.ID ?? updated.id) ? { ...v, ...updated } : v));
      setVariants(next);

      // Si la variante subida tiene color y image_url, pedir al backend que propague
      // la misma image_url a todas las variantes del mismo color en una sola petición.
      if (updated.image_url && updated.color && productId) {
        try {
          const token2 = localStorage.getItem('token') ?? undefined;
          const r = await fetch(`${API_BASE}/products/${productId}/variants/propagate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) },
            body: JSON.stringify({ color: updated.color, image_url: updated.image_url })
          });
          if (!r.ok) {
            const txt = await r.text();
            throw new Error(txt || 'Error al propagar imagen');
          }
          const body = await r.json();
          // body.updated_ids es la lista de variant IDs actualizados en server
          if (Array.isArray(body.updated_ids)) {
            const updatedIds = body.updated_ids as number[];
            // Aplicar image_url a las variantes en estado local cuyos IDs fueron actualizados
            const applied = next.map(v => {
              const vid = (v.ID ?? v.id) as number | undefined;
              if (vid && updatedIds.includes(vid)) return { ...v, image_url: updated.image_url };
              return v;
            });
            setVariants(applied);
            toast.success(`Imagen subida. Propagada a ${body.updated_count ?? updatedIds.length} variantes.`);
          } else {
            toast.success('Imagen subida. Propagación completada.');
          }
        } catch (err: any) {
          console.error('Error calling propagate-image endpoint', err);
          toast.error(err?.message || 'Imagen subida, pero falló persistir propagación');
        }
      } else {
        toast.success('Imagen subida.');
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Error al subir imagen";
      setRowError(prev => ({ ...prev, [idx]: msg }));
      toast.error(msg);
    } finally {
      setUploading((s) => ({ ...s, [idx]: false }));
    }
  };

  const propagateImageForColor = async (productIdLocal: number, color: string | undefined, imageUrl: string | undefined) => {
    if (!color || !imageUrl) return null;
    const token = localStorage.getItem('token') ?? undefined;
    const res = await fetch(`${API_BASE}/products/${productIdLocal}/variants/propagate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ color, image_url: imageUrl })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Error al propagar imagen');
    }
    return res.json();
  };

  const retryRow = async (idx: number) => {
    const v = variants[idx];
    if (!v) return;
    setRowError(prev => ({ ...prev, [idx]: '' }));
    try {
      setSaving(s => ({ ...s, [idx]: true }));
      if (!(v.ID || v.id)) {
        // try create
        const created = await createVariantAPI(v);
        const next = [...variants];
        next[idx] = created;
        setVariants(next);
        // if there was a file attached locally, upload it
        const file = (v as any).__file as File | undefined;
        if (file && (created.ID || created.id)) {
          await uploadVariantImage(created.ID ?? created.id, file, idx);
        }
      } else {
        // If variant exists but there was an upload error, try upload if file exists
        const file = (v as any).__file as File | undefined;
        if (file && (v.ID || v.id)) {
          await uploadVariantImage(v.ID ?? v.id, file, idx);
        } else {
          // try basic update
          await updateVariantAPI((v.ID || v.id) as number, v);
          const next = [...variants];
          next[idx] = v;
          setVariants(next);
        }
      }
      setRowError(prev => ({ ...prev, [idx]: '' }));
    } catch (e: any) {
      console.error('Retry error', e);
      setRowError(prev => ({ ...prev, [idx]: e?.message || 'Error' }));
    } finally {
      setSaving(s => ({ ...s, [idx]: false }));
    }
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditVariant({ ...variants[idx] });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editVariant) return;
    setEditVariant({ ...editVariant, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    if (!editVariant || editIdx === null) return;
    // if variant has id and productId, persist immediately
    const idx = editIdx;
    (async () => {
      try {
        setSaving(s => ({ ...s, [idx]: true }));
        if ((editVariant.ID || editVariant.id) && productId) {
          const idToUpdate = (editVariant.ID || editVariant.id) as number;
          const updated = await updateVariantAPI(idToUpdate, editVariant);
          setVariants(variants.map((vv, i) => i === idx ? updated : vv));
          toast.success('Variante actualizada');
        } else {
          // local update
          setVariants(variants.map((v: Variant, i: number) => (i === idx ? { ...editVariant } : v)));
          toast.success('Variante actualizada localmente');
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Error al actualizar variante');
        setRowError(prev => ({ ...prev, [idx]: e.message || 'Error' }));
      } finally {
        setSaving(s => ({ ...s, [idx]: false }));
        setEditIdx(null);
        setEditVariant(null);
      }
    })();
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditVariant(null);
  };

  const [newVariant, setNewVariant] = useState<Variant>({ size: "", color: "", sku: "" });

  if (!show) return null;
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">Variantes</h3>
      <div className="border rounded bg-white p-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max border text-sm table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Talle</th>
            <th className="border px-2 py-1">Color</th>
            <th className="border px-2 py-1">SKU</th>
            <th className="border px-2 py-1">Imagen</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Formulario inline para nueva variante */}
          <tr>
            <td className="border px-2 py-1">
              <input
                name="size"
                value={newVariant.size || ""}
                onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))}
                className="border px-1 py-0.5 rounded w-20"
              />
            </td>
            <td className="border px-2 py-1">
              <input
                name="color"
                value={newVariant.color || ""}
                onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))}
                className="border px-1 py-0.5 rounded w-24"
              />
            </td>
            <td className="border px-2 py-1">
              <input
                name="sku"
                value={newVariant.sku || ""}
                onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))}
                className="border px-1 py-0.5 rounded w-28"
              />
            </td>
            <td className="border px-2 py-1">
              <div className="flex items-center gap-2">
                {/* Input para URL de imagen en nueva variante */}
                <input
                  name="image_url"
                  placeholder="URL de imagen de la variante (opcional)"
                  value={newVariant.image_url || ""}
                  onChange={e => setNewVariant(v => ({ ...v, image_url: e.target.value }))}
                  className="border px-2 py-1 rounded flex-1"
                />
                <input id="new-variant-file" type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) setNewVariant(v => ({ ...v, __file: f }));
                }} />
                <label htmlFor="new-variant-file" className="text-xs bg-gray-200 px-2 py-1 rounded cursor-pointer">Adjuntar</label>
              </div>
              {newVariant.__file ? (
                <img src={URL.createObjectURL(newVariant.__file as File)} alt="preview" className="w-12 h-12 object-contain bg-white border mt-2" />
              ) : newVariant.image_url ? (
                <img src={newVariant.image_url} alt="preview" className="w-12 h-12 object-contain bg-white border mt-2" />
              ) : null}
            </td>
            <td className="border px-2 py-1">
              <button
                className="text-xs bg-green-600 text-white px-2 py-1 rounded mr-2"
                type="button"
                onClick={async () => {
                  if (!(newVariant.size || newVariant.color) || !newVariant.sku) return toast.error('Completa tamaño/color y SKU');
                  try {
                                    if (productId) {
                                      const idx = variants.length;
                                      const created = await createVariantAPI(newVariant);
                                      const next = [...variants, created];
                                      setVariants(next);
                                      // abrir la nueva fila en edición para permitir ajuste inmediato
                                      setTimeout(() => setEditIdx(next.length - 1), 10);
                                      toast.success('Variante creada');
                                      // si había un archivo asociado, subirlo
                                      const file = (newVariant as any).__file as File | undefined;
                                      if (file && (created.ID || created.id)) {
                                        uploadVariantImage(created.ID ?? created.id, file, idx);
                                      }
                                      // Si la variante creada ya trae image_url y color, propagar automáticamente
                                      if (created.image_url && created.color && productId) {
                                        try {
                                          const body = await propagateImageForColor(productId, created.color, created.image_url);
                                          if (body && Array.isArray(body.updated_ids)) {
                                            const updatedIds = body.updated_ids as number[];
                                            const applied = next.map(x => {
                                              const vid = (x.ID ?? x.id) as number | undefined;
                                              if (vid && updatedIds.includes(vid)) return { ...x, image_url: created.image_url };
                                              return x;
                                            });
                                            setVariants(applied);
                                            toast.success(`Imagen propagada a ${body.updated_count ?? updatedIds.length} variantes.`);
                                          }
                                        } catch (err: any) {
                                          console.error('Error propagating image after create', err);
                                          toast.error(err?.message || 'Imagen creada, pero falló persistir propagación');
                                        }
                                      }
                    } else {
                      // guardar localmente, conservando el File para subida posterior
                      setVariants([...variants, { ...newVariant }]);
                      toast.success('Variante creada localmente (guarda el producto para persistir)');
                    }
                    setNewVariant({ size: "", color: "", sku: "" });
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e.message || 'Error al crear variante');
                  }
                }}
              >Agregar</button>
            </td>
          </tr>
          {variants.map((v: Variant, idx: number) => (
            <tr key={v.ID || v.id || idx}>
              {editIdx === idx ? (
                <>
                  <td className="border px-2 py-1">
                    <input
                      name="size"
                      value={editVariant?.size || ""}
                      onChange={handleEditChange}
                      className="border px-1 py-0.5 rounded w-20"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      name="color"
                      value={editVariant?.color || ""}
                      onChange={handleEditChange}
                      className="border px-1 py-0.5 rounded w-24"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      name="sku"
                      value={editVariant?.sku || ""}
                      onChange={handleEditChange}
                      className="border px-1 py-0.5 rounded w-28"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      name="image_url"
                      value={editVariant?.image_url || ""}
                      onChange={e => setEditVariant(ev => ev ? { ...ev, image_url: e.target.value } : ev)}
                      placeholder="URL de imagen (opcional)"
                      className="border px-1 py-0.5 rounded w-40"
                    />
                    {editVariant?.image_url ? <img src={editVariant.image_url} alt="preview" className="w-10 h-10 object-contain inline-block ml-2" /> : null}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded mr-2"
                      onClick={async () => {
                        if (!editVariant) return;
                        try {
                          if ((editVariant.ID || editVariant.id) && productId) {
                            const idToUpdate = (editVariant.ID || editVariant.id) as number;
                            const updated = await updateVariantAPI(idToUpdate, editVariant);
                            setVariants(variants.map((vv, i) => i === editIdx ? updated : vv));
                            toast.success('Variante actualizada');
                            // Si cambió/actualizó image_url y hay color, propagar automáticamente
                            if (updated.image_url && updated.color && productId) {
                              try {
                                const body = await propagateImageForColor(productId, updated.color, updated.image_url);
                                if (body && Array.isArray(body.updated_ids)) {
                                  const updatedIds = body.updated_ids as number[];
                                  const applied = variants.map(x => {
                                    const vid = (x.ID ?? x.id) as number | undefined;
                                    if (vid && updatedIds.includes(vid)) return { ...x, image_url: updated.image_url };
                                    return x;
                                  });
                                  setVariants(applied);
                                  toast.success(`Imagen propagada a ${body.updated_count ?? updatedIds.length} variantes.`);
                                }
                              } catch (err: any) {
                                console.error('Error propagating image after update', err);
                                toast.error(err?.message || 'Imagen actualizada, pero falló persistir propagación');
                              }
                            }
                          } else {
                            // local update
                            handleEditSave();
                            toast.success('Variante actualizada localmente');
                          }
                        } catch (e: any) {
                          console.error(e);
                          toast.error(e.message || 'Error al actualizar variante');
                        }
                      }}
                      type="button"
                    >
                      Guardar
                    </button>
                    <button
                      className="text-xs bg-gray-400 text-white px-2 py-1 rounded"
                      onClick={handleEditCancel}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-2 py-1">{v.size}</td>
                  <td className="border px-2 py-1">{v.color}</td>
                  <td className="border px-2 py-1">{v.sku}</td>
                  <td className="border px-2 py-1">
                    {v.image_url ? <img src={v.image_url} alt="thumb" className="w-10 h-10 object-contain" /> : <span className="text-sm text-gray-400">Sin imagen</span>}
                  </td>
                  <td className="border px-2 py-1 flex items-center gap-2">
                    <button
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={() => handleEdit(idx)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => handleDelete(v.ID || v.id || idx)}
                      type="button"
                    >
                      Eliminar
                    </button>
                    {/* Input file (hidden) y label para abrir selector */}
                    <input id={`file-${idx}`} type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files && e.target.files[0];
                      if (f) uploadVariantImage(v.ID ?? v.id, f, idx);
                    }} />
                    <label htmlFor={`file-${idx}`} className="text-xs bg-blue-600 text-white px-2 py-1 rounded cursor-pointer">
                      {uploading[idx] ? 'Subiendo...' : 'Subir imagen'}
                    </label>
                    <button
                      className="text-xs bg-sky-600 text-white px-2 py-1 rounded cursor-pointer"
                      onClick={async () => {
                        const url = window.prompt('Pega la URL de la imagen:');
                        if (!url) return;
                        // validación mínima
                        if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
                          toast.error('URL inválida. Debe comenzar con http(s) o con /uploads/...');
                          return;
                        }
                        try {
                          const id = v.ID ?? v.id;
                          if (!id) {
                            toast.error('Primero guarda la variante para adjuntar una URL');
                            return;
                          }
                          const updated = await updateVariantAPI(id as number, { image_url: url });
                          // actualizar UI
                          const next = variants.map((x, i) => i === idx ? { ...x, image_url: url } : x);
                          setVariants(next);
                          toast.success('URL adjuntada');
                          // disparar propagación automática
                          if (productId) {
                            try {
                              const body = await propagateImageForColor(productId, updated.color ?? v.color, url);
                              if (body && Array.isArray(body.updated_ids)) {
                                const updatedIds = body.updated_ids as number[];
                                const applied = next.map(x => {
                                  const vid = (x.ID ?? x.id) as number | undefined;
                                  if (vid && updatedIds.includes(vid)) return { ...x, image_url: url };
                                  return x;
                                });
                                setVariants(applied);
                                toast.success(`Imagen propagada a ${body.updated_count ?? updatedIds.length} variantes.`);
                              }
                            } catch (err: any) {
                              console.error('Error propagating after attach URL', err);
                              toast.error(err?.message || 'URL adjuntada, pero falló persistir propagación');
                            }
                          }
                        } catch (err: any) {
                          console.error('Error attaching URL', err);
                          toast.error(err?.message || 'Error al adjuntar URL');
                        }
                      }}
                    >Adjuntar URL</button>
                    {/* La propagación se realiza automáticamente tras subir o guardar image_url; el botón manual fue removido */}
                    {/* indicadores por fila */}
                    <div className="ml-2 text-xs flex flex-col">
                      <div>
                        {saving[idx] ? <span className="text-yellow-600">Guardando...</span> : null}
                        {!saving[idx] && !rowError[idx] && (v.ID || v.id) ? <span className="text-green-600">OK</span> : null}
                      </div>
                      <div>
                        {rowError[idx] ? (
                          <>
                            <span className="text-red-600 mr-2">Error: {rowError[idx]}</span>
                            <button className="text-xs bg-gray-200 px-2 py-0.5 rounded" onClick={() => retryRow(idx)}>Reintentar</button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
          </table>
        </div>
      </div>
      {variants.length === 0 && (
        <div className="text-gray-500 mt-2">No hay variantes para este producto.</div>
      )}
    </div>
  );
}