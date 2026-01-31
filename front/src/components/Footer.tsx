"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [categories, setCategories] = useState<any[]>([]);
  const currentYear = new Date().getFullYear();

  console.log('Footer rendering');

  useEffect(() => {
    // Cargar categorías principales
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_URL}/public/categories`)
      .then(res => res.ok ? res.json() : [])
      .then(cats => setCategories(Array.isArray(cats) ? cats.slice(0, 6) : []))
      .catch(err => console.error('Error loading categories:', err));
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 w-full">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        {/* Mobile: Solo info básica */}
        <div className="md:hidden space-y-6">
          {/* Logo y descripción */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
              Moda x Mayor
            </h3>
            <p className="text-sm italic text-pink-300">Venta al por mayor</p>
          </div>
          
          <p className="text-sm text-center leading-relaxed">
            Ofrecemos moda de calidad al por mayor para tu negocio. 
            Trabajamos con las mejores marcas y tendencias del mercado.
          </p>
          
          {/* Información de contacto */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Buenos Aires, Argentina</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lun - Vie: 9:00 - 18:00hs</span>
            </div>
          </div>
          
          {/* Redes sociales */}
          <div className="flex justify-center gap-4 pt-2">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://wa.me/5491123456789" target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Desktop: Grid completo */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Columna 1: Información de la empresa */}
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">Moda x Mayor</h3>
              <p className="text-sm italic text-pink-300">Venta al por mayor</p>
            </div>
            <p className="text-sm mb-4">
              Ofrecemos moda de calidad al por mayor para tu negocio. 
              Trabajamos con las mejores marcas y tendencias del mercado.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Buenos Aires, Argentina</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Lun - Vie: 9:00 - 18:00hs</span>
              </div>
            </div>
          </div>

          {/* Columna 2: Enlaces útiles */}
          <div>
            <h4 className="text-pink-300 font-semibold mb-4 text-lg">Enlaces Útiles</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/quienes-somos" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Quiénes Somos
                </Link>
              </li>
              <li>
                <Link href="/como-comprar" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Cómo Comprar
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/politica-cambios" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Política de Cambios
                </Link>
              </li>
              <li>
                <Link href="/terminos-condiciones" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                  <span>→</span> Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Categorías */}
          <div>
            <h4 className="text-pink-300 font-semibold mb-4 text-lg">Categorías</h4>
            <ul className="space-y-2 text-sm">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id ?? cat.ID}>
                    <Link 
                      href={`/productos?category=${cat.id ?? cat.ID}`} 
                      className="hover:text-yellow-400 transition-colors flex items-center gap-1"
                    >
                      <span>→</span> {cat.name ?? cat.Name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/productos" className="hover:text-yellow-400 transition-colors flex items-center gap-1"><span>→</span> Todos los Productos</Link></li>
                  <li><Link href="/productos?tag=new" className="hover:text-yellow-400 transition-colors flex items-center gap-1"><span>→</span> Nuevos Ingresos</Link></li>
                  <li><Link href="/productos?tag=featured" className="hover:text-yellow-400 transition-colors flex items-center gap-1"><span>→</span> Destacados</Link></li>
                  <li><Link href="/productos?tag=offers" className="hover:text-yellow-400 transition-colors flex items-center gap-1"><span>→</span> Ofertas</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Columna 4: Contacto y Redes */}
          <div>
            <h4 className="text-pink-300 font-semibold mb-4 text-lg">Contacto</h4>
            <div className="space-y-3 text-sm mb-6">
              <a 
                href="https://wa.me/5491123456789" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp: +54 9 11 2345-6789</span>
              </a>
              <a 
                href="mailto:info@modaxmayor.com"
                className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@modaxmayor.com</span>
              </a>
            </div>

            {/* Redes Sociales */}
            <h5 className="text-pink-300 font-semibold mb-3">Síguenos</h5>
            <div className="flex gap-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transition-all"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transition-all"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/5491123456789" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:to-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transition-all"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-pink-500/20 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 md:gap-4 text-sm md:text-sm">
            <p className="text-gray-200 text-center md:text-left font-medium">
              © {currentYear} Moda x Mayor. Todos los derechos reservados.
            </p>
            <p className="hidden md:flex text-gray-200 items-center gap-1">
              Desarrollado con <span className="text-pink-500">❤️</span> por el equipo de Moda x Mayor
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
