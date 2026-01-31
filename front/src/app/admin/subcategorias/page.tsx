"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchCategories, Category, Subcategory } from "../../../utils/api";

export default function SubcategoryAdmin() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [successList, setSuccessList] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editName, setEditName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCategoryId, setCreatedCategoryId] = useState<string>("");

  // Fetch subcategories when categoryId changes
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    
    const token = localStorage.getItem("token") ?? undefined;
    fetch(`${API_URL}/categories/${categoryId}/subcategories`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(data => {
        setSubcategories(data || []);
      })
      .catch(err => {
        console.error('Error fetching subcategories:', err);
        setSubcategories([]);
      });
  }, [categoryId, successList]);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta subcategoría?")) return;
    setErrorList(null);
    setSuccessList(null);
    try {
      const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${API_URL}/subcategories/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la subcategoría");
      setSuccessList("Subcategoría eliminada exitosamente");
    } catch (e: any) {
      setErrorList(e.message);
    }
  };

  const handleEdit = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setEditName(sub.name);
    setErrorList(null);
    setSuccessList(null);
  };

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return;
    if (!editName.trim()) {
      setErrorList("El nombre no puede estar vacío");
      return;
    }
    
    setErrorList(null);
    setSuccessList(null);
    try {
      const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch(`${API_URL}/subcategories/${editingSubcategory.id || editingSubcategory.ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editName,
          category_id: editingSubcategory.category_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la subcategoría");
      setSuccessList("Subcategoría actualizada exitosamente");
      setEditingSubcategory(null);
      setEditName("");
    } catch (e: any) {
      setErrorList(e.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubcategory(null);
    setEditName("");
    setErrorList(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token") ?? undefined;
    fetchCategories(token)
      .then(setCategories)
      .catch(e => console.error("No se pudieron cargar categorías", e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!categoryId || Number(categoryId) === 0) {
      setError("Debes seleccionar una categoría válida.");
      return;
    }
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch("http://localhost:8080/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          category_id: Number(categoryId),
        }),
      });
      if (!res.ok) throw new Error("No se pudo crear la subcategoría");
      setCreatedCategoryId(categoryId);
      setShowSuccessModal(true);
      setName("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCategoryId(createdCategoryId);
    setSuccessList("Subcategoría creada exitosamente");
    setTimeout(() => setSuccessList(null), 3000);
  };

  return (
    <section className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Crear subcategoría</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="border px-2 py-1 text-gray-900">
          <option value="">Selecciona categoría</option>
          {categories.filter(cat => (cat.id || cat.ID) && Number(cat.id || cat.ID) > 0).map(cat => (
            <option key={String(cat.id || cat.ID)} value={cat.id || cat.ID}>{cat.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Nombre de subcategoría" value={name} onChange={e => setName(e.target.value)} required className="border px-2 py-1 text-gray-900 placeholder:text-gray-400" />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Crear subcategoría</button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      
      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Subcategoría creada!</h3>
              <p className="text-gray-600 text-center mb-6">La subcategoría se ha creado exitosamente</p>
              <button 
                onClick={handleCloseSuccessModal}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full font-medium"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2 mt-6 text-gray-900">Listado de subcategorías existentes</h3>
      <p className="text-sm text-gray-600 mb-2">Selecciona una categoría arriba para ver sus subcategorías</p>
      
      {errorList && <div className="text-red-500 mt-2">{errorList}</div>}
      {successList && <div className="text-green-600 mt-2">{successList}</div>}
      
      {categoryId && subcategories.length === 0 && (
        <p className="text-gray-500 text-sm italic">No hay subcategorías en esta categoría</p>
      )}
      
      {subcategories.length > 0 && (
        <ul className="border rounded divide-y">
          {subcategories.map((sub: Subcategory) => {
            const isEditing = editingSubcategory && (editingSubcategory.id || editingSubcategory.ID) === (sub.id || sub.ID);
            
            if (isEditing) {
              return (
                <li key={sub.id || sub.ID} className="p-3 bg-blue-50">
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="border px-2 py-1 rounded text-gray-900 placeholder:text-gray-400"
                      placeholder="Nombre de subcategoría"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateSubcategory}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </li>
              );
            }
            
            return (
              <li key={sub.id || sub.ID} className="p-2 flex items-center justify-between hover:bg-gray-50">
                <span className="font-medium text-gray-900">{sub.name}</span>
                <div className="flex gap-2">
                  <button 
                    className="p-1 hover:bg-blue-50 rounded" 
                    title="Editar" 
                    onClick={() => handleEdit(sub)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="p-1 hover:bg-red-50 rounded" 
                    title="Eliminar" 
                    onClick={() => {
                      const sid = (sub.id ?? sub.ID);
                      if (sid === undefined || sid === null) return;
                      handleDelete(sid as string | number);
                    }}
                  >
                    <Image src="/trash.svg" alt="Eliminar" width={20} height={20} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
