"use client";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function AdminSidebar() {
  const auth = useAuth();
  const role = auth?.user?.role;
  const pathname = usePathname() || "/";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_sidebar_collapsed");
      if (stored) setCollapsed(stored === "1");
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("admin_sidebar_collapsed", collapsed ? "1" : "0"); } catch (e) {}
  }, [collapsed]);

  if (!auth || !auth.user) return null;

  const menu: { key: string; label: string; href: string; icon?: any }[] = [];
  
  // Dashboard - todos los roles
  menu.push({ key: "dashboard", label: "Dashboard", href: "/admin", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> });
  
  // Ventas - todos los roles
  menu.push({ key: "ventas", label: "Ventas", href: "/admin/ventas", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> });

  // Agregar reportes solo para admin
  if (role === "admin") {
    menu.push({ key: "reportes", label: "Reportes", href: "/admin/reportes", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> });
  }

  // Sección de Catálogo (productos y configuraciones relacionadas)
  const catalogMenu: { key: string; label: string; href: string; icon?: any }[] = [];
  
  // Productos e Inventario - todos los roles
  catalogMenu.push({ key: "productos", label: "Productos", href: "/admin/productos", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> });
  catalogMenu.push({ key: "inventario", label: "Inventario", href: "/admin/inventario", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> });
  
  // Opciones adicionales solo para admin y encargado
  if (role === "admin" || role === "encargado") {
    catalogMenu.push({ key: "movimientos-stock", label: "Movimientos Stock", href: "/admin/movimientos-stock", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg> });
    catalogMenu.push({ key: "remitos-internos", label: "Remitos Internos", href: "/admin/remitos-internos", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> });
    catalogMenu.push({ key: "proveedores", label: "Proveedores", href: "/admin/proveedores", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> });
    catalogMenu.push({ key: "temporadas", label: "Temporadas", href: "/admin/temporadas", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> });
    catalogMenu.push({ key: "categorias", label: "Categorías", href: "/admin/categorias", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> });
    catalogMenu.push({ key: "subcategorias", label: "Subcategorías", href: "/admin/subcategorias", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> });
    catalogMenu.push({ key: "tipos-talles", label: "Tipos de Talles", href: "/admin/tipos-talles", icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> });
    catalogMenu.push({ key: "colores", label: "Colores", href: "/admin/colores", icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M12 2v20M2 12h20"/></svg> });
  }

  if (role === "admin" || role === "encargado") {
    catalogMenu.push({ key: "kits", label: "Kits", href: "/admin/kits", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> });
  }

  // Gestión de usuarios y vendedores
  if (role === "admin" || role === "encargado") {
    menu.push({ key: "vendedores", label: "Vendedores", href: "/admin/vendedores", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> });
  }
  if (role === "admin") {
    menu.push({ key: "usuarios", label: "Usuarios", href: "/admin/usuarios", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> });
  }

  // Ajustes del sitio web (solo configuraciones visuales)
  const settingsMenu: { key: string; label: string; href: string; icon?: any }[] = [];
  if (role === "admin" || role === "encargado") {
    settingsMenu.push({ key: "faqs", label: "Preguntas Frecuentes", href: "/admin/faqs", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> });
    settingsMenu.push({ key: "contacto", label: "Contacto", href: "/admin/configuracion/contacto", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> });
    settingsMenu.push({ key: "config-secciones", label: "Config. Secciones", href: "/admin/config-secciones-home", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> });
    settingsMenu.push({ key: "home-sections", label: "Productos x Sección", href: "/admin/home-sections", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7H4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4h-6V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3H4v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6h-6v-6z" /></svg> });
    settingsMenu.push({ key: "precios", label: "Niveles de Precio", href: "/admin/configuracion/precios", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> });
    settingsMenu.push({ key: "topbar", label: "Topbar", href: "/admin/topbar", icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> });
    settingsMenu.push({ key: "banners", label: "Banners", href: "/admin/banners", icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" /><path d="M8 11l2 2 3-3 4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> });
    settingsMenu.push({ key: "videos", label: "Videos", href: "/admin/videos", icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23 7l-7 5 7 5V7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> });
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  }

  return (
    <aside className={clsx(collapsed ? 'w-16' : 'w-64', 'bg-white border-r h-full p-3 transition-all')}> 
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={clsx('rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center', collapsed && 'mx-auto')}>
            {/* simple avatar iniciales */}
            <span className="text-sm font-semibold text-gray-700">{auth.user?.name?.split(' ').map(n=>n[0]).slice(0,2).join('') || 'U'}</span>
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm text-gray-500">Conectado como</div>
              <div className="font-semibold text-gray-900">{auth.user?.name} <span className="text-xs text-gray-500">({auth.user?.role})</span></div>
            </div>
          )}
        </div>
        <button aria-expanded={!collapsed} onClick={() => setCollapsed(s => !s)} className="p-1 rounded hover:bg-gray-100" title={collapsed ? 'Expandir' : 'Colapsar'}>
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} /></svg>
        </button>
      </div>
      {/* Menú principal */}
      <nav className="flex flex-col gap-1" role="navigation" aria-label="Admin menu">
        {menu.map(item => (
          <Link key={item.key} href={item.href} title={collapsed ? item.label : undefined} className={clsx('flex items-center gap-3 px-3 py-2 rounded transition relative', isActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')}>
            <span className={clsx('flex-none', collapsed ? 'mx-auto' : '')} aria-hidden>
              {item.icon}
            </span>
            {!collapsed && <span className="flex-1">{item.label}</span>}
            {isActive(item.href) && (
              <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></span>
            )}
          </Link>
        ))}
      </nav>

      {/* Sección Catálogo */}
      <div className="mt-4 pt-2 border-t">
        {!collapsed && (
          <div className="px-3 py-1 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Catálogo</span>
          </div>
        )}
        <nav className="flex flex-col gap-1" aria-label="Catálogo">
          {catalogMenu.map(item => (
            <Link key={item.key} href={item.href} title={collapsed ? item.label : undefined} className={clsx('flex items-center gap-3 px-3 py-2 rounded transition relative', isActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')}>
              <span className={clsx('flex-none', collapsed ? 'mx-auto' : '')} aria-hidden>
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1 text-sm">{item.label}</span>}
              {isActive(item.href) && (
                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Sección Ajustes */}
      {settingsMenu.length > 0 && (
        <div className="mt-4 pt-2 border-t">
          {!collapsed && (
            <div className="px-3 py-1 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuración</span>
            </div>
          )}
          <nav className="flex flex-col gap-1" aria-label="Ajustes">
            {settingsMenu.map(item => (
              <Link key={item.key} href={item.href} title={collapsed ? item.label : undefined} className={clsx('flex items-center gap-3 px-3 py-2 rounded transition relative', isActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')}>
                <span className={clsx('flex-none', collapsed ? 'mx-auto' : '')} aria-hidden>
                  {item.icon}
                </span>
                {!collapsed && <span className="flex-1 text-sm">{item.label}</span>}
                {isActive(item.href) && (
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
