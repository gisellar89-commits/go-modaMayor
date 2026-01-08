import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación de admin/encargado
const adminRoutes = ['/admin'];

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/productos', '/contacto', '/faqs'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si es una ruta de admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute) {
    // En el servidor no tenemos acceso a localStorage, así que solo
    // redirigimos si es una petición directa sin estado de sesión
    // El AdminGuard del cliente manejará la verificación real
    
    // Podrías implementar cookies de sesión aquí si quieres protección server-side
    // Por ahora, dejamos que el cliente maneje la redirección
  }
  
  return NextResponse.next();
}

// Configurar qué rutas ejecutan este middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
