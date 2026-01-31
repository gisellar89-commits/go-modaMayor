"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import VariantsTable, { Variant } from "../../../components/VariantsTable";
import AddStockModal from "../../../components/AddStockModal";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchProducts, fetchCategories } from "../../../utils/api";
import { fetchProductsPaged } from "../../../utils/api"; // Added import for fetchProductsPaged

interface Product {
  ID?: number;
  id?: number;
  name: string;
  description: string;
  category_id: string;
  subcategory: { id?: number; name?: string } | null;
  image_url: string;
  cost_price: string;
  variant_type: string;
  category?: { name: string };
  talles?: string[];
  colores?: string[];
}

interface Category {
  ID?: number;
  id?: number;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminProductosPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Estado para variantes originales y actuales (debe ir dentro del componente)
  const [originalVariants, setOriginalVariants] = useState<Variant[]>([]);
  const [currentVariants, setCurrentVariants] = useState<Variant[]>([]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(25);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product> & {
    talles?: string[];
    colores?: string[];
    talleInput?: string;
    colorInput?: string;
  }>({
    name: "",
    description: "",
    category_id: "",
    subcategory: null,
    image_url: "",
    cost_price: "",
    variant_type: "sin_variantes",
    talles: [],
    colores: [],
    talleInput: "",
    colorInput: ""
  });
  // Estado local para descuentos
  const [discountType, setDiscountType] = useState<string>("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  // modal flow removed in favor of dedicated stocks page
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? false;

  useEffect(() => {
    if (!user || !["admin", "encargado", "vendedor"].includes(user.role)) return;
    const token = localStorage.getItem("token") ?? undefined;
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchProductsPaged({ token, page, limit: pageSize }),
      fetchCategories(token)
    ])
      .then(([prodPaged, cat]) => {
        setProducts(Array.isArray(prodPaged.items) ? prodPaged.items : []);
        setTotal(prodPaged.total);
        setCategories(Array.isArray(cat) ? cat : []);
      })
      .catch((e: any) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [user, page]);

  // Debounced search using ref
  const searchTimerRef = useRef<number | undefined>(undefined);
  const onSearchChange = (q: string) => {
    setSearchValue(q); // Actualizar el valor del input
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    
    // Si el query está vacío, cargar todos los productos inmediatamente
    if (q.trim() === "") {
      searchTimerRef.current = window.setTimeout(async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token") ?? undefined;
          const res = await fetchProductsPaged({ token, page: 1, limit: pageSize });
          setProducts(res.items);
          setTotal(res.total);
          setPage(1);
        } catch (e: any) {
          setError(e.message || String(e));
        } finally {
          setLoading(false);
        }
      }, 300) as unknown as number;
      return;
    }
    
    searchTimerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") ?? undefined;
        console.log('🔍 Buscando:', q); // Debug
        const res = await fetchProductsPaged({ token, search: q, page: 1, limit: pageSize });
        console.log('📦 Resultados:', res); // Debug
        setProducts(res.items);
        setTotal(res.total);
        setPage(1);
      } catch (e: any) {
        console.error('❌ Error en búsqueda:', e); // Debug
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }, 800) as unknown as number;
  };

  // Handler para Enter: búsqueda inmediata
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
      
      console.log('⚡ Enter presionado, buscando:', searchValue); // Debug
      setLoading(true);
      const token = localStorage.getItem("token") ?? undefined;
      fetchProductsPaged({ token, search: searchValue.trim(), page: 1, limit: pageSize })
        .then(res => {
          console.log('✅ Resultados con Enter:', res); // Debug
          setProducts(res.items);
          setTotal(res.total);
          setPage(1);
        })
        .catch((e: any) => {
          console.error('❌ Error con Enter:', e); // Debug
          setError(e.message || String(e));
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (form.category_id) {
        const _token = localStorage.getItem("token") ?? undefined;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        fetch(`${API_URL}/categories/${form.category_id}/subcategories`, {
        headers: _token ? { Authorization: `Bearer ${_token}` } : {}
      })
        .then(res => res.json())
        .then(setSubcategories);
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [form.category_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Sincronización de variantes al editar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setSaving(true);
  setSuccessMsg(null);
  setErrorMsg(null);
  let createdIdLocal: number | null = null;
    try {
  const token = localStorage.getItem("token") ?? undefined;
  let res: Response;
  let nuevo: any;
      const { subcategory, ...restForm } = form;
      const body: any = {
        ...restForm,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        subcategory_id: subcategoryId ? Number(subcategoryId) : undefined,
        cost_price: form.cost_price ? Number(form.cost_price) : undefined,
        talles: form.talles,
        colores: form.colores
      };
      // Incluir descuentos si se especificaron en el formulario
      body.discount_type = discountType;
      body.discount_value = discountValue;
      delete body.talleInput;
      delete body.colorInput;
      if (form.id) {
        res = await fetch(`${API_URL}/products/${form.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(body)
        });
        nuevo = await res.json();
        if (!res.ok) {
          setErrorMsg(nuevo.error || "No se pudo editar el producto");
          throw new Error(nuevo.error || "No se pudo editar el producto");
        }
        setSuccessMsg("Producto guardado exitosamente");

        // --- Sincronización de variantes ---
        // Eliminar variantes que ya no están
        for (const orig of originalVariants) {
          if (!currentVariants.find(v => (v.ID || v.id) === (orig.ID || orig.id))) {
            await fetch(`${API_URL}/variants/${orig.ID || orig.id}`, {
              method: "DELETE",
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
          }
        }
        // Crear variantes nuevas (sin ID)
        for (const v of currentVariants) {
          if (!v.ID && !v.id) {
            await fetch(`${API_URL}/products/${form.id}/variants`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(v)
            });
          }
        }
        // Actualizar variantes editadas (con ID y que hayan cambiado)
        for (const v of currentVariants) {
          const orig = originalVariants.find(o => (o.ID || o.id) === (v.ID || v.id));
          if (orig && (orig.size !== v.size || orig.color !== v.color || orig.sku !== v.sku)) {
            await fetch(`${API_URL}/variants/${v.ID || v.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(v)
            });
          }
        }
        // --- Fin sincronización variantes ---

        // Recargar la lista de productos desde el backend para asegurar que venga la relación category y variantes
        const prodList = await fetchProducts(token);
        setProducts(Array.isArray(prodList) ? prodList : []);
      } else {
        res = await fetch(`${API_URL}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(body)
        });
        const rawText = await res.text();
        console.log("DEBUG: Respuesta cruda de creación de producto:", rawText);
        if (!res.ok) throw new Error("No se pudo crear el producto");
        try {
          nuevo = JSON.parse(rawText);
        } catch (e) {
          console.error("DEBUG: Error al parsear JSON de producto", e, rawText);
          nuevo = null;
        }
        console.log("DEBUG: Objeto producto parseado:", nuevo);
        // Crear variantes después de crear el producto base
        console.log("DEBUG: Entrando a bloque de variantes (creación)", { nuevo, form, currentVariants });
        if (nuevo && nuevo.ID) {
          const createdId = nuevo.ID || nuevo.id;
          createdIdLocal = createdId;
          // Si el usuario ya agregó variantes en la UI (currentVariants), persistirlas.
          if (Array.isArray(currentVariants) && currentVariants.length > 0) {
            const createdVariants: any[] = [];
            const seenSku = new Set<string>();
            let idxCounter = 0;
            for (const v of currentVariants) {
              try {
                // prepare SKU: use existing or generate if empty
                let skuRaw = (v.sku || '').toString().trim();
                if (!skuRaw) {
                  // generate deterministic-ish SKU based on product name + counter
                  skuRaw = `${(nuevo.name || '').slice(0,3).toUpperCase() || 'SKU'}-AUTO-${idxCounter}`;
                }
                idxCounter++;
                // dedupe by SKU locally
                const skuKey = skuRaw.toUpperCase();
                if (seenSku.has(skuKey)) {
                  console.warn('Saltando variante duplicada por SKU:', skuRaw);
                  continue;
                }
                seenSku.add(skuKey);

                const maybeFile: any = (v as any).__file || (v as any).image_file || (v as any).file || null;
                const payload: any = { ...v, sku: skuRaw };
                delete payload.ID;
                delete payload.id;
                delete payload.product_id;
                delete (payload as any).__file;
                delete (payload as any).image_file;
                delete (payload as any).file;
                let resp = await fetch(`${API_URL}/products/${createdId}/variants`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(payload)
                });
                let createdVariant: any = null;
                if (!resp.ok) {
                  // try parse JSON error first, fallback to text
                  let txt = '';
                  try {
                    const j = await resp.json();
                    if (j && typeof j === 'object') {
                      txt = (j.error && typeof j.error === 'string') ? j.error : JSON.stringify(j);
                    } else {
                      txt = JSON.stringify(j);
                    }
                  } catch (e) {
                    try {
                      txt = await resp.text();
                    } catch (e2) {
                      txt = '';
                    }
                  }
                  console.error('Error creando variante (primera respuesta)', txt);
                  // Si es error de llave duplicada, intentamos con sufijos en el SKU
                  if (txt && txt.includes('uni_product_variants_sku')) {
                    const originalSku = payload.sku ?? skuRaw;
                    for (let attempt = 1; attempt <= 5; attempt++) {
                      try {
                        const newSku = `${originalSku}-${attempt}`;
                        payload.sku = newSku;
                        resp = await fetch(`${API_URL}/products/${createdId}/variants`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify(payload)
                        });
                        if (resp.ok) {
                          createdVariant = await resp.json();
                          // register new SKU in seen set
                          seenSku.add(newSku.toUpperCase());
                          break;
                        } else {
                          // again try parse JSON then text for the retry failure message
                          let t2 = '';
                          try {
                            const j2 = await resp.json();
                            t2 = (j2 && j2.error) ? j2.error : JSON.stringify(j2);
                          } catch (e3) {
                            try { t2 = await resp.text(); } catch (e4) { t2 = ''; }
                          }
                          console.warn('Retry attempt', attempt, 'failed:', t2);
                          if (!(t2 && t2.includes('uni_product_variants_sku'))) break; // different error, stop retrying
                        }
                      } catch (retryErr) {
                        console.error('Retry error creating variant', retryErr);
                        break;
                      }
                    }
                    if (!createdVariant) {
                      console.error('No se pudo crear la variante tras reintentos por SKU duplicado');
                      continue;
                    }
                  } else {
                    continue;
                  }
                } else {
                  createdVariant = await resp.json();
                }
                console.log('Creada variante', createdVariant);
                // Si la variante tenía un archivo local, subirlo ahora
                if (maybeFile && createdVariant && (createdVariant.ID || createdVariant.id)) {
                  try {
                    const fd = new FormData();
                    fd.append('image', maybeFile);
                    const up = await fetch(`${API_URL}/variants/${createdVariant.ID || createdVariant.id}/image`, {
                      method: 'POST',
                      headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                      },
                      body: fd
                    });
                    if (up.ok) {
                      const uv = await up.json();
                      // merge image_url if returned
                      createdVariant.image_url = uv.image_url ?? uv.ImageURL ?? createdVariant.image_url;
                    } else {
                      const upText = await up.text();
                      console.error('Resultado upload imagen variante', up.status, upText);
                    }
                  } catch (err) {
                    console.error('Error subiendo imagen de variante', err);
                  }
                }
                createdVariants.push(createdVariant);
              } catch (err) {
                console.error('ERROR al crear variante', v, err);
              }
            }
            // Actualizar el estado para quedarse en la página de edición
            setForm(f => ({ ...f, id: createdId } as any));
            setCurrentVariants(createdVariants);
            setOriginalVariants(createdVariants);
            setSuccessMsg('Producto y variantes creadas correctamente');
            // No redirigimos automáticamente; el usuario puede ir a Stocks con el botón
          } else {
            // fallback: generar combinaciones a partir de talles/colores como antes
            const variantes: { color?: string; size?: string; sku?: string }[] = [];
            if (Array.isArray(form.talles) && form.talles.length > 0 && Array.isArray(form.colores) && form.colores.length > 0) {
              for (const size of form.talles) {
                for (const color of form.colores) {
                  variantes.push({
                    size,
                    color,
                    sku: `${(nuevo.name || '').slice(0,3).toUpperCase() || 'SKU'}-${color.toUpperCase().slice(0,3)}-${size.toString().toUpperCase()}`
                  });
                }
              }
            } else if (Array.isArray(form.talles) && form.talles.length > 0) {
              for (const size of form.talles) {
                variantes.push({
                  size,
                  sku: `${(nuevo.name || '').slice(0,3).toUpperCase() || 'SKU'}-UNQ-${size.toString().toUpperCase()}`
                });
              }
            } else if (Array.isArray(form.colores) && form.colores.length > 0) {
              for (const color of form.colores) {
                variantes.push({
                  color,
                  sku: `${(nuevo.name || '').slice(0,3).toUpperCase() || 'SKU'}-${color.toUpperCase().slice(0,3)}`
                });
              }
            }
            console.log("DEBUG: Variantes a crear (auto):", variantes);
            const failedAuto: any[] = [];
            const createdVariantsAuto: any[] = [];
            let autoIdx = 0;
            for (const variante of variantes) {
              autoIdx++;
              try {
                // build a safer SKU that includes the created product id to avoid clashes
                const baseSku = (variante.sku || `${(nuevo.name || '').slice(0,3).toUpperCase()}`);
                const payload: any = { ...variante };
                payload.sku = `${baseSku}-${createdId}-${autoIdx}`;
                // try initial create
                let resp = await fetch(`http://localhost:8080/products/${createdId}/variants`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                  // parse JSON or text
                  let txt = '';
                  try {
                    const j = await resp.json();
                    txt = (j && j.error) ? j.error : JSON.stringify(j);
                  } catch (e) {
                    try { txt = await resp.text(); } catch (e2) { txt = ''; }
                  }
                  console.warn('Auto create failed first attempt', txt, 'for', payload.sku);
                  // if duplicate SKU, try some suffixes
                  if (txt && txt.includes('uni_product_variants_sku')) {
                    let createdVariant: any = null;
                    for (let attempt = 1; attempt <= 5; attempt++) {
                      try {
                        const newSku = `${payload.sku}-${attempt}`;
                        payload.sku = newSku;
                        resp = await fetch(`http://localhost:8080/products/${createdId}/variants`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify(payload)
                        });
                        if (resp.ok) {
                          createdVariant = await resp.json();
                          console.log('Auto created variant after retry', createdVariant);
                          break;
                        } else {
                          let t2 = '';
                          try { const j2 = await resp.json(); t2 = (j2 && j2.error) ? j2.error : JSON.stringify(j2); } catch (e3) { try { t2 = await resp.text(); } catch (e4) { t2 = ''; } }
                          console.warn('Auto retry attempt', attempt, 'failed:', t2);
                          if (!(t2 && t2.includes('uni_product_variants_sku'))) break;
                        }
                      } catch (retryErr) {
                        console.error('Auto retry error creating variant', retryErr);
                        break;
                      }
                    }
                    if (!resp.ok) {
                      // after retries still failing
                      failedAuto.push({ variant: variante, reason: txt });
                      continue;
                    }
                  } else {
                    // other error, collect
                    failedAuto.push({ variant: variante, reason: txt });
                    continue;
                  }
                } else {
                  const okv = await resp.json();
                  console.log("DEBUG: POST /products/" + createdId + "/variants", payload, "->", resp.status, okv);
                  createdVariantsAuto.push(okv);
                }
              } catch (err) {
                console.error("ERROR al crear variante", variante, err);
                failedAuto.push({ variant: variante, reason: String(err) });
              }
            }
            console.log("DEBUG: Fin de creación de variantes (auto)", { failedAuto, createdVariantsAuto });
            // update UI with created auto variants so user can upload images
            if (createdVariantsAuto.length > 0) {
              setCurrentVariants(createdVariantsAuto);
              setOriginalVariants(createdVariantsAuto);
              setForm(f => ({ ...f, id: createdId } as any));
              setSuccessMsg('Variantes creadas correctamente');
              setVariantsOpen(true);
              // redirect to edit page so user can manage variants and stocks there
              window.location.href = `/admin/productos/${createdId}`;
              return; // stop further processing
            }
            if (failedAuto.length > 0) {
              setErrorMsg(`No se pudieron crear ${failedAuto.length} variantes automáticamente. Revisa la consola para más detalles.`);
            }
          }
          // No redirigimos automáticamente: el usuario puede ir a Stocks usando el botón "Ir a Stocks".
        } else {
          console.log("DEBUG: No entra a creación de variantes", { nuevo, form });
        }
        // Recargar la lista de productos desde el backend para asegurar que venga la relación category
        const prodList = await fetchProducts(token);
        setProducts(Array.isArray(prodList) ? prodList : []);
      }
      // Si se creó un producto nuevo (createdIdLocal), nos quedamos en el formulario en modo edición
      if (!createdIdLocal) {
        setShowForm(false);
        setForm({
          name: "",
          description: "",
          category_id: "",
          subcategory: null,
          image_url: "",
          cost_price: "",
          variant_type: "sin_variantes",
          talles: [],
          colores: [],
          talleInput: "",
          colorInput: ""
        });
      } else {
        // keep the form open and show variants panel for the newly created product
        setShowForm(true);
        setVariantsOpen(true);
      }
    } catch (e: any) {
  setErrorMsg("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <main>Cargando...</main>;
  if (!user || !["admin", "encargado", "vendedor"].includes(user.role)) return <main>No tienes permisos para ver esta página.</main>;
  if (error) return <main className="text-red-500">{error}</main>;

  const isVendedor = user.role === "vendedor";

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isVendedor ? "Listado de productos" : "Administración de productos"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isVendedor ? "Consulta el catálogo de productos y precios" : "Gestiona el catálogo de productos, precios y variantes"}
        </p>
      </div>

      {/* Navigation tabs */}
      {!isVendedor && (
        <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-2">
          <Link href="/admin/productos" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">Productos</Link>
          <Link href="/admin/subcategorias" className="text-gray-600 hover:text-gray-900">Subcategorías</Link>
          <Link href="/admin/categorias" className="text-gray-600 hover:text-gray-900">Categorías</Link>
        </nav>
      )}

      {/* Search and actions bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              placeholder="Buscar por nombre, categoría o subcategoría... (presiona Enter)"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={pageSize} 
            onChange={async (e) => {
              const v = Number(e.target.value);
              setPageSize(v);
              setPage(1);
              setLoading(true);
              const token = localStorage.getItem("token") ?? undefined;
              const res = await fetchProductsPaged({ token, page: 1, limit: v });
              setProducts(res.items);
              setTotal(res.total);
              setLoading(false);
            }}
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
          {!isVendedor && (
            <Link
              href="/admin/productos/nuevo"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition whitespace-nowrap inline-block"
            >
              + Crear producto
            </Link>
          )}
        </div>
        {total !== undefined && (
          <div className="text-sm text-gray-600 mt-2">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </div>
        )}
      </div>
      {showForm && (
        <form ref={formRef} className="mb-6 p-4 border rounded bg-gray-50 max-w-xl" onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} required className="border px-2 py-1 rounded w-full" />
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Descripción</label>
            <input name="description" value={form.description} onChange={handleChange} className="border px-2 py-1 rounded w-full" />
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required className="border px-2 py-1 rounded w-full">
              <option value="">Selecciona categoría</option>
              {categories.map(cat => (
                <option key={cat.id || cat.ID} value={cat.id || cat.ID}>{cat.name}</option>
              ))}
            </select>
          </div>
          {subcategories.length > 0 && (
            <div className="mb-2">
              <label className="block font-semibold mb-1">Subcategoría</label>
              <select name="subcategory_id" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} required className="border px-2 py-1 rounded w-full">
                <option value="">Selecciona subcategoría</option>
                {subcategories.map(sub => (
                  <option key={sub.id || sub.ID} value={sub.id || sub.ID}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-2">
            <label className="block font-semibold mb-1">Imagen (URL)</label>
            <input name="image_url" value={form.image_url} onChange={handleChange} className="border px-2 py-1 rounded w-full" />
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Precio costo</label>
            <input name="cost_price" type="number" min={0} value={form.cost_price} onChange={handleChange} required className="border px-2 py-1 rounded w-full" />
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Descuento</label>
            <div className="flex gap-2 items-center">
              <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="border px-2 py-1 rounded">
                <option value="none">Ninguno</option>
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo</option>
              </select>
              <input type="number" min={0} step="0.01" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="border px-2 py-1 rounded w-32" />
            </div>
            <div className="text-sm text-gray-600 mt-1">Vista previa precio: {(() => {
              const base = Number(form.cost_price || 0);
              const wholesale = Number(form.cost_price || 0); // usaremos cost como base temporal
              let final = wholesale;
              if (discountType === 'percent') final = wholesale * (1 - (discountValue || 0) / 100);
              if (discountType === 'fixed') final = wholesale - (discountValue || 0);
              if (final < 0) final = 0;
              return `$${final.toFixed(2)}`;
            })()}</div>
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Tipo de variantes</label>
            <select name="variant_type" value={form.variant_type} onChange={handleChange} className="border px-2 py-1 rounded w-full">
              <option value="sin_variantes">Sin variantes</option>
              <option value="talle_unico">Talle único</option>
              <option value="color_surtido">Color surtido</option>
              <option value="ambos">Talle y color</option>
            </select>
          </div>
          {(form.variant_type === "talle_unico" || form.variant_type === "ambos") && (
            <div className="mb-2">
              <label className="block font-semibold mb-1">Talles</label>
              <div className="flex gap-2 mb-1">
                <input
                  type="text"
                  placeholder="Agregar talle"
                  value={form.talleInput || ""}
                  onChange={e => setForm(f => ({ ...f, talleInput: e.target.value }))}
                  className="border px-2 py-1 rounded w-full"
                />
                <button
                  type="button"
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    if (form.talleInput && !form.talles?.includes(form.talleInput)) {
                      setForm(f => ({
                        ...f,
                        talles: [...(f.talles || []), f.talleInput!],
                        talleInput: ""
                      }));
                    }
                  }}
                >Agregar</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.talles?.map((t, idx) => (
                  <span key={t} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                    {t}
                    <button
                      type="button"
                      className="ml-2 text-red-600"
                      onClick={() => setForm(f => ({ ...f, talles: f.talles?.filter((x, i) => i !== idx) }))}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {(form.variant_type === "color_surtido" || form.variant_type === "ambos") && (
            <div className="mb-2">
              <label className="block font-semibold mb-1">Colores</label>
              <div className="flex gap-2 mb-1">
                <input
                  type="text"
                  placeholder="Agregar color"
                  value={form.colorInput || ""}
                  onChange={e => setForm(f => ({ ...f, colorInput: e.target.value }))}
                  className="border px-2 py-1 rounded w-full"
                />
                <button
                  type="button"
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    if (form.colorInput && !form.colores?.includes(form.colorInput)) {
                      setForm(f => ({
                        ...f,
                        colores: [...(f.colores || []), f.colorInput!],
                        colorInput: ""
                      }));
                    }
                  }}
                >Agregar</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colores?.map((c, idx) => (
                  <span key={c} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                    {c}
                    <button
                      type="button"
                      className="ml-2 text-red-600"
                      onClick={() => setForm(f => ({ ...f, colores: f.colores?.filter((x, i) => i !== idx) }))}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Tabla de variantes (panel colapsable) solo al editar */}
          {form.id && (
            <div className="mb-4 w-full">
              <button
                type="button"
                className="w-full flex justify-between items-center bg-white border px-3 py-2 rounded"
                onClick={() => setVariantsOpen(v => !v)}
                aria-expanded={variantsOpen}
              >
                <span className="font-semibold">Variantes</span>
                <span className="text-sm text-gray-600">{variantsOpen ? 'Ocultar' : 'Mostrar'}</span>
              </button>
              <div className={`mt-2 transition-max-h duration-300 overflow-hidden ${variantsOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="border rounded bg-white p-3">
                  <VariantsTable
                    productId={form.id}
                    show={!!form.id}
                    variants={currentVariants}
                    setVariants={setCurrentVariants}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-semibold" disabled={saving}>
              {saving ? "Guardando..." : "Guardar producto"}
            </button>
            {form.id && (
              <button type="button" className="bg-gray-600 text-white px-3 py-2 rounded" onClick={() => window.location.href = `/admin/productos/${form.id}/stocks`}>
                Ir a Stocks
              </button>
            )}
          </div>
        </form>
      )}
  {successMsg && (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
      {successMsg}
      <button onClick={() => setSuccessMsg(null)} className="float-right font-bold">×</button>
    </div>
  )}
  {errorMsg && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {errorMsg}
      <button onClick={() => setErrorMsg(null)} className="float-right font-bold">×</button>
    </div>
  )}
  {/* Modal flow removed: use the dedicated stocks page instead */}
  <h2 className="text-xl font-semibold mb-4 text-gray-900">Listado de productos</h2>
      
      {/* Info bar */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Mostrando {products.length} productos
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center text-sm font-medium text-gray-700">
          <div className="w-12">ID</div>
          <div className="w-1/4">Producto</div>
          <div className="w-32">Código</div>
          <div className="flex-1">Categoría</div>
          <div className="w-40">Precios</div>
          {!isVendedor && <div className="w-32 text-center">Acciones</div>}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {products.map((prod) => {
            const id = prod.ID || prod.id;
            const costPrice = Number(prod.cost_price || 0);
            // Usar los precios guardados en la base de datos
            const wholesalePrice = Number((prod as any).wholesale_price || 0);
            const discount1Price = Number((prod as any).discount1_price || 0);
            const discount2Price = Number((prod as any).discount2_price || 0);
            // Calcular precio final (puede tener descuento adicional)
            let finalPrice = wholesalePrice;
            if ((prod as any).discount_type === 'percent') {
              finalPrice = wholesalePrice * (1 - (Number((prod as any).discount_value || 0) / 100));
            } else if ((prod as any).discount_type === 'fixed') {
              finalPrice = wholesalePrice - Number((prod as any).discount_value || 0);
            }
            if (finalPrice < 0) finalPrice = 0;

            return (
              <div key={id} className="px-4 py-4 hover:bg-gray-50 flex items-center">
                <div className="w-12 text-sm text-gray-600">{id}</div>
                
                <div className="w-1/4 flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
                    {prod.image_url ? (
                      <img 
                        src={prod.image_url.startsWith('/') ? `http://localhost:8080${prod.image_url}` : prod.image_url} 
                        alt={prod.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{prod.name}</div>
                    <div className="text-xs text-gray-500">{prod.description || "Sin descripción"}</div>
                  </div>
                </div>
                
                <div className="w-32 text-sm text-gray-700">
                  PROD-{String(id).padStart(5, '0')}
                </div>
                
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{prod.category?.name || "Sin categoría"}</div>
                  {prod.subcategory?.name && (
                    <div className="text-xs text-gray-500">{prod.subcategory.name}</div>
                  )}
                </div>
                
                <div className="w-40">
                  <div className="text-xs space-y-0.5">
                    {!isVendedor && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Costo:</span>
                        <span className="font-medium text-gray-700">${costPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mayor:</span>
                      <span className="font-medium text-gray-900">${wholesalePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Desc1:</span>
                      <span className="font-medium text-blue-600">${discount1Price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Desc2:</span>
                      <span className="font-medium text-green-600">${discount2Price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {!isVendedor && (
                  <div className="w-32 flex items-center justify-center gap-2">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded transition" 
                      title="Ver inventario"
                      onClick={() => {
                        window.location.href = `/admin/inventario?search=PROD-${String(id).padStart(5, '0')}`;
                      }}
                    >
                      <Image src="/box.svg" alt="Inventario" width={20} height={20} />
                    </button>

                    <button 
                      className="p-2 hover:bg-gray-100 rounded transition" 
                      title="Editar"
                      onClick={() => {
                        window.location.href = `/admin/productos/${id}`;
                      }}
                    >
                      <Image src="/edit.svg" alt="Editar" width={20} height={20} />
                    </button>

                    <button 
                      className="p-2 hover:bg-gray-100 rounded transition" 
                      title="Eliminar"
                      onClick={async () => {
                        if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
                        try {
                          const token = localStorage.getItem("token") ?? undefined;
                          const res = await fetch(`http://localhost:8080/products/${id}`, {
                            method: "DELETE",
                            headers: {
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            }
                          });
                          if (!res.ok) throw new Error("No se pudo eliminar el producto");
                          setProducts(products.filter(p => (p.ID || p.id) !== id));
                        } catch (e: any) {
                          alert("Error al eliminar: " + (e.message || String(e)));
                        }
                      }}
                    >
                      <Image src="/trash.svg" alt="Eliminar" width={20} height={20} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Página {page} de {total ? Math.max(1, Math.ceil(total / pageSize)) : 1}
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition" 
            disabled={page === 1}
            onClick={async () => {
              if (page === 1) return;
              const token = localStorage.getItem("token") ?? undefined;
              setPage(1);
              setLoading(true);
              const res = await fetchProductsPaged({ token, page: 1, limit: pageSize });
              setProducts(res.items);
              setTotal(res.total);
              setLoading(false);
            }}
          >
            Primera
          </button>
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition" 
            disabled={page <= 1}
            onClick={async () => {
              if (page <= 1) return;
              const token = localStorage.getItem("token") ?? undefined;
              const np = page - 1;
              setPage(np);
              setLoading(true);
              const res = await fetchProductsPaged({ token, page: np, limit: pageSize });
              setProducts(res.items);
              setTotal(res.total);
              setLoading(false);
            }}
          >
            Anterior
          </button>

          <div className="flex gap-1">
            {(() => {
              const pages: number[] = [];
              const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1;
              const start = Math.max(1, page - 2);
              const end = Math.min(totalPages, page + 2);
              for (let p = start; p <= end; p++) pages.push(p);
              return pages.map(p => (
                <button 
                  key={p} 
                  className={`min-w-[2.5rem] px-3 py-2 border rounded-md text-sm font-medium transition ${
                    p === page 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`} 
                  onClick={async () => {
                    if (p === page) return;
                    const token = localStorage.getItem("token") ?? undefined;
                    setPage(p);
                    setLoading(true);
                    const res = await fetchProductsPaged({ token, page: p, limit: pageSize });
                    setProducts(res.items);
                    setTotal(res.total);
                    setLoading(false);
                  }}
                >
                  {p}
                </button>
              ))
            })()}
          </div>

          <button 
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition" 
            disabled={page >= (total ? Math.max(1, Math.ceil(total / pageSize)) : page)}
            onClick={async () => {
              const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : page;
              if (page >= totalPages) return;
              const token = localStorage.getItem("token") ?? undefined;
              const np = page + 1;
              setPage(np);
              setLoading(true);
              const res = await fetchProductsPaged({ token, page: np, limit: pageSize });
              setProducts(res.items);
              setTotal(res.total);
              setLoading(false);
            }}
          >
            Siguiente
          </button>
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition" 
            disabled={page >= (total ? Math.max(1, Math.ceil(total / pageSize)) : page)}
            onClick={async () => {
              const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : page;
              if (page >= totalPages) return;
              const token = localStorage.getItem("token") ?? undefined;
              setPage(totalPages);
              setLoading(true);
              const res = await fetchProductsPaged({ token, page: totalPages, limit: pageSize });
              setProducts(res.items);
              setTotal(res.total);
              setLoading(false);
            }}
          >
            Última
          </button>
        </div>
      </div>
    </main>
  );
}