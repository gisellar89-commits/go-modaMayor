import { API_BASE } from "./api";

export async function fetchSellerCarts(token?: string) {
  const tk = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined);
  const headers: Record<string, string> = {};
  if (tk) headers["Authorization"] = `Bearer ${tk}`;
  const res = await fetch(`${API_BASE}/cart/seller`, { headers });
  if (!res.ok) throw new Error("Error al obtener carritos de vendedora");
  return await res.json();
}
