"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  ID: number;
  name: string;
  code: string;
  image_url?: string;
  cost_price: number;
  wholesale_price?: number;
  discount1_price?: number;
  discount2_price?: number;
}

interface HomeSectionsData {
  new_arrivals?: Product[];
  featured?: Product[];
  offers?: Product[];
  trending?: Product[];
  bestsellers?: Product[];
}

const SECTIONS_CONFIG = {
  new_arrivals: {
    title: "Nuevos Ingresos",
    icon: "🆕",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
  },
  featured: {
    title: "Destacados",
    icon: "⭐",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "bg-yellow-50",
  },
  offers: {
    title: "En Oferta",
    icon: "🏷️",
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
  },
  trending: {
    title: "Tendencias",
    icon: "🔥",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
  },
  bestsellers: {
    title: "Más Vendidos",
    icon: "💎",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
  },
};

export default function HomeSectionsDisplay() {
  const [sections, setSections] = useState<HomeSectionsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
    
    // Agregar estilos para ocultar scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadSections = async () => {
    try {
      // mode=both: combina entradas manuales + automáticas basadas en tags
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/public/home_sections?mode=both&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch (e) {
      console.error("Error loading home sections:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const renderProductCard = (product: Product) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const imageUrl = product.image_url
      ? product.image_url.startsWith("/")
        ? `${API_URL}${product.image_url}`
        : product.image_url
      : null;

    return (
      <Link
        href={`/productos/${product.ID}`}
        className="group block h-full"
      >
        {/* Imagen */}
        <div className="aspect-square bg-gray-50 overflow-hidden relative mb-3 border border-transparent group-hover:border-yellow-500/30 transition-colors">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
              📦
            </div>
          )}
        </div>

        {/* Info minimalista */}
        <div className="space-y-1">
          <h3 className="text-sm font-normal text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400">{product.code}</p>

          {/* Precio principal */}
          <div className="pt-1">
            {product.discount1_price ? (
              <p className="text-base font-medium text-gray-900 group-hover:text-yellow-600 transition-colors">
                ${product.discount1_price.toFixed(2)}
              </p>
            ) : product.wholesale_price ? (
              <p className="text-base font-medium text-gray-900 group-hover:text-yellow-600 transition-colors">
                ${product.wholesale_price.toFixed(2)}
              </p>
            ) : (
              <p className="text-base font-medium text-gray-900 group-hover:text-yellow-600 transition-colors">
                ${product.cost_price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-12 py-8">
      {Object.entries(SECTIONS_CONFIG).map(([key, config]) => {
        const products = sections[key as keyof HomeSectionsData] || [];

        if (products.length === 0) return null;

        return (
          <section key={key} className="relative">
            {/* Header simple y limpio */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-yellow-500/40">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-light text-gray-800 uppercase tracking-wide">{config.title}</h2>
                <span className="text-sm text-yellow-600/70">
                  ({products.length})
                </span>
              </div>
              <Link
                href={`/productos?section=${key}`}
                className="text-sm text-gray-600 hover:text-yellow-600 font-medium transition-colors flex items-center gap-1 group"
              >
                <span>Ver todos</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Carrusel horizontal con scroll */}
            <div className="relative">
              <div 
                id={`scroll-${key}`}
                className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {products.map((product) => (
                  <div key={product.ID} className="flex-none w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] xl:w-[calc(20%-19.2px)] snap-start">
                    {renderProductCard(product)}
                  </div>
                ))}
              </div>

              {/* Botones de navegación (solo en desktop) */}
              {products.length > 4 && (
                <>
                  <button
                    onClick={() => {
                      const container = document.getElementById(`scroll-${key}`);
                      if (container) {
                        container.scrollBy({ left: -300, behavior: 'smooth' });
                      }
                    }}
                    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10 items-center justify-center border border-gray-200 hover:border-gray-300"
                    aria-label="Anterior"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const container = document.getElementById(`scroll-${key}`);
                      if (container) {
                        container.scrollBy({ left: 300, behavior: 'smooth' });
                      }
                    }}
                    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10 items-center justify-center border border-gray-200 hover:border-gray-300"
                    aria-label="Siguiente"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </section>
        );
      })}

      {/* Mensaje si no hay secciones */}
      {Object.values(sections).every((arr) => !arr || arr.length === 0) && (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-400 mb-4">🏗️</p>
          <p className="text-xl text-gray-600">No hay productos destacados aún</p>
          <p className="text-gray-500 mt-2">Vuelve pronto para ver nuestras novedades</p>
        </div>
      )}
    </div>
  );
}
