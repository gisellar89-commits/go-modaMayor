"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook para mantener la sesión activa y marcar al usuario como online
 * Actualiza la actividad cada 3 minutos
 */
export function useActivityTracking() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Actualizar actividad inmediatamente al montar
    updateActivity();

    // Configurar intervalo para actualizar cada 3 minutos
    const interval = setInterval(() => {
      updateActivity();
    }, 3 * 60 * 1000); // 3 minutos

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  const updateActivity = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/user/activity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        // Si falla (ej: token expirado), no hacer nada
        // El usuario eventualmente será redirigido al login
        console.log("Activity update failed");
      }
    } catch (err) {
      console.error("Error updating activity:", err);
    }
  };
}

/**
 * Función para cerrar sesión correctamente
 */
export async function logout(router: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("token");

  if (token) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Error during logout:", err);
    }
  }

  // Limpiar storage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Disparar evento para que AuthContext se actualice
  window.dispatchEvent(new Event('auth:logout'));
  
  // Redirigir al login
  router.push("/login");
}
