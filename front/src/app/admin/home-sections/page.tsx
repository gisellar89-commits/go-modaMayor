"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  ID: number;
  name: string;
  code: string;
  image_url?: string;
  cost_price: number;
}

interface HomeSectionEntry {
  ID: number;
  section: string;
  product_id: number;
  product?: Product;
  order: number;
  active: boolean;
}

const SECTIONS = [
  { key: "new_arrivals", label: "Nuevos Ingresos", icon: "🆕", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { key: "featured", label: "Destacados", icon: "⭐", color: "bg-yellow-100 border-yellow-300 text-yellow-800" },
  { key: "offers", label: "En Oferta", icon: "🏷️", color: "bg-red-100 border-red-300 text-red-800" },
  { key: "trending", label: "Tendencias", icon: "🔥", color: "bg-orange-100 border-orange-300 text-orange-800" },
  { key: "bestsellers", label: "Más Vendidos", icon: "💎", color: "bg-purple-100 border-purple-300 text-purple-800" },
];

export default function HomeSectionsPage() {
  const [entries, setEntries] = useState<HomeSectionEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("new_arrivals");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [entriesRes, productsRes] = await Promise.all([
        fetch("http://localhost:8080/settings/home_sections", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch("http://localhost:8080/products", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(Array.isArray(entriesData) ? entriesData : []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (e: any) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const getEntriesBySection = (section: string) => {
    return entries
      .filter((e) => e.section === section)
      .sort((a, b) => a.order - b.order);
  };

  const getProductById = (id: number): Product | undefined => {
    return products.find((p) => p.ID === id);
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      alert("Selecciona un producto");
      return;
    }

    const token = localStorage.getItem("token");
    const sectionEntries = getEntriesBySection(selectedSection);
    const nextOrder = sectionEntries.length > 0 ? Math.max(...sectionEntries.map((e) => e.order)) + 1 : 0;

    try {
      const formData = new FormData();
      formData.append("section", selectedSection);
      formData.append("product_id", selectedProductId.toString());
      formData.append("order", nextOrder.toString());
      formData.append("active", "true");

      const res = await fetch("http://localhost:8080/settings/home_sections", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Error al agregar producto");

      setSuccess("Producto agregado exitosamente");
      setShowAddModal(false);
      setSelectedProductId(null);
      setSearchQuery("");
      loadData();
    } catch (e: any) {
      setError(e.message || "Error al agregar producto");
    }
  };

  const handleToggleActive = async (entryId: number, currentActive: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      formData.append("active", (!currentActive).toString());

      const res = await fetch(`http://localhost:8080/settings/home_sections/${entryId}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      setSuccess("Estado actualizado");
      loadData();
    } catch (e: any) {
      setError(e.message || "Error al actualizar");
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("¿Eliminar este producto de la sección?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/settings/home_sections/${entryId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Error al eliminar");

      setSuccess("Producto eliminado de la sección");
      loadData();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    }
  };

  const handleSyncFromTags = async (section: string) => {
    if (!confirm(`¿Sincronizar "${SECTIONS.find(s => s.key === section)?.label}" automáticamente desde los tags de productos?\n\nEsto reemplazará las entradas manuales actuales.`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/settings/home_sections/sync-from-tags?section=${section}&limit=12`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Error al sincronizar");

      const data = await res.json();
      setSuccess(`Sincronización completada: ${data.synced[section] || 0} productos agregados`);
      loadData();
    } catch (e: any) {
      setError(e.message || "Error al sincronizar");
    }
  };

  const handleMoveUp = async (entry: HomeSectionEntry) => {
    const sectionEntries = getEntriesBySection(entry.section);
    const currentIndex = sectionEntries.findIndex((e) => e.ID === entry.ID);
    if (currentIndex <= 0) return;

    const prevEntry = sectionEntries[currentIndex - 1];
    await swapOrders(entry.ID, prevEntry.ID, entry.order, prevEntry.order);
  };

  const handleMoveDown = async (entry: HomeSectionEntry) => {
    const sectionEntries = getEntriesBySection(entry.section);
    const currentIndex = sectionEntries.findIndex((e) => e.ID === entry.ID);
    if (currentIndex >= sectionEntries.length - 1) return;

    const nextEntry = sectionEntries[currentIndex + 1];
    await swapOrders(entry.ID, nextEntry.ID, entry.order, nextEntry.order);
  };

  const swapOrders = async (id1: number, id2: number, order1: number, order2: number) => {
    const token = localStorage.getItem("token");
    try {
      const payload = [
        { id: id1, order: order2 },
        { id: id2, order: order1 },
      ];

      const res = await fetch("http://localhost:8080/settings/home_sections/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al reordenar");

      loadData();
    } catch (e: any) {
      setError(e.message || "Error al reordenar");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Secciones del Home</h1>
        <button
          onClick={() => router.push("/admin")}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <span>← Volver</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Acerca de las Secciones del Home</h3>
        <p className="text-sm text-blue-800">
          Gestiona qué productos aparecen en cada sección de la página principal. Puedes agregar productos manualmente 
          o usar los filtros automáticos basados en los tags que configuraste en cada producto.
        </p>
      </div>

      {/* Tabs de secciones */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2 overflow-x-auto">
          {SECTIONS.map((section) => {
            const count = getEntriesBySection(section.key).length;
            return (
              <button
                key={section.key}
                onClick={() => setSelectedSection(section.key)}
                className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  selectedSection === section.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de la sección seleccionada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {SECTIONS.find((s) => s.key === selectedSection)?.label}
          </h2>
          <div className="flex gap-2">
            {selectedSection !== "bestsellers" && (
              <button
                onClick={() => handleSyncFromTags(selectedSection)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center gap-2"
                title="Sincronizar automáticamente desde tags de productos"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sincronizar desde Tags</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>

        {/* Lista de productos en la sección */}
        <div className="space-y-3">
          {getEntriesBySection(selectedSection).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No hay productos en esta sección</p>
              <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
            </div>
          ) : (
            getEntriesBySection(selectedSection).map((entry, index) => {
              const product = getProductById(entry.product_id);
              const sectionEntries = getEntriesBySection(selectedSection);
              const isFirst = index === 0;
              const isLast = index === sectionEntries.length - 1;

              return (
                <div
                  key={entry.ID}
                  className={`border rounded-lg p-4 flex items-center gap-4 ${
                    entry.active ? "bg-white" : "bg-gray-100 opacity-60"
                  }`}
                >
                  {/* Imagen */}
                  <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {product?.image_url ? (
                      <img
                        src={product.image_url.startsWith("/") ? `http://localhost:8080${product.image_url}` : product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Info del producto */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product?.name || "Producto no encontrado"}</h3>
                    <p className="text-sm text-gray-600">Código: {product?.code}</p>
                    <p className="text-sm text-gray-600">Precio: ${product?.cost_price?.toFixed(2)}</p>
                  </div>

                  {/* Orden */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Orden: {entry.order}</span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {/* Mover arriba */}
                    <button
                      onClick={() => handleMoveUp(entry)}
                      disabled={isFirst}
                      className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="Mover arriba"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>

                    {/* Mover abajo */}
                    <button
                      onClick={() => handleMoveDown(entry)}
                      disabled={isLast}
                      className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="Mover abajo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Toggle activo */}
                    <button
                      onClick={() => handleToggleActive(entry.ID, entry.active)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        entry.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                      title={entry.active ? "Desactivar" : "Activar"}
                    >
                      {entry.active ? "✓ Activo" : "✗ Inactivo"}
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(entry.ID)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal para agregar producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Agregar Producto a {SECTIONS.find((s) => s.key === selectedSection)?.label}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery("");
                    setSelectedProductId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No se encontraron productos</p>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.ID}
                      onClick={() => setSelectedProductId(product.ID)}
                      className={`border rounded-lg p-3 cursor-pointer transition flex items-center gap-3 ${
                        selectedProductId === product.ID
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url.startsWith("/") ? `http://localhost:8080${product.image_url}` : product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">Código: {product.code}</p>
                      </div>
                      {selectedProductId === product.ID && (
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={handleAddProduct}
                disabled={!selectedProductId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Agregar Producto
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSelectedProductId(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
