"use client";
import { useEffect, useState } from "react";

export interface AppNotification {
  ID?: number;
  id?: number;
  message: string;
  read?: boolean;
  CreatedAt?: string;
  created_at?: string;
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  async function fetchNotifications() {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    // If not logged in, don't call the protected endpoint
    if (!token) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // don't spam console on auth errors; just clear notifications
        setNotifications([]);
        return;
      }
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      // network or parse error - keep silent in console to avoid noisy logs
      console.debug("fetchNotifications failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications().catch(() => {});
    // poll every 30s
    const iv = setInterval(() => fetchNotifications().catch(() => {}), 30000);
    return () => clearInterval(iv);
  }, []);

  async function markAsRead(id?: number) {
    if (!id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    // optimistic update
    setNotifications((prev) => prev.map((n) => (getId(n) === id ? { ...n, read: true } : n)));
    if (!token) return;
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // ignore server error
      console.debug("markAsRead failed", e);
    }
  }

  function getId(n: AppNotification) {
    // support both ID and id
    return (n.ID as any) || (n.id as any);
  }

  return {
    notifications,
    loading,
    refresh: fetchNotifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    getId,
  } as const;
}
