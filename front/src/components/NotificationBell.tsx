"use client";
import { useState, useRef, useEffect } from "react";
import useNotifications from "../hooks/useNotifications";
import NotificationsDropdown from "./NotificationsDropdown";

export default function NotificationBell() {
  // track token presence in state to keep hooks order stable
  const [hasToken, setHasToken] = useState<boolean>(false);
  useEffect(() => {
    const cur = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
    setHasToken(cur);
    function onStorage() {
      setHasToken(!!localStorage.getItem('token'));
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  const { notifications, unreadCount, refresh, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!hasToken) return null;

  return (
    <div className="relative" ref={ref}>
      <button aria-haspopup="true" aria-expanded={open} onClick={() => { setOpen((s) => !s); if (!open) refresh(); }} className="p-1 rounded-full hover:bg-yellow-500/20 relative text-yellow-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-gray-900 bg-orange-500 rounded-full border border-orange-600">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{ position: 'fixed', top: '80px', right: '8px', zIndex: 50 }}>
          <NotificationsDropdown notifications={notifications} onMarkAsRead={(id) => { markAsRead(id); }} />
        </div>
      )}
    </div>
  );
}
