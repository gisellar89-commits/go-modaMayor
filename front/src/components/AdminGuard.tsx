"use client";
import { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface AdminGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

/**
 * Componente que protege contenido para usuarios autenticados con roles específicos
 */
export default function AdminGuard({ children, allowedRoles = ['admin', 'encargado'], fallback }: AdminGuardProps) {
  const { loading, isAuthenticated, user } = useRequireAuth(allowedRoles);

  // Mientras carga, mostrar spinner o fallback
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permisos...</p>
          </div>
        </div>
      )
    );
  }

  // Si no está autenticado o no tiene el rol, el hook ya lo redirigió
  // Mostrar spinner mientras redirige
  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role || ''))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos correctos
  return <>{children}</>;
}
