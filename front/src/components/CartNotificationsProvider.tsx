"use client";

import useCartSummary from "../hooks/useCartSummary";

export default function CartNotificationsProvider() {
  console.log('🔔 CartNotificationsProvider montado - llamando useCartSummary(true)');
  
  // Este componente siempre está montado y llama a useCartSummary
  // con enableNotifications=true para que las notificaciones de tier funcionen globalmente
  // Los otros componentes (CartModal, checkout) llamarán useCartSummary() sin el parámetro
  // para solo obtener datos sin disparar notificaciones duplicadas
  useCartSummary(true);
  
  return null;
}
