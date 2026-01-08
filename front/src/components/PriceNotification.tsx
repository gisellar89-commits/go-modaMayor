"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: "tier_unlocked" | "near_tier" | "tier_lost";
  message: string;
  savings?: number;
  tierName?: string;
  itemsNeeded?: number;
}

let notificationQueue: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];

// Función global para mostrar notificaciones
if (typeof window !== "undefined") {
  // @ts-expect-error - global helper
  window.showPriceNotification = (notification: Omit<Notification, "id">) => {
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
    };
    notificationQueue.push(newNotification);
    listeners.forEach((listener) => listener([...notificationQueue]));

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      notificationQueue = notificationQueue.filter((n) => n.id !== newNotification.id);
      listeners.forEach((listener) => listener([...notificationQueue]));
    }, 5000);
  };
}

export default function PriceNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    listeners.push(setNotifications);
    return () => {
      listeners = listeners.filter((l) => l !== setNotifications);
    };
  }, []);

  const removeNotification = (id: string) => {
    notificationQueue = notificationQueue.filter((n) => n.id !== id);
    setNotifications([...notificationQueue]);
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification) => {
        let bgColor = "from-blue-50 to-cyan-50";
        let borderColor = "border-blue-300";
        let iconColor = "text-blue-600";
        let icon = "ℹ️";

        if (notification.type === "tier_unlocked") {
          bgColor = "from-green-50 to-emerald-50";
          borderColor = "border-green-400";
          iconColor = "text-green-700";
          icon = "🎉";
        } else if (notification.type === "near_tier") {
          bgColor = "from-orange-50 to-amber-50";
          borderColor = "border-orange-400";
          iconColor = "text-orange-700";
          icon = "⚡";
        } else if (notification.type === "tier_lost") {
          bgColor = "from-red-50 to-pink-50";
          borderColor = "border-red-300";
          iconColor = "text-red-700";
          icon = "⚠️";
        }

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto bg-gradient-to-r ${bgColor} border-2 ${borderColor} rounded-xl shadow-lg p-4 min-w-[320px] max-w-md animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{icon}</div>
              <div className="flex-1">
                <div className={`font-bold ${iconColor} mb-1`}>
                  {notification.type === "tier_unlocked" && "¡Nuevo nivel desbloqueado!"}
                  {notification.type === "near_tier" && "¡Casi llegas!"}
                  {notification.type === "tier_lost" && "Nivel de descuento perdido"}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {notification.message}
                </div>
                {notification.savings !== undefined && notification.savings > 0 && (
                  <div className="mt-2 bg-white/60 rounded-lg px-3 py-1.5 inline-block">
                    <span className="text-xs text-gray-600 font-medium">Estás ahorrando: </span>
                    <span className="text-base font-bold text-green-600">
                      ${notification.savings.toFixed(2)}
                    </span>
                  </div>
                )}
                {notification.itemsNeeded !== undefined && notification.itemsNeeded > 0 && (
                  <div className="mt-2 bg-white/60 rounded-lg px-3 py-1.5 inline-block">
                    <span className="text-xs text-gray-600 font-medium">Agregar: </span>
                    <span className="text-base font-bold text-orange-600">
                      {notification.itemsNeeded} {notification.itemsNeeded === 1 ? "prenda" : "prendas"} más
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Cerrar notificación"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
