"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../utils/api";

export default function AddressReminderBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAddress = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        
        if (!token || !userStr) return;
        
        const user = JSON.parse(userStr);
        
        // Solo mostrar para clientes mayoristas, no para admin, vendedores ni encargados
        if (user.role !== "mayorista") {
          return;
        }
        
        // Check if user dismissed the banner in this session
        const dismissedKey = `address-banner-dismissed-${user.id}`;
        if (sessionStorage.getItem(dismissedKey)) {
          return;
        }

        // Check if user has addresses
        const res = await fetch(`${API_BASE}/addresses/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const addresses = await res.json();
          if (!addresses || addresses.length === 0) {
            setShow(true);
          }
        }
      } catch (error) {
        console.error("Error checking addresses:", error);
      }
    };

    checkAddress();
  }, []);

  const handleDismiss = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      sessionStorage.setItem(`address-banner-dismissed-${user.id}`, "true");
    }
    setDismissed(true);
    setTimeout(() => setShow(false), 300);
  };

  const handleAddAddress = () => {
    router.push("/perfil?section=addresses");
  };

  if (!show) return null;

  return (
    <div
      className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-300 ${
        dismissed ? "opacity-0 max-h-0" : "opacity-100 max-h-24"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">
                📍 Agregá tu dirección de envío
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                La necesitarás para completar tu primer pedido
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAddress}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
            >
              Agregar ahora
            </button>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-blue-100 transition-colors p-1"
              aria-label="Cerrar"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
