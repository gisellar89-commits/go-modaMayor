"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../utils/api";
import AddressSetup from "../../components/AddressSetup";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showAddressSetup, setShowAddressSetup] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Validar teléfono en tiempo real
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    // Limpiar el teléfono para validar
    const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '').replace(/^54/, '');
    
    if (value && cleanPhone.length > 0) {
      if (!/^\d+$/.test(cleanPhone)) {
        setPhoneError('El teléfono solo debe contener números');
      } else if (cleanPhone.length < 10) {
        setPhoneError('El teléfono debe tener al menos 10 dígitos');
      } else if (cleanPhone.length > 11) {
        setPhoneError('El teléfono no debe tener más de 11 dígitos');
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación final de teléfono antes de enviar
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '').replace(/^54/, '');
    if (!/^\d{10,11}$/.test(cleanPhone)) {
      setError('Por favor ingresa un número de teléfono válido (10-11 dígitos)');
      return;
    }
    
    // No enviar si hay errores de validación
    if (phoneError) {
      setError('Por favor corrige los errores antes de continuar');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Enviando registro:', { name, email, phone, password: '***' });
    
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      
      console.log('Respuesta registro:', res.status);
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Error en registro:', data);
        throw new Error(data.error || "No se pudo registrar");
      }
      const data = await res.json().catch(() => ({}));
      console.log('Registro exitoso:', data);
      console.log('data.user:', data.user);
      console.log('data.user.id:', data.user?.id);
      console.log('data.user.ID:', data.user?.ID);
      
      // If API returned token (auto-login), store it
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          // El backend devuelve ID en mayúscula, pero JSON lo serializa como minúscula
          const userId = data.user.id || data.user.ID;
          console.log('userId extraído:', userId);
          setRegisteredUserId(userId);
        }
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
          if (loginData.user) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
            setRegisteredUserId(loginData.user.id);
          }
        }
      }
      
      // notify other parts of the app that auth changed (same-tab)
      try { window.dispatchEvent(new Event('auth:changed')); } catch (_) {}
      
      // Show success notification
      setSuccessMessage('¡Registro exitoso! Ahora puedes configurar tu dirección.');
      
      console.log('Estado antes de mostrar AddressSetup:', { 
        showAddressSetup, 
        registeredUserId,
        userId: data.user?.id 
      });
      
      // Show address setup screen instead of redirecting directly
      setShowAddressSetup(true);
      
      console.log('setShowAddressSetup(true) llamado');
    } catch (err: any) {
      console.error('Error capturado:', err);
      setError(err?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // If showing address setup, render that component
  if (showAddressSetup && registeredUserId) {
    return (
      <AddressSetup
        userId={registeredUserId}
        onSkip={() => router.push('/')}
        onComplete={() => router.push('/')}
      />
    );
  }

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
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            ✓ {successMessage}
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
              className="input-themed w-full text-gray-900 placeholder:text-gray-400" 
              placeholder="tu@ejemplo.com"
              required 
            />
            <p className="mt-1 text-xs text-gray-500">Debe ser un email válido (ej: usuario@dominio.com)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono/WhatsApp</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => handlePhoneChange(e.target.value)} 
              className={`input-themed w-full text-gray-900 placeholder:text-gray-400 ${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="1145678901 o 3515678901"
              required 
            />
            {phoneError ? (
              <p className="mt-1 text-xs text-red-600">{phoneError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                10-11 dígitos sin espacios. Ej: 1145678901 (Buenos Aires) o 3515678901 (Córdoba)
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="input-themed w-full text-gray-900 placeholder:text-gray-400 pr-10" 
                placeholder="Mínimo 6 caracteres"
                minLength={6} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Debe tener al menos 6 caracteres</p>
          </div>
          
          <button 
            type="submit" 
            className={`w-full text-lg py-3 transition-all ${
              loading || phoneError 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'btn-primary'
            }`}
            disabled={loading || !!phoneError}
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
