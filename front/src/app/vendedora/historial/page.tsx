"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../utils/api";
import Link from "next/link";

interface Order {
  ID?: number;
  id?: number;
  user_id: number;
  assigned_to?: number;
  status: string;
  total: number;
  created_at: string;
  User?: { name?: string; email?: string };
  AssignedToUser?: { name?: string; email?: string };
}

export default function VendedoraHistorialPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/cart/seller`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("No se pudieron cargar las órdenes");
      const data = await res.json();
      // Filtrar solo órdenes con estado pagado, completado o enviado
      const validStates = ["pagado", "completado", "enviado"];
      const filtered = (data || []).filter((order: Order) => validStates.includes((order.status || "").toLowerCase()));
      setOrders(filtered);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      completado: "🎉 Completado",
      cancelado: "❌ Cancelado",
      pagado: "💸 Pagado",
      enviado: "📦 Enviado",
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  // ...rest of component (render, etc.)
  return null;
}

