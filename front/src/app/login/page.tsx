"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { API_BASE } from "../../utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const isSent = p.get("sent") === "1";
      setSent(isSent);
      if (isSent) {
        setShowToast(true);
        // remove the 'sent' param so the toast doesn't reappear on reload
        p.delete("sent");
        const newSearch = p.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        try {
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          // ignore if history.replaceState is unavailable
        }
        // hide after 6 seconds
        const t = setTimeout(() => setShowToast(false), 6000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      // store user if backend returns it so UI can read role without reload
      let profile = data.user;
      if (profile) {
        localStorage.setItem('user', JSON.stringify(profile));
      } else {
        // If login response didn't include the user, call /me to get profile
        try {
          const meRes = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${data.token}` } });
          if (meRes.ok) {
            profile = await meRes.json();
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch (_err) {
          // ignore and fallback to default route
        }
      }

      // redirect based on role
      const role = profile && profile.role ? String(profile.role).toLowerCase() : '';
      let target = '/';
      if (role === 'admin' || role === 'encargado') target = '/admin';
      else if (role === 'vendedor' || role === 'vendedora') target = '/vendedora/carritos';
      else target = '/';

      // navigate to the role home
      try {
        // notify the AuthContext in this same window/tab that auth changed
        try {
          window.dispatchEvent(new Event('auth:changed'));
        } catch (_) {}

        router.push(target);
        return; // stop further execution; we already redirected
      } catch (err) {
        // fallback: set success message and let user refresh
        setSuccess("Login exitoso");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-center title-gradient">Iniciar sesión</h1>
        <p className="text-center text-gray-600 mb-8">Bienvenido a Moda x Mayor</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-themed w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-themed w-full"
              required
            />
          </div>
          
          <div className="text-sm text-right">
            <a href="/forgot-password" className="text-pink-600 hover:text-pink-700 font-medium transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
          <button type="submit" className="btn-primary w-full text-lg py-3">
            Ingresar
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          ¿No tenés cuenta aún? <a href="/registro" className="text-pink-600 hover:text-pink-700 font-semibold transition-colors">Crear cuenta</a>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
      </div>
      
      {sent && showToast && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ Revisá tu correo: te enviamos instrucciones para restablecer la contraseña.
        </div>
      )}
    </main>
  );
}
