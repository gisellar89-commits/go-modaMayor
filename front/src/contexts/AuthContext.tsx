"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Token inválido o expirado
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching /me', err);
      setUser(null);
      setLoading(false);
    }
  }

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth:logout'));
  };

  const refreshUser = async () => {
    await loadProfile();
  };

  useEffect(() => {
    let mounted = true;

    // initial load
    if (mounted) {
      loadProfile();
    }

    // handle cross-window storage events (other tabs)
    const onStorage = (ev: StorageEvent) => {
      if (mounted && (ev.key === 'token' || ev.key === 'user')) {
        loadProfile();
      }
    };

    // handle same-window custom events dispatched after login/logout
    const onAuthChanged = () => {
      if (!mounted) return;
      // prefer localStorage.user if available to avoid extra request
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (_) {}
      // fallback: refetch /me
      loadProfile();
    };

    const onLogout = () => {
      if (!mounted) return;
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:changed', onAuthChanged);
    window.addEventListener('auth:logout', onLogout);

    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:changed', onAuthChanged);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
