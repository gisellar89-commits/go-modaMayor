"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface HomeSectionEntry {
  ID: number;
  section: string;
  product_id: number;
  order: number;
  active: boolean;
  CreatedAt: string;
}

interface Product {
  ID: number;
  name: string;
  code: string;
  image_url?: string;
}

const SECTION_OPTIONS = [
  { value: "featured", label: "Destacados", description: "Productos destacados en home" },
  { value: "new_arrivals", label: "Novedades", description: "Productos nuevos recién llegados" },
  { value: "season", label: "De Temporada", description: "Productos de la temporada actual" },
  { value: "best_sellers", label: "Más Vendidos", description: "Productos más populares" },
  { value: "offers", label: "Ofertas", description: "Productos en oferta especial" },
];

export default function SeccionesHomePage() {
  const auth = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<HomeSectionEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HomeSectionEntry | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filterSection, setFilterSection] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Form data
  const [formSection, setFormSection] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    if (!auth || !auth.user) {
      router.push("/login");
      return;
    }
    if (auth.user.role !== "admin" && auth.user.role !== "encargado") {
      router.push("/admin");
      return;
    }
    loadEntries();
    loadProducts();
  }, [auth, router]);

  async function loadEntries() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/settings/home_sections`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al cargar secciones");
      const data = await res.json();
      setEntries(data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar secciones");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  }

  function openCreateModal() {
    setEditingEntry(null);
    setFormSection("featured");
    setFormProductId("");
    setFormOrder(0);
    setFormActive(true);
    setSearchProduct("");
    setSearchResults([]);
    setShowModal(true);
  }

  function openEditModal(entry: HomeSectionEntry) {
    setEditingEntry(entry);
    setFormSection(entry.section);
    setFormProductId(entry.product_id.toString());
    setFormOrder(entry.order);
    setFormActive(entry.active);
    setSearchProduct("");
    setSearchResults([]);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEntry(null);
    setError("");
  }

  async function handleSave() {
    if (!formSection || !formProductId) {
      setError("Sección y producto son obligatorios");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("section", formSection);
      formData.append("product_id", formProductId);
      formData.append("order", formOrder.toString());
      formData.append("active", formActive ? "1" : "0");

      const url = editingEntry
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/settings/home_sections/${editingEntry.ID}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/settings/home_sections`;

      const method = editingEntry ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al guardar");
      }

      await loadEntries();
      closeModal();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: HomeSectionEntry) {
    const productName = getProductName(entry.product_id);
    if (!confirm(`¿Eliminar "${productName}" de la sección "${getSectionLabel(entry.section)}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/settings/home_sections/${entry.ID}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al eliminar");
      }

      await loadEntries();
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  }

  function handleSearchProduct(query: string) {
    setSearchProduct(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(results.slice(0, 10));
  }

  function selectProduct(product: Product) {
    setFormProductId(product.ID.toString());
    setSearchProduct(`${product.name} (${product.code || product.ID})`);
    setSearchResults([]);
  }

  function getSectionLabel(section: string): string {
    return SECTION_OPTIONS.find((s) => s.value === section)?.label || section;
  }

  function getProductName(productId: number): string {
    const product = products.find((p) => p.ID === productId);
    return product ? product.name : `Producto #${productId}`;
  }

  const filteredEntries = filterSection
    ? entries.filter((e) => e.section === filterSection)
    : entries;

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.section]) acc[entry.section] = [];
    acc[entry.section].push(entry);
    return acc;
  }, {} as Record<string, HomeSectionEntry[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <span>Admin</span> <span className="mx-2">/</span>{" "}
          <span>Configuración</span> <span className="mx-2">/</span>{" "}
          <span className="text-gray-900 font-medium">Secciones Home</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Secciones Destacadas Home</h1>
            <p className="text-gray-600 mt-1">
              Gestiona qué productos se muestran en las secciones de la página principal
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Secciones de productos destacados</p>
            <p>
              Estas secciones se muestran en la página principal para destacar productos específicos.
              Puedes agregar el mismo producto a múltiples secciones y ordenarlos como prefieras.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filtro */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Sección
        </label>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todas las secciones</option>
          {SECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped Sections */}
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-600 mb-2">No hay productos destacados</p>
          <p className="text-sm text-gray-500">
            Comienza agregando productos a las secciones del home
          </p>
        </div>
      ) : (
        Object.entries(groupedEntries).map(([section, sectionEntries]) => (
          <div key={section} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">
                {getSectionLabel(section)}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({sectionEntries.length} productos)
                </span>
              </h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sectionEntries.map((entry) => (
                      <tr key={entry.ID} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {entry.order}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getProductName(entry.product_id)}
                          </div>
                          <div className="text-xs text-gray-500">ID: {entry.product_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {entry.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(entry)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Eliminar"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEntry ? "Editar Entrada" : "Agregar Producto a Sección"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sección <span className="text-red-500">*</span>
                </label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Buscar Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                  placeholder="Escribe el nombre o código del producto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.ID}
                        onClick={() => selectProduct(product)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          Código: {product.code || "-"} | ID: {product.ID}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {formProductId && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Producto seleccionado (ID: {formProductId})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Números menores aparecen primero
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Activo (visible en el sitio público)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
