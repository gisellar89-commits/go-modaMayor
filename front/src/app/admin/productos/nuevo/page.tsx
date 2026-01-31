"use client";
import { useState, useEffect } from "react";
import { fetchCategories, Category, Subcategory } from "../../../../utils/api";
import { useRouter } from "next/navigation";

export default function NuevoProductoPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | ''>('');
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [sizeTypes, setSizeTypes] = useState<any[]>([]);
  const [sizeTypesLoaded, setSizeTypesLoaded] = useState<boolean>(false);
  const [colors, setColors] = useState<any[]>([]);
  // Selected colors tracked by unique key (prefer `key`, fallback to id as string)
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  // store selected size type by key or id-as-string; empty string means not selected
  const [selectedSizeType, setSelectedSizeType] = useState<string>('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [totalStock, setTotalStock] = useState<number | ''>('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  // Tags para secciones del home
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [skuPrefix, setSkuPrefix] = useState<string>('');
  const locations = ['deposito','mendoza','salta'];
  // map variantID -> location -> qty
  const [stocks, setStocks] = useState<Record<number, Record<string, number>>>({});
  // Para productos sin variantes: location -> qty
  const [simpleStocks, setSimpleStocks] = useState<Record<string, number>>({deposito: 0, mendoza: 0, salta: 0});
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedCombinations, setSelectedCombinations] = useState<Set<string>>(new Set());
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedStateForRecovery, setSavedStateForRecovery] = useState<any>(null);
  const router = useRouter();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Save wizard state to localStorage
  const saveWizardState = () => {
    const state = {
      step,
      name,
      description,
      price,
      sku,
      categoryId,
      subcategoryId,
      imageUrl,
      selectedColors,
      selectedSizeType,
      selectedSupplierId,
      selectedSeasonId,
      year,
      totalStock,
      discountType,
      discountValue,
      isNewArrival,
      isFeatured,
      isOffer,
      isTrending,
      createdProductId,
      selectedSizes,
      skuPrefix,
      timestamp: Date.now()
    };
    localStorage.setItem('productWizardState', JSON.stringify(state));
  };

  // Load wizard state from localStorage
  const loadWizardState = () => {
    const saved = localStorage.getItem('productWizardState');
    if (!saved) return null;
    
    try {
      const state = JSON.parse(saved);
      // Check if state is not too old (24 hours)
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('productWizardState');
        return null;
      }
      return state;
    } catch (e) {
      console.error('Error loading wizard state:', e);
      localStorage.removeItem('productWizardState');
      return null;
    }
  };

  // Clear wizard state from localStorage
  const clearWizardState = () => {
    localStorage.removeItem('productWizardState');
  };

  // Restore wizard state
  const restoreWizardState = (state: any) => {
    setStep(state.step || 1);
    setName(state.name || '');
    setDescription(state.description || '');
    setPrice(state.price || '');
    setSku(state.sku || '');
    setCategoryId(state.categoryId || '');
    setSubcategoryId(state.subcategoryId || '');
    setImageUrl(state.imageUrl || '');
    setSelectedColors(state.selectedColors || []);
    setSelectedSizeType(state.selectedSizeType || '');
    setSelectedSupplierId(state.selectedSupplierId || '');
    setSelectedSeasonId(state.selectedSeasonId || '');
    setYear(state.year || '');
    setTotalStock(state.totalStock || '');
    setDiscountType(state.discountType || 'none');
    setDiscountValue(state.discountValue || 0);
    setIsNewArrival(state.isNewArrival || false);
    setIsFeatured(state.isFeatured || false);
    setIsOffer(state.isOffer || false);
    setIsTrending(state.isTrending || false);
    setCreatedProductId(state.createdProductId || null);
    setSelectedSizes(state.selectedSizes || []);
    setSkuPrefix(state.skuPrefix || '');
  };

  // Check for saved wizard state on mount
  useEffect(() => {
    const savedState = loadWizardState();
    if (savedState) {
      // Solo mostrar el modal si hay datos significativos (no solo timestamp)
      const hasSignificantData = 
        savedState.name || 
        savedState.description || 
        savedState.price || 
        savedState.categoryId || 
        (savedState.selectedColors && savedState.selectedColors.length > 0) ||
        savedState.createdProductId;
      
      if (hasSignificantData) {
        setSavedStateForRecovery(savedState);
        setShowRecoveryModal(true);
      } else {
        // Si no hay datos significativos, limpiar el localStorage
        clearWizardState();
      }
    }
  }, []);

  // Auto-save wizard state when key fields change (only in step 1 or if product created)
  useEffect(() => {
    if (step === 1 || createdProductId) {
      saveWizardState();
    }
  }, [step, name, price, categoryId, selectedColors, selectedSizeType, createdProductId]);

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

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  // Función para eliminar una imagen
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Función para subir imágenes al servidor
  const uploadImages = async (productId: number) => {
    if (imageFiles.length === 0) return null;

    setUploadingImages(true);
    const token = localStorage.getItem("token") ?? undefined;

    try {
      // Subir hasta 3 imágenes: principal, modelo, perchero
      const formData = new FormData();
      
      // Limitar a máximo 3 imágenes
      const filesToUpload = imageFiles.slice(0, 3);
      
      // Mapear las imágenes a los campos específicos del backend
      const fieldNames = ['image_main', 'image_model', 'image_hanger'];
      filesToUpload.forEach((file, index) => {
        formData.append(fieldNames[index], file);
      });

      const res = await fetch(`${API_URL}/products/${productId}/images`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Imágenes subidas:", data.uploaded_images);
        return data.uploaded_images;
      } else {
        console.error("Error en respuesta:", await res.text());
        return null;
      }
    } catch (err) {
      console.error("Error subiendo imágenes:", err);
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  // Generar SKU simple a partir del nombre si el campo sku está vacío
  const generateSKU = (name: string) => {
    const s = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const suffix = Date.now().toString().slice(-5)
    return s ? `${s}-${suffix}` : `PRD-${suffix}`
  }

  useEffect(()=>{
    // Si el usuario no escribió SKU manualmente, autocompletar cuando cambie el nombre
    if (name && (!sku || sku === "")) {
      setSku(generateSKU(name))
    }
  }, [name])

  useEffect(() => {
    // Cargar categorías al montar
    const token = localStorage.getItem("token") ?? undefined;
    fetchCategories(token)
      .then(setCategories)
      .catch((e) => console.error("No se pudieron cargar categorías", e));
    // cargar size types (admin endpoint)
    fetch(`${API_URL}/size-types`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(r=>r.ok? r.json(): Promise.reject(r))
      .then((data:any[])=>{
        console.log('DEBUG sizeTypes loaded from server:', data);
        if (data && data.length>0) setSizeTypes(data)
        setSizeTypesLoaded(true)
      })
      .catch((err)=> {
        console.log('DEBUG sizeTypes fetch error:', err);
        setSizeTypesLoaded(true);
      })
    // cargar colores públicos; si no hay, usar fallback con colores comunes
    const fallbackColors = [
      { id: 1, key: 'negro', name: 'Negro', hex: '#000000' },
      { id: 2, key: 'blanco', name: 'Blanco', hex: '#FFFFFF' },
      { id: 3, key: 'rojo', name: 'Rojo', hex: '#FF0000' },
      { id: 4, key: 'azul', name: 'Azul', hex: '#0000FF' },
      { id: 5, key: 'verde', name: 'Verde', hex: '#00AA00' },
    ]
    fetch(`${API_URL}/public/colors`)
      .then(r=>r.ok? r.json(): Promise.reject(r))
      .then((data:any[])=>{
        if (!data || data.length === 0) setColors(fallbackColors)
        else setColors(data)
      })
      .catch(()=> setColors(fallbackColors))
    // cargar temporadas
    fetch(`${API_URL}/public/seasons`)
      .then(r=>r.ok? r.json(): Promise.reject(r))
      .then((data:any[])=>{
        setSeasons(data || [])
      })
      .catch(()=> setSeasons([]))
    // cargar proveedores
    fetch(`${API_URL}/suppliers`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(r=>r.ok? r.json(): Promise.reject(r))
      .then((data:any[])=>{
        setSuppliers(data || [])
      })
      .catch(()=> setSuppliers([]))
  }, []);

  // When user selects a size type in the UI or enters step 2, preload available size values from DB:
  useEffect(() => {
    if (!selectedSizeType) {
      setAvailableSizes([])
      return
    }
    const token = localStorage.getItem("token") ?? undefined;
    const sizeTypeId = Number(selectedSizeType)
    console.log('DEBUG availableSizes - selectedSizeType:', selectedSizeType, 'sizeTypeId:', sizeTypeId);
    
    if (isNaN(sizeTypeId) || sizeTypeId <= 0) {
      console.log('DEBUG availableSizes - Invalid sizeTypeId, clearing sizes');
      setAvailableSizes([]);
      return;
    }
    
    // Fetch size values from database
    fetch(`${API_URL}/size-values`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((all: any[]) => {
        console.log('DEBUG availableSizes - Fetched from server:', all);
        const filtered = all.filter(s => s.size_type_id === sizeTypeId);
        console.log('DEBUG availableSizes - Filtered for size_type_id', sizeTypeId, ':', filtered);
        setAvailableSizes(filtered);
      })
      .catch((err) => {
        console.log('DEBUG availableSizes - Fetch error:', err);
        setAvailableSizes([]);
      })
  }, [selectedSizeType, step])

  useEffect(() => {
    // Cargar subcategorías cuando cambia la categoría
    if (categoryId) {
      // Use public endpoint for subcategories to allow non-admin users to see them in the wizard
      fetch(`${API_URL}/public/categories/${categoryId}/subcategories`)
        .then((res) => res.ok ? res.json() : Promise.reject(res))
        .then((data)=>{
          // API may return either an array or a paged-like object { value: [...], Count: n }
          if (Array.isArray(data)) return setSubcategories(data as any[])
          const arr = (data && (data.value || data.items)) ? (data.value || data.items) : []
          setSubcategories(arr)
        })
        .catch((e)=>{
          console.error('No se pudieron cargar subcategorías', e)
          setSubcategories([])
        })
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify((() => {
            // Determine size_type_id: if selectedSizeType corresponds to a server-provided id, send numeric id; otherwise omit
            let sizeTypeId: number | undefined = undefined
            let sizeTypeKey: string | undefined = undefined
            
            if (selectedSizeType) {
              // try numeric parse first
              const asNum = Number(selectedSizeType)
              if (!isNaN(asNum) && asNum > 0) {
                sizeTypeId = asNum
                // find the key for this id
                const found = sizeTypes.find((st:any)=> st.id === asNum)
                if (found) sizeTypeKey = found.key
              } else {
                // try resolve from loaded sizeTypes (match by key)
                const resolved = sizeTypes.find((st:any)=> (st.id && String(st.id) === selectedSizeType) || st.key === selectedSizeType)
                if (resolved) {
                  sizeTypeId = resolved.id
                  sizeTypeKey = resolved.key
                }
              }
            }
            
            // Determinar variant_type basándose en el size_type.key seleccionado + colores
            let variantType = 'sin_variantes';
            const hasColors = selectedColors && selectedColors.length > 0;
            const hasSizeVariants = sizeTypeKey && sizeTypeKey !== 'unico'; // "unico" = sin talles
            
            if (hasSizeVariants && hasColors) {
              variantType = 'ambos';
            } else if (hasSizeVariants) {
              variantType = 'talle_unico';
            } else if (hasColors) {
              variantType = 'color_surtido';
            }
            // Si no hay colores ni size_type (o es 'unico'), queda 'sin_variantes'
            
            console.log('Enviando producto con variant_type:', variantType, { 
              sizeTypeKey, 
              hasColors, 
              hasSizeVariants,
              selectedColorsLength: selectedColors.length,
              sizeTypeId: sizeTypeId,
              selectedSizeType: selectedSizeType
            });
            
            return {
              name,
              description,
              cost_price: price,
              // stock handled via stocks endpoint later; keep for backward compat
              // (we hide the stock input in the wizard UI)
              sku,
              category_id: Number(categoryId),
              subcategory_id: subcategoryId ? Number(subcategoryId) : undefined,
              image_url: imageUrl || undefined,
              supplier_id: selectedSupplierId ? Number(selectedSupplierId) : undefined,
              season_id: selectedSeasonId ? Number(selectedSeasonId) : undefined,
              year: year || undefined,
              size_type_id: sizeTypeId,
              total_stock: totalStock === '' ? undefined : totalStock,
              colors: selectedColors,
              variant_type: variantType,
              discount_type: discountType,
              discount_value: discountType === 'none' ? 0 : discountValue,
              is_new_arrival: isNewArrival,
              is_featured: isFeatured,
              is_offer: isOffer,
              is_trending: isTrending,
            }
        })()),
      });
  if (!res.ok) throw new Error("No se pudo crear el producto");
      const created = await res.json();
      setSuccess("Producto creado exitosamente");
      // Depuración: mostrar respuesta creada
      // El backend en Go devuelve la propiedad `ID` (mayúscula). Aceptamos ambos.
      console.log("created product response:", created);
      const createdId = (created && (created.id ?? created.ID)) || null;
      console.log("detected createdId:", createdId);
      if (createdId) {
        // Subir imágenes si hay archivos seleccionados
        if (imageFiles.length > 0) {
          setSuccess("Producto creado, subiendo imágenes...");
          const uploadedUrl = await uploadImages(Number(createdId));
          if (uploadedUrl) {
            setSuccess("Producto e imagen principal creados exitosamente");
          } else {
            setSuccess("Producto creado (error al subir imagen)");
          }
        } else if (!imageUrl) {
          setSuccess("Producto creado (sin imagen). Puedes agregar imágenes después.");
        }
        
        // Mantener dentro del wizard
        setCreatedProductId(Number(createdId))
        
        // Determinar automáticamente si tiene variantes
        // Sin variantes = "Talle único/sin variantes" + "Sin variante de color" (selectedColors === ['unico'])
        console.log('🔍 DEBUG sizeTypes array:', sizeTypes);
        console.log('🔍 DEBUG selectedSizeType:', selectedSizeType, 'type:', typeof selectedSizeType);
        
        const sizeTypeObj = sizeTypes.find((st: any) => {
          const match = st.ID === Number(selectedSizeType) || st.id === Number(selectedSizeType) || String(st.ID) === selectedSizeType || String(st.id) === selectedSizeType || st.key === selectedSizeType;
          console.log('  checking:', st, 'match:', match);
          return match;
        });
        
        console.log('🔍 DEBUG sizeTypeObj found:', sizeTypeObj);
        
        const isSizeTypeUnico = sizeTypeObj?.key === 'unico' || sizeTypeObj?.name?.toLowerCase().includes('único') || sizeTypeObj?.name?.toLowerCase().includes('sin variantes');
        const hasNoColorVariants = selectedColors.length === 1 && selectedColors[0] === 'unico';
        const productHasVariants = !(isSizeTypeUnico && hasNoColorVariants);
        
        console.log('🔍 Detectando variantes:', {
          sizeTypeObj,
          isSizeTypeUnico,
          selectedColors,
          hasNoColorVariants,
          productHasVariants
        });
        
        if (!productHasVariants) {
          // Producto sin variantes: ir directo al paso de stock simple
          console.log('✅ Producto SIN variantes detectado → Paso 4');
          setStep(4);
        } else {
          // Producto con variantes: ir al paso 2 (generar variantes)
          console.log('✅ Producto CON variantes detectado → Paso 2');
          setStep(2);
          // si hay size type seleccionado, cargar sus size values
          if (selectedSizeType) {
            // try to resolve selectedSizeType to a numeric id if server-provided
            const resolved = sizeTypes.find((st:any)=> (st.id && String(st.id) === selectedSizeType) || st.key === selectedSizeType)
            if (resolved && resolved.id) {
              fetch(`${API_URL}/size-values`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
                .then(r=>r.ok? r.json(): Promise.reject(r))
                .then((all:any[])=> setAvailableSizes(all.filter(s=> s.size_type_id === resolved.id)))
                .catch(()=> setAvailableSizes([]))
            } else {
              // no server-side size type id; no available sizes to preload
              setAvailableSizes([])
            }
          }
        }
      } else {
        console.warn("No se detectó ID del producto creado en la respuesta. No se avanza en el wizard.");
      }
  setName("");
  setDescription("");
  setPrice('');
      setSku("");
      setCategoryId("");
      setSubcategoryId("");
      setImageUrl("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Step 2: generar variantes
  const handleGenerateVariants = async () => {
    if (!createdProductId) return setError('Producto no creado')
    setError(null); setSuccess(null)
    const token = localStorage.getItem("token") ?? undefined;
    // selectedColors stores color keys; if none selected, send all available color keys
    const colorKeys = (selectedColors && selectedColors.length>0)
      ? selectedColors
      : colors.map((c:any)=> c.key ?? String(c.id) )
    try {
      const res = await fetch(`${API_URL}/products/${createdProductId}/variants/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ colors: colorKeys, sizes: selectedSizes, sku_prefix: skuPrefix })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Error generando variantes')
      }
      const out = await res.json()
      // Enriquecer variantes con datos visuales
      const enrichedVariants = (out.created || []).map((v: any) => {
        const colorObj = colors.find(c => c.name === v.color || c.key === v.color);
        return {
          ...v,
          color_key: colorObj?.key || v.color,
          color_hex: colorObj?.hex || '#ccc'
        };
      });
      setVariants(enrichedVariants)
      setSuccess(`Se crearon ${ (out.created||[]).length } variantes, saltadas: ${out.skipped||0}`)
  setStep(3)
  // inicializar stocks map
  const newMap: Record<number, Record<string, number>> = {};
      enrichedVariants.forEach((v:any)=>{
        newMap[v.id] = {}
        locations.forEach(loc=> newMap[v.id][loc]=0)
      })
      setStocks(newMap)
    } catch(e:any){
      setError(e.message)
    }
  }

  // Step 3: guardar stocks
  const handleSaveStocks = async () => {
    if (!createdProductId) return setError('Producto no creado')
    setError(null); setSuccess(null)
    const token = localStorage.getItem("token") ?? undefined;
    const stocksPayload: any[] = []
    Object.entries(stocks).forEach(([vid, locs])=>{
      const vID = Number(vid)
      Object.entries(locs).forEach(([loc, qty])=>{
        // Solo enviar filas con cantidad > 0 para evitar validaciones innecesarias
        if (qty > 0) {
          stocksPayload.push({ variant_id: vID, location: loc, quantity: qty })
        }
      })
    })
    try{
      const res = await fetch(`${API_URL}/products/${createdProductId}/stocks`, {
        method: 'POST', headers: { 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ stocks: stocksPayload })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error guardando stocks')
      setSuccess('Stocks guardados correctamente')
      // Limpiar el wizard state porque se completó exitosamente
      clearWizardState();
      // redirigir a la página del producto en admin
      router.push(`/admin/productos/${createdProductId}`)
    }catch(e:any){ setError(e.message) }
  }

  // Modal para selección manual de combinaciones
  const handleManualVariants = () => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      alert('Debes seleccionar al menos un color y un talle');
      return;
    }
    // Generar todas las combinaciones posibles
    const allCombinations = selectedColors.flatMap(colorKey => 
      selectedSizes.map(size => `${colorKey}-${size}`)
    );
    setSelectedCombinations(new Set(allCombinations)); // Todas seleccionadas por defecto
    setShowManualModal(true);
  };

  const handleConfirmManualVariants = async () => {
    if (selectedCombinations.size === 0) {
      alert('Debes seleccionar al menos una combinación');
      return;
    }

    try {
      const token = localStorage.getItem("token") ?? undefined;
      // Crear las variantes seleccionadas
      const variantsToCreate = Array.from(selectedCombinations).map(combo => {
        const [colorKey, size] = combo.split('-');
        const color = colors.find(c => c.key === colorKey);
        return {
          color: color?.name || colorKey,
          size: size,
          sku: `${skuPrefix}-${colorKey}-${size}`.toUpperCase(),
          color_key: colorKey, // guardamos también para referencia visual
          color_hex: color?.hex || '#ccc'
        };
      });

      // Crear variantes una por una
      const createdVariants = [];
      for (const variantData of variantsToCreate) {
        const response = await fetch(`${API_URL}/products/${createdProductId}/variants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(variantData)
        });

        if (!response.ok) {
          throw new Error(`Error creando variante ${variantData.sku}`);
        }

        const created = await response.json();
        // Enriquecer con datos visuales
        created.color_key = variantData.color_key;
        created.color_hex = variantData.color_hex;
        createdVariants.push(created);
      }

      setVariants(createdVariants);
      
      // Inicializar stocks para las variantes creadas
      const newMap: Record<number, Record<string, number>> = {};
      createdVariants.forEach((v:any)=>{
        newMap[v.id] = {}
        locations.forEach(loc=> newMap[v.id][loc]=0)
      })
      setStocks(newMap);
      
      setShowManualModal(false);
      setStep(3);
      setSuccess(`${createdVariants.length} variantes creadas exitosamente`);
    } catch (error: any) {
      console.error('Error creando variantes:', error);
      setError('Error creando variantes: ' + error.message);
    }
  };

  const toggleCombination = (combo: string) => {
    const newSelected = new Set(selectedCombinations);
    if (newSelected.has(combo)) {
      newSelected.delete(combo);
    } else {
      newSelected.add(combo);
    }
    setSelectedCombinations(newSelected);
  };

  const toggleAllCombinations = () => {
    const allCombinations = selectedColors.flatMap(colorKey => 
      selectedSizes.map(size => `${colorKey}-${size}`)
    );
    
    if (selectedCombinations.size === allCombinations.length) {
      setSelectedCombinations(new Set());
    } else {
      setSelectedCombinations(new Set(allCombinations));
    }
  };

  return (
    <main className={`p-4 mx-auto ${(step === 3 || step === 4) ? 'max-w-6xl' : 'max-w-lg'}`}>
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Nuevo producto</h1>
      {step === 1 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border px-2 py-1 text-gray-900 placeholder:text-gray-400"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border px-2 py-1 text-gray-900 placeholder:text-gray-400"
        />
        <input
          type="number"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
          className="border px-2 py-1 text-gray-900 placeholder:text-gray-400"
        />
        
        {/* Descuento */}
        <div className="border rounded p-3 bg-gray-50">
          <label className="block font-semibold mb-2 text-gray-900">Descuento</label>
          <div className="flex gap-2 items-center mb-2">
            <select 
              value={discountType} 
              onChange={e => setDiscountType(e.target.value)} 
              className="border px-2 py-1 rounded text-gray-900"
            >
              <option value="none">Ninguno</option>
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Monto fijo</option>
            </select>
            {discountType !== 'none' && (
              <input 
                type="number" 
                min={0} 
                step="0.01" 
                value={discountValue} 
                onChange={e => setDiscountValue(Number(e.target.value))} 
                className="border px-2 py-1 rounded w-32 text-gray-900 placeholder:text-gray-400"
                placeholder={discountType === 'percent' ? '%' : '$'}
              />
            )}
          </div>
          {discountType !== 'none' && price && (
            <div className="text-sm">
              <div className="text-gray-600">
                Precio original: <span className="font-medium">${Number(price).toFixed(2)}</span>
              </div>
              <div className="text-green-700 font-semibold">
                Precio con descuento: ${(() => {
                  const base = Number(price || 0);
                  let final = base;
                  if (discountType === 'percent') final = base * (1 - (discountValue || 0) / 100);
                  if (discountType === 'fixed') final = base - (discountValue || 0);
                  if (final < 0) final = 0;
                  return final.toFixed(2);
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Campo 'Stock' retirado: el inventario se asigna por variante y ubicación en el Paso 3 */}
        {/* SKU autogenerado (no mostrar input editable por defecto) */}
        <input type="hidden" value={sku} />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="border px-2 py-1 text-gray-900"
        >
          <option value="">Selecciona categoría</option>
            {categories.map((cat, i) => {
              const id = (cat as any).ID ?? (cat as any).id ?? i
              const name = (cat as any).name ?? (cat as any).Name ?? String(id)
              return (
                <option key={String(id)} value={String(id)}>
                  {name}
                </option>
              )
            })}
        </select>
        {subcategories.length > 0 && (
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            required
            className="border px-2 py-1 text-gray-900"
          >
            <option value="">Selecciona subcategoría</option>
            {subcategories.map((sub, i) => {
            const id = (sub as any).ID ?? (sub as any).id ?? i
            const name = (sub as any).name ?? (sub as any).Name ?? String(id)
            return (
              <option key={String(id)} value={String(id)}>
                {name}
              </option>
            )
            })}
          </select>
        )}
        <div className="border rounded p-3 bg-gray-50">
          <label className="block font-semibold mb-2 text-gray-900">Imágenes del Producto</label>
          
          {/* Selector de archivos */}
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
            <p className="text-xs text-gray-500 mt-1">
              Puedes seleccionar hasta 3 imágenes: Principal, Con Modelo y En Perchero.
            </p>
          </div>

          {/* Previews de imágenes */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, index) => {
                const imageLabels = ['Principal', 'Con Modelo', 'En Perchero'];
                const label = imageLabels[index] || `Imagen ${index + 1}`;
                const badgeColor = index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-purple-600' : 'bg-green-600';
                
                return (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={label}
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                    <div className={`absolute top-1 left-1 ${badgeColor} text-white text-xs px-2 py-1 rounded shadow`}>
                      {label}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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
          )}

          {/* Campo alternativo para URL (opcional) */}
          <div className="mt-3">
            <label className="block text-sm mb-1 text-gray-600">O ingresa una URL de imagen</label>
            <input
              type="text"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
          <div className="flex gap-2">
          <div>
            <label className="block text-sm text-gray-900">Tipo de talles</label>
            <select value={selectedSizeType ?? ''} onChange={e=>setSelectedSizeType(e.target.value)} className="border px-2 py-1 text-gray-900">
              <option value="">Selecciona tipo de talles</option>
              {sizeTypes.map((st:any)=> {
                const stId = st.ID || st.id;
                const stName = st.name || st.key;
                return <option key={stId} value={String(stId)}>{stName}</option>
              })}
            </select>
            {sizeTypes.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">Cargando tipos de talles...</div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-900">Proveedor</label>
            <select 
              value={selectedSupplierId} 
              onChange={e=>setSelectedSupplierId(e.target.value)} 
              className="border px-2 py-1 rounded text-gray-900"
            >
              <option value="">Ninguno</option>
              {suppliers.map((s:any)=> (
                <option key={s.ID || s.id} value={s.ID || s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">No hay proveedores configurados</div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-900">Temporada</label>
            <select 
              value={selectedSeasonId} 
              onChange={e=>setSelectedSeasonId(e.target.value)} 
              className="border px-2 py-1 rounded text-gray-900"
            >
              <option value="">Ninguna</option>
              {seasons.map((s:any)=> (
                <option key={s.ID || s.id} value={s.ID || s.id}>
                  {s.name} ({s.year})
                </option>
              ))}
            </select>
            {seasons.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">No hay temporadas configuradas</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-sm text-gray-900">Año</label>
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value)||'')} className="border px-2 py-1 w-32 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm text-gray-900">Total stock (opcional)</label>
            <input type="number" value={totalStock} onChange={e=>setTotalStock(Number(e.target.value)||'')} className="border px-2 py-1 w-32 text-gray-900" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-900 mb-2">Colores disponibles</label>
          <div className="flex flex-wrap gap-2">
            {/* Opción especial: Sin variante de color */}
            <label 
              className={`border p-2 cursor-pointer text-gray-900 ${
                selectedColors.length === 1 && selectedColors[0] === 'unico' 
                  ? 'bg-blue-200 border-blue-500 font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <input 
                type="checkbox" 
                checked={selectedColors.length === 1 && selectedColors[0] === 'unico'}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Si se selecciona "sin variante", limpiar todos los demás colores
                    setSelectedColors(['unico']);
                  } else {
                    // Si se deselecciona "sin variante", limpiar la selección
                    setSelectedColors([]);
                  }
                }}
                className="mr-2" 
              />
              Sin variante de color
            </label>

            {/* Separador visual */}
            <div className="w-full h-px bg-gray-300 my-1"></div>

            {/* Colores normales */}
            {colors.map((c:any)=> {
              const colorKey = c.key ?? String(c.id)
              const checked = selectedColors.includes(colorKey)
              const isDisabled = selectedColors.includes('unico')
              
              return (
                <label 
                  key={colorKey} 
                  className={`border p-2 cursor-pointer text-gray-900 ${
                    checked ? 'bg-gray-200 border-gray-500 font-semibold' : 'hover:bg-gray-100'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    disabled={isDisabled}
                    onChange={()=>{
                      if (isDisabled) return;
                      setSelectedColors(prev => {
                        // Si se selecciona un color normal, quitar "unico" si está presente
                        const filtered = prev.filter(x => x !== 'unico');
                        return filtered.includes(colorKey) 
                          ? filtered.filter(x => x !== colorKey) 
                          : [...filtered, colorKey];
                      });
                    }} 
                    className="mr-2" 
                  />
                  {c.name ?? c.key}
                </label>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Selecciona &quot;Sin variante de color&quot; si el producto no tiene variaciones de color, 
            o elige uno o más colores si tiene variantes.
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <label className="block text-sm font-semibold mb-3 text-gray-900">Tags para el Home</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">Nuevo Ingreso</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">Destacado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOffer}
                onChange={(e) => setIsOffer(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">En Oferta</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">Tendencia</span>
            </label>
          </div>
        </div>

          <button
            type="submit"
            disabled={uploadingImages}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploadingImages && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {uploadingImages ? "Subiendo imágenes..." : "Crear producto y continuar"}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Paso 2 — Generar variantes</h2>
              <div>
                <label className="block text-sm text-gray-900">Colores seleccionados</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colors.length === 0 && <div className="text-sm text-gray-500">No hay colores disponibles.</div>}
                  {colors.map((c:any)=>{
                    const key = c.key ?? String(c.id)
                    const checked = selectedColors.includes(key)
                    return (
                      <label key={key} className={`flex items-center gap-2 border p-2 cursor-pointer ${checked? 'bg-gray-100':''}`}>
                        <span style={{width:24,height:16,backgroundColor: c.hex ?? '#eee', display:'inline-block', borderRadius:4, border:'1px solid #ddd'}} />
                        <input type="checkbox" checked={checked} onChange={()=>{
                          setSelectedColors(prev => prev.includes(key)? prev.filter(x=>x!==key) : [...prev, key])
                        }} className="mr-2" />
                        <span className="text-sm text-gray-900">{c.name ?? c.key}</span>
                      </label>
                    )
                  })}
                </div>

                <label className="block text-sm text-gray-900">Talles disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.length === 0 && <div className="text-sm text-gray-500">No hay talles cargados o seleccionaste talle único.</div>}
                  {availableSizes.map((s, i)=> (
                    <label key={s.id ?? s.value ?? i} className={`border p-2 cursor-pointer text-gray-900 ${selectedSizes.includes(s.value)? 'bg-gray-200':''}`}>
                      <input type="checkbox" checked={selectedSizes.includes(s.value)} onChange={()=>{
                        setSelectedSizes(prev => prev.includes(s.value)? prev.filter(x=>x!==s.value) : [...prev, s.value])
                      }} className="mr-2" />{s.value}
                    </label>
                  ))}
                </div>
              </div>
          {/* Campo prefijo SKU oculto: se autogenera internamente */}
          <input type="hidden" value={skuPrefix} onChange={e=>setSkuPrefix(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleGenerateVariants} disabled={selectedColors.length===0 || selectedSizes.length===0} className={`px-3 py-1 rounded ${selectedColors.length===0 || selectedSizes.length===0? 'bg-gray-200 text-gray-500':'bg-green-600 text-white'}`}>
              Generar variantes
            </button>
            <button onClick={()=>setStep(1)} className="bg-gray-200 px-3 py-1 rounded">Volver</button>
            <button onClick={handleManualVariants} className="bg-white border px-3 py-1 rounded">Crear variantes manualmente</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Paso 3 — Asignar stock por ubicación</h2>
          {totalStock && Number(totalStock) > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-gray-900">
                <strong>Stock total asignado:</strong> {Object.values(stocks).reduce((sum, locs) => sum + Object.values(locs).reduce((s, q) => s + q, 0), 0)} / {totalStock}
                {Object.values(stocks).reduce((sum, locs) => sum + Object.values(locs).reduce((s, q) => s + q, 0), 0) > Number(totalStock) && (
                  <span className="text-red-600 ml-2">⚠ Excede el límite</span>
                )}
              </p>
            </div>
          )}
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-gray-900">Color</th>
                  <th className="border px-4 py-2 text-gray-900">Talle</th>
                  {locations.map(loc=> <th key={loc} className="border px-4 py-2 capitalize text-gray-900">{loc}</th>)}
                </tr>
              </thead>
              <tbody>
                {variants.map((v, varIdx)=> {
                  const variantId = v.id ?? v.ID
                  return (
                  <tr key={variantId ?? v.sku ?? varIdx}>
                    <td className="border px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: v.color_hex || '#ccc' }}
                          title={v.color}
                        />
                        <span className="font-medium text-gray-900">{v.color}</span>
                      </div>
                    </td>
                    <td className="border px-4 py-2 font-medium text-gray-900">{v.size}</td>
                    {locations.map(loc=> {
                      const currentVal = (stocks[variantId] && stocks[variantId][loc]) ?? 0
                      return (
                      <td key={loc} className="border px-2 py-1">
                        <input type="number" min={0} value={currentVal} onChange={e=>{
                          const qty = Number(e.target.value) || 0
                          setStocks(prev=> {
                            const copy = {...prev}
                            if (!copy[variantId]) copy[variantId] = {}
                            copy[variantId][loc] = qty
                            return copy
                          })
                        }} className="w-20 border px-2 py-1 rounded text-gray-900" />
                      </td>
                      )
                    })}
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveStocks} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar stocks</button>
            <button onClick={()=>setStep(2)} className="bg-gray-200 px-3 py-1 rounded">Volver</button>
          </div>
        </div>
      )}

      {/* Paso 4: Stock simple para productos sin variantes */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Asignar stock por ubicación</h2>
          <p className="text-sm text-gray-600">
            Este producto no tiene variantes. Asigna el stock disponible en cada ubicación.
          </p>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-4 py-3 text-left font-semibold text-gray-900">Ubicación</th>
                  <th className="border px-4 py-3 text-left font-semibold text-gray-900">Stock disponible</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc} className="hover:bg-gray-50">
                    <td className="border px-4 py-3">
                      <span className="font-medium text-gray-900 capitalize">{loc}</span>
                    </td>
                    <td className="border px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={simpleStocks[loc] || 0}
                        onChange={e => {
                          const qty = Number(e.target.value) || 0;
                          setSimpleStocks(prev => ({ ...prev, [loc]: qty }));
                        }}
                        className="w-32 border px-3 py-2 rounded text-gray-900"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="border px-4 py-3 font-semibold text-gray-900">Stock total:</td>
                  <td className="border px-4 py-3 font-bold text-blue-700">
                    {Object.values(simpleStocks).reduce((sum, qty) => sum + qty, 0)} unidades
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!createdProductId) {
                  setError('No se encontró el producto creado');
                  return;
                }
                
                try {
                  const token = localStorage.getItem("token");
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                  
                  // Preparar array de stocks para enviar en batch
                  const stocksArray = Object.entries(simpleStocks)
                    .filter(([_, qty]) => qty > 0)
                    .map(([location, quantity]) => ({
                      variant_id: null,
                      location,
                      quantity
                    }));
                  
                  if (stocksArray.length === 0) {
                    setError('Debe asignar al menos un stock mayor a 0');
                    return;
                  }
                  
                  // Enviar todos los stocks en una sola petición
                  const response = await fetch(`${API_URL}/products/${createdProductId}/stocks`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                      stocks: stocksArray
                    })
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al guardar stock');
                  }
                  
                  setSuccess('Stock asignado exitosamente');
                  clearWizardState();
                  setTimeout(() => router.push('/admin/productos'), 1500);
                } catch (e: any) {
                  setError(`Error al guardar stock: ${e.message}`);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Guardar stock y finalizar
            </button>
            <button
              onClick={() => setStep(1)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Volver
            </button>
          </div>
        </div>
      )}

  {error && <div className="text-red-500 mt-2">{error}</div>}
  {success && <div className="text-green-600 mt-2">{success}</div>}

      {/* Modal para seleccionar combinaciones manualmente */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Seleccionar combinaciones de variantes</h2>
              <p className="text-gray-600 mt-2">
                Marca las combinaciones que deseas crear. Por defecto están todas seleccionadas.
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={toggleAllCombinations}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedCombinations.size === selectedColors.length * selectedSizes.length
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas'}
                </button>
                <span className="text-gray-600">
                  {selectedCombinations.size} de {selectedColors.length * selectedSizes.length} seleccionadas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedColors.flatMap(colorKey => {
                  const color = colors.find(c => c.key === colorKey);
                  return selectedSizes.map(size => {
                    const combo = `${colorKey}-${size}`;
                    const isSelected = selectedCombinations.has(combo);
                    const sku = `${skuPrefix}-${colorKey}-${size}`.toUpperCase();

                    return (
                      <div
                        key={combo}
                        onClick={() => toggleCombination(combo)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: color?.hex || '#ccc' }}
                                title={color?.name || colorKey}
                              />
                              <span className="font-medium text-gray-900 truncate">
                                {color?.name || colorKey}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              Talle: <span className="font-medium">{size}</span>
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              SKU: {sku}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setSelectedCombinations(new Set());
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmManualVariants}
                disabled={selectedCombinations.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Crear {selectedCombinations.size} variante{selectedCombinations.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recuperación de wizard */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Producto incompleto detectado</h3>
            <p className="text-gray-600 mb-6">
              Detectamos que dejaste un producto sin terminar de crear. ¿Deseas continuar donde lo dejaste?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  clearWizardState();
                  setSavedStateForRecovery(null);
                  setShowRecoveryModal(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Empezar de nuevo
              </button>
              <button
                onClick={() => {
                  if (savedStateForRecovery) {
                    restoreWizardState(savedStateForRecovery);
                  }
                  setShowRecoveryModal(false);
                }}
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
