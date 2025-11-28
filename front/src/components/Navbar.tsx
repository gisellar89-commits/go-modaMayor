"use client";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import CartIcon from "./CartIcon";
import NotificationBell from "./NotificationBell";
import useCart from "../hooks/useCart";
 

export default function Navbar() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const { cart } = useCart();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<number, Array<{ id: number; name: string }>>>({});
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const closeTimer = useRef<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<number, boolean>>({});
  // dropdownRef not needed

  useEffect(() => {
    // fetch public categories for menu (if endpoint exists)
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/public/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.map((c: any) => ({ id: c.ID ?? c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  async function fetchSubcategories(categoryId: number) {
    if (subcategoriesMap[categoryId]) return; // already loaded
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/public/categories/${categoryId}/subcategories`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setSubcategoriesMap((prev) => ({ ...prev, [categoryId]: data.map((s: any) => ({ id: s.ID ?? s.id, name: s.name })) }));
    } catch (e) {
      // ignore
    }
  }

  async function fetchAllSubcategories() {
    // Load subcategories for categories that aren't yet cached
    const toLoad = categories.filter((c) => !subcategoriesMap[c.id]).map((c) => c.id);
    if (toLoad.length === 0) return;
    try {
      await Promise.all(toLoad.map(async (id) => {
        try {
          const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + `/public/categories/${id}/subcategories`);
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data)) return;
          setSubcategoriesMap((prev) => ({ ...prev, [id]: data.map((s: any) => ({ id: s.ID ?? s.id, name: s.name })) }));
        } catch (e) {
          // ignore individual failures
        }
      }));
    } catch (e) {
      // ignore
    }
  }

  const [query, setQuery] = useState("");

  function submitSearch(e: any) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return router.push('/productos');
    router.push(`/productos?search=${encodeURIComponent(q)}`);
  }

  function openMobileMenu() {
    setIsMobileMenuOpen(true);
    // prevent body scroll
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    // preload subcategories
    fetchAllSubcategories().catch(() => {});
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isMobileMenuOpen) closeMobileMenu();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  function toggleMobileCategory(id: number) {
    const next = !mobileExpanded[id];
    setMobileExpanded((p) => ({ ...p, [id]: next }));
    if (next) fetchSubcategories(id).catch(() => {});
  }

  return (
    <>
      <nav className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-black shadow-lg border-b border-yellow-600/20 relative z-50">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 md:gap-3 group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-full overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center border-2 border-yellow-400 shadow-lg shadow-yellow-900/50 group-hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="Moda x Mayor" className="h-full w-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-200 bg-clip-text text-transparent">Moda x Mayor</span>
              <span className="text-xs text-pink-300/80 italic">Venta al por mayor</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 mx-6">
          <form onSubmit={submitSearch} className="max-w-2xl mx-auto w-full">
            <label htmlFor="site-search" className="sr-only">Buscar productos</label>
            <div className="relative">
              <input 
                id="site-search" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="¿Qué estás buscando?" 
                className="w-full bg-white/10 backdrop-blur-sm border border-pink-400/30 rounded-full py-2.5 px-5 pr-32 text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all" 
              />
              <button 
                aria-label="Buscar" 
                type="submit" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-500 hover:from-yellow-500 hover:via-pink-500 hover:to-yellow-600 text-gray-900 px-6 py-1.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-pink-500/50"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>

        <ul className="flex gap-2 sm:gap-3 md:gap-4 items-center flex-shrink-0">
          {/* top bar: removed duplicate Productos link (kept in secondary nav) */}
          {/* Mobile hamburger */}
          <li className="md:hidden">
            <button aria-label="Abrir menú" onClick={openMobileMenu} className="p-2 rounded-md border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </li>
          <li>
            <NotificationBell />
          </li>
          <li>
            <a
              href="/carrito"
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined' && (window as any).openCart) {
                  (window as any).openCart();
                } else {
                  router.push('/carrito');
                }
              }}
              className="relative inline-flex items-center"
            >
              {/* show cart icon and badges: orange for pending verification, red for total */}
              <CartIcon pendingCount={cart?.items ? cart.items.filter((it: any) => it.requires_stock_check && !it.stock_confirmed).length : 0} />
              {cart?.items && cart.items.length > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-full shadow-lg border border-pink-700">
                  {cart.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                </span>
              )}
            </a>

            {/* small info tooltip to explain pending items */}
            {cart?.items && cart.items.filter((it: any) => it.requires_stock_check && !it.stock_confirmed).length > 0 && (
              <span title="Algunos artículos están pendientes de verificación por la vendedora y no se incluyen en el total mostrado" className="text-xs text-pink-300/70 ml-2 hidden md:inline cursor-help">ℹ️</span>
            )}
          </li>
          {user && ["admin", "encargado", "vendedor"].includes(user.role) && (
            <li>
              <Link href="/admin" className="text-yellow-400 hover:text-pink-400 font-medium transition-colors">Admin</Link>
            </li>
          )}
          {user && user.role === 'vendedor' && (
            <li>
              <Link href="/vendedora/carritos" className="text-yellow-400 hover:text-pink-400 font-medium transition-colors">Vendedora</Link>
            </li>
          )}
          {!user && (
            <li className="relative">
              <button aria-haspopup="true" aria-expanded={showAccountMenu} onClick={() => setShowAccountMenu((s) => !s)} className="p-1 rounded-full hover:bg-yellow-500/20 text-yellow-400 transition-colors">
                {/* user icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.82.6 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-black border border-yellow-500/30 shadow-lg shadow-yellow-500/20 rounded z-[100]">
                  <ul className="py-1">
                    <li>
                      <Link href="/login" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Iniciar sesión</Link>
                    </li>
                    <li>
                      <Link href="/registro" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Crear cuenta</Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          )}
          {user && (
            <li className="relative">
              <button aria-haspopup="true" aria-expanded={showAccountMenu} onClick={() => setShowAccountMenu((s) => !s)} className="flex items-center gap-2 p-1 rounded-md hover:bg-yellow-500/20 text-yellow-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.82.6 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user && <span className="text-sm hidden md:inline text-white">{user.name}</span>}
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-black border border-yellow-500/30 shadow-lg shadow-yellow-500/20 rounded z-[100]">
                  <ul className="py-1">
                    <li>
                      <Link href="/perfil/pedidos" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Mis pedidos</Link>
                    </li>
                    <li>
                      <Link href="/perfil" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Mi perfil</Link>
                    </li>
                    <li>
                      <Link href="/perfil#direcciones" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Direcciones</Link>
                    </li>
                    <li>
                      <Link href="/forgot-password" onClick={() => setShowAccountMenu(false)} className="block px-4 py-2 hover:bg-yellow-500/20 text-white">Cambiar contraseña</Link>
                    </li>
                    <li className="px-4 py-2">
                      <LogoutButton />
                    </li>
                  </ul>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Secondary nav (links like Inicio, Contacto, Quiénes somos, Liquidación) - Oculto en mobile */}
      <div className="hidden md:block w-full bg-gradient-to-b from-gray-800 to-gray-900 border-t border-yellow-500/20">
        <div className="max-w-6xl mx-auto px-6 py-2 flex gap-6 items-center text-sm text-white">
          <Link href="/" className="hover:text-pink-400 transition-colors">Inicio</Link>
          <Link href="/productos" className="hover:text-pink-400 transition-colors">Todos los productos</Link>

          <div
            className="relative"
            onMouseEnter={async () => { clearTimeout(closeTimer.current); setShowCategoriesDropdown(true); await fetchAllSubcategories(); }}
            onMouseLeave={() => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setShowCategoriesDropdown(false), 350); }}
          >
            <button className="inline-flex items-center gap-1 hover:text-pink-400 transition-colors">Categorías <span className="text-xs">▾</span></button>
            {showCategoriesDropdown && categories.length > 0 && (
              <div
                className="absolute left-0 top-full mt-2 w-screen bg-gray-900 border-t border-yellow-500/30 shadow-lg shadow-yellow-500/20 z-40"
                onMouseEnter={() => { clearTimeout(closeTimer.current); }}
                onMouseLeave={() => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setShowCategoriesDropdown(false), 350); }}
              >
                <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
                  {/* Categories only: distribute evenly across 3 columns */}
                  {(() => {
                    const cols = 3;
                    const perCol = Math.ceil(categories.length / cols) || categories.length;
                    const columns: Array<Array<any>> = [];
                    for (let i = 0; i < cols; i++) {
                      columns.push(categories.slice(i * perCol, (i + 1) * perCol));
                    }
                    return columns.map((col, idx) => (
                      <div key={idx} className="col-span-1">
                        <ul className="space-y-3">
                          {col.map((c) => (
                            <li key={c.id} onMouseEnter={() => fetchSubcategories(c.id)}>
                              <Link href={`/productos?category=${c.id}`} className="block font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">{c.name}</Link>
                              {subcategoriesMap[c.id] && subcategoriesMap[c.id].length > 0 && (
                                <ul className="mt-2 grid gap-1">
                                  {subcategoriesMap[c.id].map((s) => (
                                    <li key={s.id}><Link href={`/productos?category=${c.id}&subcategory=${s.id}`} className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">{s.name}</Link></li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          <Link href="/contacto" className="hover:text-pink-400 transition-colors">Contacto</Link>
          <Link href="/preguntas-frecuentes" className="hover:text-pink-400 transition-colors">Preguntas frecuentes</Link>
          <Link href="/productos?filter=liquidacion" className="font-semibold text-pink-400 hover:text-pink-300 transition-colors">⚡ Liquidación</Link>
        </div>
      </div>
      {/* Mobile side panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-hidden={!isMobileMenuOpen} role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobileMenu} />
          <div ref={mobilePanelRef} className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-auto">
            {/* Header del menú */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                {!user ? (
                  <div className="flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <Link href="/login" onClick={closeMobileMenu} className="font-medium text-gray-900 hover:text-pink-600">
                      Iniciar sesión
                    </Link>
                    <span className="text-gray-400">o</span>
                    <Link href="/registro" onClick={closeMobileMenu} className="font-medium text-gray-900 hover:text-pink-600">
                      Crear cuenta
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                )}
                <button aria-label="Cerrar" onClick={closeMobileMenu} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Buscador mobile */}
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={submitSearch}>
                <div className="relative">
                  <input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Buscar productos..." 
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" 
                  />
                  <button 
                    type="submit" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Menú de navegación */}
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <Link href="/" onClick={closeMobileMenu} className="block py-3 text-gray-900 font-medium hover:text-pink-600 transition-colors">
                    Inicio
                  </Link>
                </li>
                
                <li className="border-t border-gray-200 pt-1">
                  <button 
                    onClick={() => toggleMobileCategory(-1)} 
                    className="w-full text-left flex items-center justify-between py-3 text-gray-900 font-medium hover:text-pink-600 transition-colors"
                  >
                    <span>Categorías</span>
                    <span className="text-sm">{mobileExpanded[-1] ? '▾' : '▸'}</span>
                  </button>
                  {mobileExpanded[-1] && (
                    <ul className="pl-4 space-y-1 mb-2">
                      <li>
                        <Link href="/productos" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-pink-600 transition-colors">
                          Todos los productos
                        </Link>
                      </li>
                      {categories.map((c) => (
                        <li key={c.id}>
                          <button 
                            onClick={() => toggleMobileCategory(c.id)} 
                            className="w-full text-left flex items-center justify-between py-2 text-gray-700 hover:text-pink-600 transition-colors"
                          >
                            <span>{c.name}</span>
                            <span className="text-xs">{mobileExpanded[c.id] ? '▾' : '▸'}</span>
                          </button>
                          {mobileExpanded[c.id] && subcategoriesMap[c.id] && (
                            <ul className="pl-4 space-y-1">
                              {subcategoriesMap[c.id].map((s) => (
                                <li key={s.id}>
                                  <Link 
                                    href={`/productos?category=${c.id}&subcategory=${s.id}`} 
                                    onClick={closeMobileMenu} 
                                    className="block py-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                                  >
                                    {s.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                <li className="border-t border-gray-200 pt-1">
                  <Link href="/productos?filter=liquidacion" onClick={closeMobileMenu} className="block py-3 text-pink-600 font-bold hover:text-pink-700 transition-colors">
                    ⚡ SALE
                  </Link>
                </li>

                <li className="border-t border-gray-200 pt-1">
                  <button 
                    onClick={() => toggleMobileCategory(-2)} 
                    className="w-full text-left flex items-center justify-between py-3 text-gray-900 font-medium hover:text-pink-600 transition-colors"
                  >
                    <span>Ayuda</span>
                    <span className="text-sm">{mobileExpanded[-2] ? '▾' : '▸'}</span>
                  </button>
                  {mobileExpanded[-2] && (
                    <ul className="pl-4 space-y-1 mb-2">
                      <li>
                        <Link href="/contacto" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-pink-600 transition-colors">
                          Contacto
                        </Link>
                      </li>
                      <li>
                        <Link href="/preguntas-frecuentes" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-pink-600 transition-colors">
                          Preguntas frecuentes
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {user && (
                  <>
                    <li className="border-t border-gray-200 pt-1">
                      <Link href="/perfil" onClick={closeMobileMenu} className="block py-3 text-gray-900 hover:text-pink-600 transition-colors">
                        Mi perfil
                      </Link>
                    </li>
                    <li>
                      <Link href="/perfil/pedidos" onClick={closeMobileMenu} className="block py-3 text-gray-900 hover:text-pink-600 transition-colors">
                        Mis pedidos
                      </Link>
                    </li>
                    <li className="border-t border-gray-200 pt-3">
                      <div onClick={closeMobileMenu}>
                        <LogoutButton />
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
