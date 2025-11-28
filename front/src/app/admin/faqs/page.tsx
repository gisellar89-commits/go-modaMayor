"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface FAQ {
  id?: number;
  ID?: number;
  question: string;
  answer: string;
  order: number;
  active: boolean;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export default function FAQsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/admin/faqs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error al cargar las FAQs");
      const data = await res.json();
      setFaqs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFAQ({
      question: "",
      answer: "",
      order: faqs.length,
      active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token || !editingFAQ) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
      order: parseInt(formData.get("order") as string) || 0,
      active: formData.get("active") === "on",
      category: formData.get("category") as string || "",
    };

    try {
      const id = editingFAQ.id || editingFAQ.ID;
      const url = id
        ? `http://localhost:8080/admin/faqs/${id}`
        : "http://localhost:8080/admin/faqs";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al guardar la FAQ");
      }

      await fetchFAQs();
      setShowModal(false);
      setEditingFAQ(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`¿Eliminar la FAQ "${faq.question}"?`)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const id = faq.id || faq.ID;
      const res = await fetch(`http://localhost:8080/admin/faqs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar la FAQ");
      await fetchFAQs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    setFaqs(newFaqs);
    updateOrder(newFaqs);
  };

  const moveDown = (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    setFaqs(newFaqs);
    updateOrder(newFaqs);
  };

  const updateOrder = async (orderedFaqs: FAQ[]) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      faqs: orderedFaqs.map((faq, idx) => ({
        id: faq.id || faq.ID,
        order: idx,
      })),
    };

    try {
      const res = await fetch("http://localhost:8080/admin/faqs/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al actualizar el orden");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Preguntas Frecuentes (FAQs)
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las preguntas frecuentes que verán los clientes
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              + Nueva FAQ
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Lista de FAQs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {faqs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">No hay FAQs creadas</p>
              <p className="text-sm">
                Crea la primera pregunta frecuente para ayudar a tus clientes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id || faq.ID}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Botones de orden */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover arriba"
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
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === faqs.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover abajo"
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
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {faq.question}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            faq.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {faq.active ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {faq.answer}
                      </p>
                      {faq.category && (
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-2">
                          {faq.category}
                        </span>
                      )}
                      <div className="text-xs text-gray-400">
                        Orden: {faq.order}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(faq)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar */}
      {showModal && editingFAQ && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFAQ.id || editingFAQ.ID ? "Editar FAQ" : "Nueva FAQ"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Pregunta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pregunta *
                </label>
                <textarea
                  name="question"
                  defaultValue={editingFAQ.question}
                  required
                  rows={2}
                  maxLength={500}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="¿Cuál es tu pregunta frecuente?"
                />
                <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
              </div>

              {/* Respuesta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuesta *
                </label>
                <textarea
                  name="answer"
                  defaultValue={editingFAQ.answer}
                  required
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe la respuesta detallada..."
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="category"
                  defaultValue={editingFAQ.category || ""}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="Proceso de Compra y Pedidos">Proceso de Compra y Pedidos</option>
                  <option value="Stock y Disponibilidad">Stock y Disponibilidad</option>
                  <option value="Variantes, Talles y Colores">Variantes, Talles y Colores</option>
                  <option value="Precios y Condiciones de Venta al por Mayor">Precios y Condiciones de Venta al por Mayor</option>
                  <option value="Envíos y Entregas">Envíos y Entregas</option>
                  <option value="Formas de Pago">Formas de Pago</option>
                  <option value="Cambios y Devoluciones">Cambios y Devoluciones</option>
                  <option value="Cuenta y Usuario">Cuenta y Usuario</option>
                  <option value="Otras">Otras</option>
                </select>
              </div>

              {/* Orden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  name="order"
                  defaultValue={editingFAQ.order}
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Menor número = aparece primero
                </p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  defaultChecked={editingFAQ.active}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Mostrar esta FAQ a los clientes
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
