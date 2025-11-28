"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../utils/api";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo registrar");
      }
      const data = await res.json().catch(() => ({}));
      // If API returned token (auto-login), store it
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // fallback: try to login
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.token) localStorage.setItem('token', loginData.token);
          if (loginData.user) localStorage.setItem('user', JSON.stringify(loginData.user));
        }
      }
  // notify other parts of the app that auth changed (same-tab)
  try { window.dispatchEvent(new Event('auth:changed')); } catch (_) {}
  // redirect to home or carrito
  router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-center title-gradient">Crear cuenta</h1>
        <p className="text-center text-gray-600 mb-8">Únete a Moda x Mayor</p>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="input-themed w-full" 
              placeholder="Tu nombre"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="input-themed w-full" 
              placeholder="tu@email.com"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono/WhatsApp</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="input-themed w-full" 
              placeholder="+54 9 11 1234-5678"
              required 
            />
            <p className="mt-1 text-xs text-gray-500">Para que nuestra vendedora pueda contactarte</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="input-themed w-full" 
              placeholder="Mínimo 6 caracteres"
              minLength={6} 
              required 
            />
            <p className="mt-1 text-xs text-gray-500">Debe tener al menos 6 caracteres</p>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full text-lg py-3" 
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta? <a href="/login" className="text-pink-600 hover:text-pink-700 font-semibold transition-colors">Iniciar sesión</a>
        </div>
      </div>
    </main>
  );
}
