"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoVendedorPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendedor");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
  const token = localStorage.getItem("token") ?? undefined;
      const res = await fetch("http://localhost:8080/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear usuario");
      }
      setSuccess("Usuario creado correctamente");
      setTimeout(() => router.push("/admin/vendedores"), 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo vendedor/encargado</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="border px-2 py-1 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border px-2 py-1 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="border px-2 py-1 rounded"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="vendedor">Vendedor</option>
          <option value="encargado">Encargado</option>
        </select>
        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded font-semibold"
          disabled={loading}
        >{loading ? "Creando..." : "Crear usuario"}</button>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
    </main>
  );
}
