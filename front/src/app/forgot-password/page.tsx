"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo procesar la solicitud");
      }
  // redirect to login and show a confirmation message there
  router.push('/login?sent=1');
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recuperar contraseña</h1>
      <p className="mb-4 text-sm text-gray-600">Ingrese su email y recibirá instrucciones para restablecer la contraseña.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-2 py-1"
          required
        />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-3 py-1 rounded">{loading ? 'Enviando...' : 'Enviar instrucciones'}</button>
          <button type="button" onClick={() => router.push('/login')} className="px-3 py-1 border rounded">Volver</button>
        </div>
      </form>
      {error && <div className="text-red-500 mt-3">{error}</div>}
      {success && <div className="text-green-600 mt-3">{success}</div>}
    </main>
  );
}
