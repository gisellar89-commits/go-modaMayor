"use client";

import { useState, useEffect } from "react";

interface FAQ {
  id?: number;
  ID?: number;
  question: string;
  answer: string;
  order: number;
  category?: string;
}

// Categorías fijas del sistema
const CATEGORIES = [
  "Proceso de Compra y Pedidos",
  "Stock y Disponibilidad",
  "Variantes, Talles y Colores",
  "Precios y Condiciones de Venta al por Mayor",
  "Envíos y Entregas",
  "Formas de Pago",
  "Cambios y Devoluciones",
  "Cuenta y Usuario",
  "Otras"
];

export default function FAQsPublicPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8080/faqs");
      if (!res.ok) throw new Error("Error al cargar las FAQs");
      const data = await res.json();
      setFaqs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Agrupar FAQs por categoría
  const faqsByCategory = CATEGORIES.map(category => ({
    category,
    faqs: faqs.filter(f => f.category === category)
  })).filter(group => group.faqs.length > 0); // Solo mostrar categorías con FAQs

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando preguntas frecuentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-400 to-yellow-500 rounded-full mb-4 shadow-lg shadow-yellow-500/50">
            <svg
              className="w-10 h-10 text-white"
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
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-3">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-gray-600">
            Encuentra respuestas a las preguntas más comunes sobre nuestra venta al por mayor
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista de FAQs agrupadas por categoría */}
        {faqsByCategory.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg text-gray-600">
              No hay preguntas frecuentes disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {faqsByCategory.map((group, idx) => (
              <div 
                key={group.category} 
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header de categoría */}
                <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-yellow-50 px-6 py-5 border-b border-gray-200">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-pink-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                      {idx + 1}
                    </div>
                    <span className="bg-gradient-to-r from-yellow-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
                      {group.category}
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-2 ml-13">
                    {group.faqs.length} {group.faqs.length === 1 ? 'pregunta' : 'preguntas'}
                  </p>
                </div>

                {/* FAQs de esta categoría */}
                <div className="divide-y divide-gray-100">
                  {group.faqs.map((faq) => {
                    const faqId = faq.id || faq.ID || 0;
                    const isExpanded = expandedId === faqId;

                    return (
                      <div key={faqId} className="transition-colors hover:bg-yellow-50/50">
                        <button
                          onClick={() => toggleExpand(faqId)}
                          className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <svg 
                              className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" 
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
                            <h3 className="flex-1 text-base md:text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                              {faq.question}
                            </h3>
                          </div>
                          <svg
                            className={`w-6 h-6 text-pink-500 transition-transform flex-shrink-0 ${
                              isExpanded ? "transform rotate-180" : ""
                            }`}
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

                        {/* Respuesta expandible */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? "max-h-[1000px]" : "max-h-0"
                          }`}
                        >
                          <div className="px-6 pb-5 pt-2 bg-gradient-to-b from-yellow-50/30 to-pink-50/30">
                            <div className="ml-8 pl-4 border-l-2 border-pink-300">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje de ayuda adicional */}
        <div className="mt-12 bg-gradient-to-r from-yellow-50 via-pink-50 to-yellow-50 border border-yellow-200 rounded-xl p-8 text-center shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-pink-400 to-yellow-500 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent mb-3">
            ¿No encontraste lo que buscabas?
          </h3>
          <p className="text-gray-600 mb-6">
            Contáctanos y con gusto te ayudaremos con tu consulta
          </p>
          <a
            href="/contacto"
            className="inline-block bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-500 hover:from-yellow-500 hover:via-pink-500 hover:to-yellow-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
}
