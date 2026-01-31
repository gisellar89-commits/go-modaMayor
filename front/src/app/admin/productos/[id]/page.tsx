"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VariantsTable from "../../../../components/VariantsTable";
import { fetchProductById, fetchCategories } from "../../../../utils/api";

export default function EditarProductoPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sizeTypes, setSizeTypes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [origCost, setOrigCost] = useState<number>(0);
  const [pctWholesale, setPctWholesale] = useState<number>(0);
  const [pctDiscount1, setPctDiscount1] = useState<number>(0);
  const [pctDiscount2, setPctDiscount2] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'stock'>('info');
  const [locationStocks, setLocationStocks] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  // Auto-cerrar mensajes después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? undefined;
    const pid = Array.isArray(id) ? id[0] : id;
    
    Promise.all([
      fetchProductById(pid, token),
      fetchCategories(token),
      fetch(`${API_URL}/suppliers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/size-types`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/public/colors`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/location-stocks?product_id=${pid}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/public/seasons`).then(r => r.ok ? r.json() : [])
    ])
      .then(([prod, cats, supps, sizes, cols, stocks, seas]) => {
        console.log('DEBUG - Product data:', {
          size_type_id: prod.size_type_id,
          variantsCount: prod.variants?.length || 0,
          sampleVariant: prod.variants?.[0]
        });
        console.log('DEBUG - Size types:', sizes);
        
        setProduct(prod);
        setVariants(prod.variants || []);
        setCategories(Array.isArray(cats) ? cats : []);
        setSuppliers(Array.isArray(supps) ? supps : []);
        setSizeTypes(Array.isArray(sizes) ? sizes : []);
        setColors(Array.isArray(cols) ? cols : []);
        setLocationStocks(Array.isArray(stocks) ? stocks : []);
        setSeasons(Array.isArray(seas) ? seas : []);
        
        // Cargar subcategorías si hay categoría
        if (prod.category_id) {
          fetch(`${API_URL}/categories/${prod.category_id}/subcategories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(r => r.ok ? r.json() : [])
            .then(subs => setSubcategories(Array.isArray(subs) ? subs : []));
        }
        
        // Inicializar porcentajes relativos para recálculo local
        const c = Number(prod.cost_price ?? prod.CostPrice ?? 0) || 0;
        const w = Number(prod.wholesale_price ?? prod.WholesalePrice ?? 0) || 0;
        const d1 = Number(prod.discount1_price ?? prod.Discount1Price ?? 0) || 0;
        const d2 = Number(prod.discount2_price ?? prod.Discount2Price ?? 0) || 0;
        setOrigCost(c);
        setPctWholesale(c > 0 ? (w / c - 1) : 0);
        setPctDiscount1(c > 0 ? (d1 / c - 1) : 0);
        setPctDiscount2(c > 0 ? (d2 / c - 1) : 0);
      })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token") ?? undefined;
      
      // Determinar variant_type basándose en size_type.key + si tiene variantes con colores
      let variantType = 'sin_variantes';
      let sizeTypeKey: string | undefined = undefined;
      
      // Buscar el key del size_type seleccionado
      if (product.size_type_id && sizeTypes.length > 0) {
        const sizeType = sizeTypes.find((st: any) => st.id === product.size_type_id);
        if (sizeType) {
          sizeTypeKey = sizeType.key;
        }
      }
      
      // Verificar si hay variantes con colores
      const hasColors = variants && variants.length > 0 && variants.some((v: any) => v.color && v.color.trim() !== '');
      const hasSizeVariants = sizeTypeKey && sizeTypeKey !== 'unico'; // "unico" = sin talles
      
      if (hasSizeVariants && hasColors) {
        variantType = 'ambos';
      } else if (hasSizeVariants) {
        variantType = 'talle_unico';
      } else if (hasColors) {
        variantType = 'color_surtido';
      }
      // Si no hay colores ni size_type (o es 'unico'), queda 'sin_variantes'
      
      console.log('Actualizando producto con variant_type:', variantType, { 
        sizeTypeKey,
        hasColors,
        hasSizeVariants,
        variantsCount: variants.length
      });
      
      // Enviar campos editables (incluye nuevos campos)
      const body: any = {
        name: product.name,
        description: product.description,
        category_id: product.category_id ? Number(product.category_id) : null,
        subcategory_id: product.subcategory_id ? Number(product.subcategory_id) : null,
        supplier_id: product.supplier_id ? Number(product.supplier_id) : null,
        season_id: product.season_id ? Number(product.season_id) : null,
        year: product.year ? Number(product.year) : null,
        size_type_id: product.size_type_id ? Number(product.size_type_id) : null,
        total_stock: product.total_stock ? Number(product.total_stock) : null,
        image_url: product.image_url || '',
        cost_price: Number(product.cost_price || 0),
        variant_type: variantType, // Auto-calculado basado en variantes
        discount_type: product.discount_type || 'none',
        discount_value: Number(product.discount_value || 0),
        is_new_arrival: product.is_new_arrival || false,
        is_featured: product.is_featured || false,
        is_offer: product.is_offer || false,
        is_trending: product.is_trending || false
      };
      const res = await fetch(`http://localhost:8080/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el producto");
      const updated = await res.json();
      setProduct(updated);
      setSuccess("Producto actualizado exitosamente");
      // Redirigir al listado de productos después de guardar
      setTimeout(() => {
        router.push('/admin/productos');
      }, 1500);
    } catch (e: any) {
      setError(e.message || String(e));
      // Scroll al top para ver el error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`http://localhost:8080/products/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el producto");
      setSuccess("✅ Producto eliminado exitosamente. Redirigiendo...");
      // Redirigir al listado después de 2 segundos
      setTimeout(() => {
        router.push('/admin/productos');
      }, 2000);
    } catch (e: any) {
      setError(e.message || String(e));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para manejar selección de archivos (máximo 3)
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const availableSlots = 3 - imageFiles.length;
    const filesToAdd = newFiles.slice(0, availableSlots);
    
    if (filesToAdd.length === 0) {
      alert('Ya tienes 3 imágenes seleccionadas. Elimina alguna para agregar más.');
      return;
    }

    setImageFiles(prev => [...prev, ...filesToAdd]);

    // Generar previews
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Limpiar el input
    e.target.value = '';
  };

  // Función para eliminar una imagen del preview
  const removeImagePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Función para subir imágenes al servidor
  const uploadImages = async () => {
    if (imageFiles.length === 0) {
      setError('No hay imágenes seleccionadas para subir');
      return;
    }

    setUploadingImages(true);
    setError(null);
    setSuccess(null);
    const token = localStorage.getItem("token") ?? undefined;

    try {
      const formData = new FormData();
      
      // Mapear las imágenes a los campos específicos del backend
      const fieldNames = ['image_main', 'image_model', 'image_hanger'];
      imageFiles.forEach((file, index) => {
        formData.append(fieldNames[index], file);
      });

      const res = await fetch(`http://localhost:8080/products/${id}/images`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Imágenes subidas:", data.uploaded_images);
        
        // Actualizar el producto con las nuevas URLs
        setProduct((prev: any) => ({
          ...prev,
          image_url: data.product.image_url || prev.image_url,
          image_model: data.product.image_model || prev.image_model,
          image_hanger: data.product.image_hanger || prev.image_hanger,
        }));
        
        setSuccess(`${imageFiles.length} imagen(es) subida(s) exitosamente`);
        
        // Limpiar los archivos seleccionados
        setImageFiles([]);
        setImagePreviews([]);
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al subir imágenes');
      }
    } catch (err: any) {
      console.error("Error subiendo imágenes:", err);
      setError('Error al subir imágenes: ' + err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  if (loading) return <main>Cargando producto...</main>;
  if (error) return <main className="text-red-500">{error}</main>;
  if (!product) return <main>Producto no disponible</main>;

  // Calcular precios visibles (no editables) en base a cost_price editable y a porcentajes derivados
  const currentCost = Number(product.cost_price ?? product.CostPrice ?? 0);
  const wholesale = currentCost * (1 + pctWholesale);
  const discount1 = currentCost * (1 + pctDiscount1);
  const discount2 = currentCost * (1 + pctDiscount2);
  let finalPrice = wholesale;
  if (product.discount_type === 'percent') finalPrice = wholesale * (1 - (Number(product.discount_value || 0) / 100));
  if (product.discount_type === 'fixed') finalPrice = wholesale - Number(product.discount_value || 0);
  if (finalPrice < 0) finalPrice = 0;

  // Calcular total de stock desde location_stocks
  const calculatedTotalStock = locationStocks.reduce((sum, ls) => sum + (ls.stock || 0), 0);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar producto</h1>
        <p className="text-gray-600 mt-1">{product.name}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Información General
          </button>
          {/* Solo mostrar pestaña de Variantes si el producto tiene variantes */}
          {variants.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('variants')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'variants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Variantes ({variants.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'stock'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock por Ubicación
          </button>
        </nav>
      </div>

      <form onSubmit={handleUpdate} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Pestaña: Información General */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input 
                  type="text" 
                  value={product.name || ''} 
                  onChange={e => setProduct({ ...product, name: e.target.value })} 
                  required 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
                <input 
                  type="text" 
                  value={product.image_url || ''} 
                  onChange={e => setProduct({ ...product, image_url: e.target.value })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea 
                value={product.description || ''} 
                onChange={e => setProduct({ ...product, description: e.target.value })} 
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" 
              />
            </div>

            {/* Gestión de Imágenes */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Imágenes del Producto</h3>
              
              {/* Imágenes actuales */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Imágenes actuales</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Imagen Principal */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase">Principal</span>
                      {product.image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar imagen principal?')) {
                              setProduct({ ...product, image_url: '' });
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    {product.image_url ? (
                      <img 
                        src={product.image_url.startsWith('/') ? `http://localhost:8080${product.image_url}` : product.image_url} 
                        alt="Principal" 
                        className="w-full h-40 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Imagen Con Modelo */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-600 uppercase">Con Modelo</span>
                      {product.image_model && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar imagen con modelo?')) {
                              setProduct({ ...product, image_model: '' });
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    {product.image_model ? (
                      <img 
                        src={product.image_model.startsWith('/') ? `http://localhost:8080${product.image_model}` : product.image_model} 
                        alt="Con Modelo" 
                        className="w-full h-40 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Imagen En Perchero */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-green-600 uppercase">En Perchero</span>
                      {product.image_hanger && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar imagen en perchero?')) {
                              setProduct({ ...product, image_hanger: '' });
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    {product.image_hanger ? (
                      <img 
                        src={product.image_hanger.startsWith('/') ? `http://localhost:8080${product.image_hanger}` : product.image_hanger} 
                        alt="En Perchero" 
                        className="w-full h-40 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subir nuevas imágenes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Subir nuevas imágenes</h4>
                
                <div className="mb-3">
                  <label className="block text-sm mb-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Seleccionar imágenes
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFilesChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    Puedes seleccionar hasta 3 imágenes. Estas reemplazarán las imágenes actuales en orden: Principal, Con Modelo, En Perchero.
                  </p>
                </div>

                {/* Previews de nuevas imágenes */}
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">Imágenes seleccionadas:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {imagePreviews.map((preview, index) => {
                        const imageLabels = ['Principal', 'Con Modelo', 'En Perchero'];
                        const label = imageLabels[index] || `Imagen ${index + 1}`;
                        const badgeColor = index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-purple-600' : 'bg-green-600';
                        
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={label}
                              className="w-full h-24 object-cover rounded border border-gray-300"
                            />
                            <div className={`absolute top-1 left-1 ${badgeColor} text-white text-xs px-2 py-1 rounded shadow`}>
                              {label}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImagePreview(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition shadow"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button
                      type="button"
                      onClick={uploadImages}
                      disabled={uploadingImages}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploadingImages ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Subir Imágenes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select 
                  value={product.category_id ?? ''} 
                  onChange={e => {
                    const catId = e.target.value ? Number(e.target.value) : null;
                    setProduct({ ...product, category_id: catId, subcategory_id: null });
                    // Cargar subcategorías
                    if (catId) {
                      const token = localStorage.getItem("token") ?? undefined;
                      fetch(`http://localhost:8080/categories/${catId}/subcategories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                        .then(r => r.ok ? r.json() : [])
                        .then(subs => setSubcategories(Array.isArray(subs) ? subs : []));
                    } else {
                      setSubcategories([]);
                    }
                  }} 
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((c: any) => <option key={c.id || c.ID} value={c.id || c.ID}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                <select 
                  value={product.subcategory_id ?? ''} 
                  onChange={e => setProduct({ ...product, subcategory_id: e.target.value ? Number(e.target.value) : null })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={subcategories.length === 0}
                >
                  <option value="">Ninguna</option>
                  {subcategories.map((s: any) => <option key={s.id || s.ID} value={s.id || s.ID}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select 
                  value={product.supplier_id ?? ''} 
                  onChange={e => setProduct({ ...product, supplier_id: e.target.value ? Number(e.target.value) : null })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Ninguno</option>
                  {suppliers.map((s: any) => <option key={s.ID} value={s.ID}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
                <select 
                  value={product.season_id ?? ''} 
                  onChange={e => setProduct({ ...product, season_id: e.target.value ? Number(e.target.value) : null })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Ninguna</option>
                  {seasons.map((s: any) => (
                    <option key={s.ID} value={s.ID}>
                      {s.name} ({s.year})
                    </option>
                  ))}
                </select>
                {seasons.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No hay temporadas configuradas</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input 
                  type="number" 
                  value={product.year ?? ''} 
                  onChange={e => setProduct({ ...product, year: e.target.value ? Number(e.target.value) : '' })} 
                  placeholder="2025"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Talle</label>
                <select 
                  value={product.size_type_id ?? ''} 
                  onChange={e => setProduct({ ...product, size_type_id: e.target.value ? Number(e.target.value) : null })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={false}
                  title="Selecciona el tipo de talle que coincida con las variantes existentes"
                >
                  <option value="">Ninguno</option>
                  {sizeTypes.map((st: any) => {
                    const stId = st.id || st.ID;
                    const stName = st.name || st.key;
                    return <option key={stId} value={stId}>{stName}</option>;
                  })}
                </select>
                {variants.length > 0 && !product.size_type_id && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Selecciona el tipo que coincida con tus variantes</p>
                )}
                {variants.length > 0 && product.size_type_id && (
                  <p className="text-xs text-green-600 mt-1">✓ Configurado correctamente</p>
                )}
              </div>
            </div>

            {/* Tags para el Home */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Tags para el Home</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_new_arrival || false}
                    onChange={(e) => setProduct({ ...product, is_new_arrival: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">Nuevo Ingreso</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_featured || false}
                    onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">Destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_offer || false}
                    onChange={(e) => setProduct({ ...product, is_offer: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">En Oferta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_trending || false}
                    onChange={(e) => setProduct({ ...product, is_trending: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">Tendencia</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo *</label>
                  <input 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    value={product.cost_price ?? 0} 
                    onChange={e => setProduct({ ...product, cost_price: Number(e.target.value) })} 
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Total (Cap)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min={0} 
                      value={product.total_stock ?? ''} 
                      onChange={e => setProduct({ ...product, total_stock: e.target.value ? Number(e.target.value) : '' })} 
                      placeholder="Opcional"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" 
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">Actual: {calculatedTotalStock}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Descuento</label>
                  <select 
                    value={product.discount_type || 'none'} 
                    onChange={e => setProduct({ ...product, discount_type: e.target.value })} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="none">Ninguno</option>
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor del Descuento</label>
                  <input 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    value={product.discount_value ?? 0} 
                    onChange={e => setProduct({ ...product, discount_value: Number(e.target.value) })} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Vista Previa de Precios</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Mayorista</div>
                    <div className="text-lg font-semibold text-gray-900">${wholesale.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Descuento 1</div>
                    <div className="text-lg font-semibold text-gray-900">${discount1.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Descuento 2</div>
                    <div className="text-lg font-semibold text-gray-900">${discount2.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Precio Final</div>
                    <div className="text-xl font-bold text-blue-600">${finalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Variantes */}
        {activeTab === 'variants' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Variantes</h3>
                {(() => {
                  // Calcular variant_type basándose en size_type.key + colores
                  let calculatedVariantType = 'sin_variantes';
                  let badgeColor = 'bg-gray-100 text-gray-700';
                  let badgeText = 'Sin Variantes';
                  let sizeTypeKey: string | undefined = undefined;
                  
                  // Buscar el key del size_type seleccionado
                  if (product.size_type_id && sizeTypes.length > 0) {
                    const sizeType = sizeTypes.find((st: any) => st.id === product.size_type_id);
                    if (sizeType) {
                      sizeTypeKey = sizeType.key;
                    }
                  }
                  
                  const hasColors = variants && variants.length > 0 && variants.some((v: any) => v.color && v.color.trim() !== '');
                  const hasSizeVariants = sizeTypeKey && sizeTypeKey !== 'unico';
                  
                  if (hasSizeVariants && hasColors) {
                    calculatedVariantType = 'ambos';
                    badgeColor = 'bg-purple-100 text-purple-700';
                    badgeText = `${sizeTypeKey} + Color`;
                  } else if (hasSizeVariants) {
                    calculatedVariantType = 'talle_unico';
                    badgeColor = 'bg-blue-100 text-blue-700';
                    const sizeTypeName = sizeTypes.find((st: any) => st.id === product.size_type_id)?.name || sizeTypeKey;
                    badgeText = sizeTypeName || 'Solo Talles';
                  } else if (hasColors) {
                    calculatedVariantType = 'color_surtido';
                    badgeColor = 'bg-pink-100 text-pink-700';
                    badgeText = 'Solo Colores';
                  }
                  
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`} title={`Tipo de variante: ${calculatedVariantType}`}>
                      {badgeText}
                    </span>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => {
                  // Abrir modal o agregar fila para nueva variante manual
                  const newVariant = {
                    id: null,
                    product_id: Number(id),
                    color: '',
                    size: '',
                    sku: '',
                    color_hex: '#cccccc',
                    isNew: true
                  };
                  setVariants([...variants, newVariant]);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                + Agregar Variante Manual
              </button>
            </div>

            {/* Selección de Colores y Talles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colores del producto</label>
                <div className="flex flex-wrap gap-2">
                  {colors.length === 0 && (
                    <div className="text-sm text-gray-500">No hay colores disponibles</div>
                  )}
                  {colors.map((c: any) => {
                    const colorKey = c.key ?? String(c.id);
                    const isUsed = variants.some((v: any) => 
                      v.color?.toLowerCase() === c.name?.toLowerCase() || 
                      v.color === colorKey
                    );
                    return (
                      <div
                        key={colorKey}
                        className={`flex items-center gap-2 border px-3 py-2 rounded-md ${
                          isUsed ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: c.hex ?? '#ccc' }}
                        />
                        <span className="text-sm font-medium text-gray-900">{c.name ?? c.key}</span>
                        {isUsed && (
                          <span className="text-xs text-blue-600 ml-1">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Talles del producto</label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Extraer talles únicos de las variantes existentes
                    const usedSizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))];
                    if (usedSizes.length === 0) {
                      return <div className="text-sm text-gray-500">No hay variantes con talles</div>;
                    }
                    return usedSizes.map((size: string) => (
                      <div
                        key={size}
                        className="border bg-blue-100 border-blue-300 px-3 py-2 rounded-md"
                      >
                        <span className="text-sm font-medium text-gray-900">{size}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Tabla de Variantes Existentes */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Color</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Talle</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">SKU</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                        No hay variantes. Haz clic en &quot;Agregar Variante Manual&quot; para crear una.
                      </td>
                    </tr>
                  )}
                  {variants.map((variant: any, idx: number) => {
                    const variantId = variant.id ?? variant.ID;
                    const isNew = variant.isNew === true;
                    // Buscar el color en la lista de colores para obtener el hex
                    let colorHex = variant.color_hex || '#cccccc';
                    if (!isNew && variant.color) {
                      const matchedColor = colors.find((c: any) => 
                        c.name?.toLowerCase() === variant.color?.toLowerCase() ||
                        c.key === variant.color?.toLowerCase()
                      );
                      if (matchedColor?.hex) {
                        colorHex = matchedColor.hex;
                      }
                    }
                    
                    return (
                      <tr key={variantId ?? `new-${idx}`} className={isNew ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex items-center gap-3">
                            {isNew ? (
                              <input
                                type="color"
                                value={variant.color_hex || '#cccccc'}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[idx].color_hex = e.target.value;
                                  setVariants(updated);
                                }}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: colorHex }}
                                title={variant.color}
                              />
                            )}
                            <input
                              type="text"
                              value={variant.color || ''}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].color = e.target.value;
                                setVariants(updated);
                              }}
                              placeholder="Negro"
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-gray-900 placeholder:text-gray-400"
                              disabled={!isNew}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={variant.size || ''}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].size = e.target.value;
                              setVariants(updated);
                            }}
                            placeholder="M"
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-gray-900 placeholder:text-gray-400"
                            disabled={!isNew}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={variant.sku || ''}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].sku = e.target.value;
                              setVariants(updated);
                            }}
                            placeholder="SKU-001"
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-gray-900 placeholder:text-gray-400"
                            disabled={!isNew}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {isNew ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  // Guardar nueva variante
                                  try {
                                    const token = localStorage.getItem("token") ?? undefined;
                                    const res = await fetch(`http://localhost:8080/products/${id}/variants`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                      },
                                      body: JSON.stringify({
                                        color: variant.color,
                                        size: variant.size,
                                        sku: variant.sku,
                                        color_hex: variant.color_hex,
                                      }),
                                    });
                                    if (!res.ok) throw new Error('Error creando variante');
                                    const created = await res.json();
                                    const updated = [...variants];
                                    updated[idx] = { ...created, isNew: false };
                                    setVariants(updated);
                                    setSuccess('Variante creada exitosamente');
                                  } catch (e: any) {
                                    setError(e.message);
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setVariants(variants.filter((_, i) => i !== idx));
                                }}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('¿Eliminar esta variante?')) return;
                                try {
                                  const token = localStorage.getItem("token") ?? undefined;
                                  const res = await fetch(`http://localhost:8080/variants/${variantId}`, {
                                    method: 'DELETE',
                                    headers: {
                                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                  });
                                  if (!res.ok) throw new Error('Error eliminando variante');
                                  setVariants(variants.filter((_, i) => i !== idx));
                                  setSuccess('Variante eliminada');
                                } catch (e: any) {
                                  setError(e.message);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Nota:</strong> Las variantes nuevas deben guardarse individualmente. 
                Para modificar color, talle o SKU de una variante existente, debes eliminarla y crear una nueva.
              </p>
            </div>
          </div>
        )}

        {/* Pestaña: Stock */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Asignar Stock por Ubicación</h3>
              <button
                type="button"
                onClick={async () => {
                  // Guardar todos los stocks
                  try {
                    setError(null);
                    setSuccess(null);
                    const token = localStorage.getItem("token") ?? undefined;
                    
                    // Preparar payload con los stocks actuales
                    const stocksPayload: any[] = [];
                    locationStocks.forEach((ls: any) => {
                      stocksPayload.push({
                        variant_id: ls.variant_id || null,
                        location: ls.location,
                        quantity: ls.stock || 0,
                      });
                    });

                    const res = await fetch(`http://localhost:8080/products/${id}/stocks`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ stocks: stocksPayload }),
                    });

                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData.error || 'Error guardando stocks');
                    }
                    setSuccess('Stocks actualizados exitosamente');
                    
                    // Recargar stocks
                    fetch(`http://localhost:8080/location-stocks?product_id=${id}`, { 
                      headers: token ? { Authorization: `Bearer ${token}` } : {} 
                    })
                      .then(r => r.ok ? r.json() : [])
                      .then(stocks => setLocationStocks(Array.isArray(stocks) ? stocks : []));
                  } catch (e: any) {
                    console.error('Error al guardar stocks:', e);
                    setError(e.message);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition"
              >
                💾 Guardar Stocks
              </button>
            </div>

            {product.total_stock && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Stock total asignado:</strong> {calculatedTotalStock} / {product.total_stock}
                  {calculatedTotalStock > product.total_stock && (
                    <span className="text-red-600 ml-2 font-semibold">⚠️ Excede el límite configurado</span>
                  )}
                </p>
              </div>
            )}

            {variants.length === 0 ? (
              // Producto sin variantes: mostrar tabla simple de stock por ubicación
              <div className="overflow-x-auto">
                <p className="text-sm text-gray-600 mb-4">
                  Este producto no tiene variantes. Asigna stock directamente por ubicación:
                </p>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Ubicación</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['deposito', 'mendoza', 'salta'].map(location => {
                      const stockEntry = locationStocks.find(
                        (ls: any) => ls.location === location && (ls.variant_id === null || ls.variant_id === undefined)
                      );
                      const currentStock = stockEntry?.stock || 0;
                      
                      return (
                        <tr key={location}>
                          <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 capitalize">
                            {location}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={currentStock}
                              onChange={(e) => {
                                const newValue = Number(e.target.value) || 0;
                                const updatedStocks = [...locationStocks];
                                const existingIdx = updatedStocks.findIndex(
                                  (ls: any) => ls.location === location && (ls.variant_id === null || ls.variant_id === undefined)
                                );
                                
                                if (existingIdx >= 0) {
                                  updatedStocks[existingIdx] = {
                                    ...updatedStocks[existingIdx],
                                    stock: newValue
                                  };
                                } else {
                                  updatedStocks.push({
                                    product_id: product.ID || product.id,
                                    variant_id: null,
                                    location: location,
                                    stock: newValue,
                                    reserved: 0
                                  });
                                }
                                
                                setLocationStocks(updatedStocks);
                              }}
                              className="w-24 border border-gray-300 rounded px-3 py-2 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">Stock total:</td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-700">
                        {locationStocks
                          .filter((ls: any) => ls.variant_id === null || ls.variant_id === undefined)
                          .reduce((sum: number, ls: any) => sum + (ls.stock || 0), 0)
                        } unidades
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Color</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Talle</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Depósito</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Mendoza</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Salta</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant: any, varIdx: number) => {
                      const variantId = variant.id ?? variant.ID;
                      
                      // Buscar el color hex
                      let colorHex = variant.color_hex || '#cccccc';
                      if (variant.color) {
                        const matchedColor = colors.find((c: any) => 
                          c.name?.toLowerCase() === variant.color?.toLowerCase() ||
                          c.key === variant.color?.toLowerCase()
                        );
                        if (matchedColor?.hex) {
                          colorHex = matchedColor.hex;
                        }
                      }

                      // Obtener stocks para esta variante
                      const getStockForLocation = (loc: string) => {
                        const stockEntry = locationStocks.find(
                          (ls: any) => ls.variant_id === variantId && ls.location === loc
                        );
                        return stockEntry?.stock || 0;
                      };

                      const setStockForLocation = (loc: string, value: number) => {
                        const updatedStocks = [...locationStocks];
                        const existingIdx = updatedStocks.findIndex(
                          (ls: any) => ls.variant_id === variantId && ls.location === loc
                        );

                        if (existingIdx >= 0) {
                          updatedStocks[existingIdx].stock = value;
                        } else {
                          updatedStocks.push({
                            product_id: Number(id),
                            variant_id: variantId,
                            location: loc,
                            stock: value,
                          });
                        }
                        setLocationStocks(updatedStocks);
                      };

                      const deposito = getStockForLocation('deposito');
                      const mendoza = getStockForLocation('mendoza');
                      const salta = getStockForLocation('salta');
                      const totalVariant = deposito + mendoza + salta;

                      return (
                        <tr key={variantId ?? `variant-${varIdx}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border-2 border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: colorHex }}
                                title={variant.color}
                              />
                              <span className="font-medium text-gray-900">{variant.color}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                            {variant.size}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={deposito}
                              onChange={(e) => setStockForLocation('deposito', Number(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={mendoza}
                              onChange={(e) => setStockForLocation('mendoza', Number(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={salta}
                              onChange={(e) => setStockForLocation('salta', Number(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50 font-bold text-blue-900">
                            {totalVariant}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Fila de totales */}
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                        TOTAL POR UBICACIÓN:
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                        {variants.reduce((sum: number, v: any) => {
                          const variantId = v.id ?? v.ID;
                          const stock = locationStocks.find((ls: any) => ls.variant_id === variantId && ls.location === 'deposito');
                          return sum + (stock?.stock || 0);
                        }, 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                        {variants.reduce((sum: number, v: any) => {
                          const variantId = v.id ?? v.ID;
                          const stock = locationStocks.find((ls: any) => ls.variant_id === variantId && ls.location === 'mendoza');
                          return sum + (stock?.stock || 0);
                        }, 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                        {variants.reduce((sum: number, v: any) => {
                          const variantId = v.id ?? v.ID;
                          const stock = locationStocks.find((ls: any) => ls.variant_id === variantId && ls.location === 'salta');
                          return sum + (stock?.stock || 0);
                        }, 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center bg-blue-100 text-blue-900">
                        {calculatedTotalStock}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Nota:</strong> Los cambios en el stock no se guardan automáticamente. 
                Haz clic en el botón &quot;Guardar Stocks&quot; cuando termines de editar.
              </p>
            </div>
          </div>
        )}

        {/* Notificación flotante local (toast) */}
        {(success || error) && (
          <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
            {success && (
              <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{success}</span>
                <button onClick={() => setSuccess(null)} className="ml-4 text-white hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {error && (
              <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 text-white hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition">
            Guardar Cambios
          </button>
          <button 
            type="button" 
            onClick={() => router.push(`/admin/inventario?search=${encodeURIComponent(product.code || product.name)}`)} 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition"
          >
            Ver en Inventario
          </button>
          <button 
            type="button" 
            onClick={() => setShowDeleteModal(true)} 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition"
          >
            Eliminar Producto
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/admin/productos')} 
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium transition"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Eliminar producto?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Esta acción no se puede deshacer. El producto <strong>{product?.name}</strong> será eliminado permanentemente junto con todas sus variantes y stocks.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
