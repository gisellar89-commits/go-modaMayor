"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para proteger rutas que requieren autenticación
 * @param allowedRoles - Array de roles permitidos (ej: ['admin', 'encargado'])
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que termine de cargar
    if (auth?.loading) return;

    // Si no hay usuario, redirigir a login
    if (!auth?.user) {
      router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Si se especificaron roles permitidos, verificar
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = auth.user.role.toLowerCase();
      const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);
      
      if (!isAllowed) {
        // Usuario no tiene permisos
        alert('No tenés permisos para acceder a esta sección.');
        router.replace('/');
        return;
      }
    }
  }, [auth?.user, auth?.loading, allowedRoles, router]);

  return {
    user: auth?.user || null,
    loading: auth?.loading || false,
    isAuthenticated: !!auth?.user,
    hasRole: (role: string) => auth?.user?.role.toLowerCase() === role.toLowerCase(),
  };
}
