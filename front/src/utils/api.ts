// Frontend API utilities - single clean implementation
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) ?? "http://localhost:8080";

export type Subcategory = {
  ID?: number;
  id?: number;
  name: string;
  category_id?: number;
};

export type Category = {
  ID?: number;
  id?: number;
  name: string;
  description?: string;
};

export type LocationStock = {
  ID?: number;
  id?: number;
  product_id?: number;
  variant_id?: number;
  location?: string;
  stock?: number;
};

export type Product = any;
type RawProduct = any;

function normalizeSubcategory(sub: any): Subcategory | null {
  if (sub === null || sub === undefined) return null;
  if (typeof sub === "object") return sub as Subcategory;
  return { id: undefined, name: String(sub) };
}

function normalizeProduct(p: RawProduct) {
  // Normalize common variant/property names so frontend components can rely on consistent shape
  const product = { ...p } as any;
  product.subcategory = normalizeSubcategory(p.subcategory ?? p.subcategory_id ?? null) as Subcategory | null;
  product.category = p.category ?? null;

  // normalize main image fields
  product.image_url = p.image_url ?? p.ImageURL ?? p.image ?? p.imageUrl ?? p.ImageUrl ?? p.image_url;

  // normalize images array
  if (!Array.isArray(product.images)) {
    if (Array.isArray(p.Images)) product.images = p.Images;
    else if (Array.isArray(p.images)) product.images = p.images;
    else product.images = [];
  }

  // normalize variants: ensure each variant has color, size, image_url, id/ID
  if (Array.isArray(p.variants)) {
    product.variants = p.variants.map((v: any) => {
      const variant: any = { ...v };
      variant.color = v.color ?? v.Color ?? v.color_name ?? v.ColorName ?? v.colorName ?? v.color_name;
      variant.size = v.size ?? v.Size ?? v.size_name ?? v.SizeName ?? v.sizeName ?? v.name ?? v.talle ?? v.Talle;
      variant.image_url = v.image_url ?? v.ImageURL ?? v.image ?? v.Image ?? v.imageUrl ?? v.ImageUrl;
      variant.ID = v.ID ?? v.id;
      variant.id = v.id ?? v.ID;
      return variant;
    });
  } else {
    product.variants = [];
  }

  return product as Product;
}

export type OrderItem = {
  ID?: number;
  id?: number;
  product_id?: number;
  product?: Product | null;
  quantity?: number;
  price?: number;
};

export type Order = {
  ID?: number;
  id?: number;
  user_id?: number;
  User?: { ID?: number; id?: number; name?: string; email?: string } | null;
  status?: string;
  total?: number;
  items?: OrderItem[];
  created_at?: string;
};

function normalizeOrder(o: any): Order {
  return {
    ID: o.ID ?? o.id,
    id: o.ID ?? o.id,
    user_id: o.UserID ?? o.user_id ?? o.user?.ID ?? o.user?.id,
    User: o.User ?? o.user ?? null,
    status: o.Status ?? o.status,
    total: o.Total ?? o.total ?? 0,
    items: Array.isArray(o.Items ?? o.items)
      ? (o.Items ?? o.items).map((it: any) => ({
          ID: it.ID ?? it.id,
          id: it.ID ?? it.id,
          product_id: it.ProductID ?? it.product_id ?? it.product?.ID ?? it.product?.id,
          product: it.Product ?? it.product ?? null,
          quantity: it.Quantity ?? it.quantity,
          price: it.Price ?? it.price,
        }))
      : [],
    created_at: o.CreatedAt ?? o.created_at ?? o.createdAt ?? null,
  } as Order;
}

export async function fetchProducts(token?: string): Promise<Product[]> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/products`, { headers });
  if (!res.ok) throw new Error("Error al obtener productos");
  const data = await res.json();
  // API puede devolver un array directamente o un objeto paginado { items, total }
  if (Array.isArray(data)) {
    return data.map(normalizeProduct) as Product[];
  }
  if (data && Array.isArray(data.items)) {
    return data.items.map(normalizeProduct) as Product[];
  }
  return [];
}

async function parseResponseError(res: Response) {
  try {
    const body = await res.json();
    if (body && (body.message || body.error)) return String(body.message ?? body.error);
  } catch (_) {
    try {
      const text = await res.text();
      if (text) return text;
    } catch (_) {}
  }
  return res.statusText || `HTTP ${res.status}`;
}

export type PagedProducts = { items: Product[]; total?: number };

export async function fetchProductsPaged(options?: { search?: string; page?: number; limit?: number; token?: string; category?: number; subcategory?: number }): Promise<PagedProducts> {
  const { search = "", page = 1, limit = 25, token, category, subcategory } = options ?? {};
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Try server-side paged endpoint first
  const url = new URL(`${API_BASE}/products`);
  if (search) url.searchParams.set("search", search);
  if (category !== undefined && category !== null) url.searchParams.set("category", String(category));
  if (subcategory !== undefined && subcategory !== null) url.searchParams.set("subcategory", String(subcategory));
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error("Error al obtener productos");
    const data = await res.json();
    // Expecting either an array or an object { items, total }
    if (Array.isArray(data)) {
      return { items: data.map(normalizeProduct), total: undefined };
    }
    if (data && Array.isArray(data.items)) {
      return { items: data.items.map(normalizeProduct), total: data.total };
    }
    // Fallback: try fetchProducts
    const items = await fetchProducts(token);
    return { items, total: items.length };
  } catch (err) {
    // Fallback to full fetch
    const items = await fetchProducts(token);
    return { items, total: items.length };
  }
}

export async function fetchCategories(token?: string): Promise<Category[]> {
  const headers: Record<string, string> = {};
  // Use public endpoint for categories so frontend can load them without requiring admin role
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/public/categories`, { headers });
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function fetchProductById(id: string | number | undefined, token?: string): Promise<Product> {
  if (id === undefined || id === null) throw new Error("ID de producto inválido");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/products/${id}`, { headers });
  if (!res.ok) throw new Error("Error al obtener el producto");
  const data = await res.json();
  return normalizeProduct(data);
}

/**
 * Resolve an image URL coming from the API into an absolute URL the browser can load.
 * - if url is already absolute (http/https) return as-is
 * - if url starts with '/' prefix with API_BASE
 * - otherwise assume it's a filename stored under /uploads on the API server
 */
export function resolveImageUrl(url: any) {
  if (!url) return url;
  const s = String(url);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return API_BASE.replace(/\/$/, '') + s;
  return API_BASE.replace(/\/$/, '') + '/uploads/' + s;
}

export async function fetchOrders(token?: string): Promise<Order[]> {
  const headers: Record<string, string> = {};
  // Allow callers to omit token; try localStorage on the client if not provided
  const tk = token ?? (typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined);
  if (tk) headers["Authorization"] = `Bearer ${tk}`;
  const res = await fetch(`${API_BASE}/orders`, { headers });
  if (!res.ok) {
    const msg = await parseResponseError(res);
    if (tk && (res.status === 401 || res.status === 403)) {
      throw new Error(`AUTH_ERROR:${res.status}:${msg}`);
    }
    throw new Error(msg || "Error al obtener pedidos");
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeOrder) as Order[];
}

// Fetch orders for the currently authenticated user.
export async function fetchMyOrders(): Promise<Order[]> {
  // Read token from localStorage
  const tk = typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined;
  if (!tk) throw new Error("No autenticado");
  // First fetch profile to get user id
  const profileRes = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${tk}` } });
  if (!profileRes.ok) {
    const msg = await parseResponseError(profileRes);
    if (profileRes.status === 401 || profileRes.status === 403) throw new Error(`AUTH_ERROR:${profileRes.status}:${msg}`);
    throw new Error(msg || "Error al obtener perfil");
  }
  const profile = await profileRes.json();
  const userId = profile.ID ?? profile.id;
  if (!userId) throw new Error("Perfil inválido");
  const res = await fetch(`${API_BASE}/orders/user/${userId}`, { headers: { Authorization: `Bearer ${tk}` } });
  if (!res.ok) {
    const msg = await parseResponseError(res);
    if (res.status === 401 || res.status === 403) throw new Error(`AUTH_ERROR:${res.status}:${msg}`);
    throw new Error(msg || "Error al obtener pedidos");
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeOrder) as Order[];
}

export async function updateOrderStatus(id: string | number, status: string, token?: string): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tk = token ?? (typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined);
  if (tk) headers["Authorization"] = `Bearer ${tk}`;
  const res = await fetch(`${API_BASE}/orders/${id}/status`, { method: "PUT", headers, body: JSON.stringify({ status }) });
  if (!res.ok) {
    const msg = await parseResponseError(res);
    if (tk && (res.status === 401 || res.status === 403)) {
      throw new Error(`AUTH_ERROR:${res.status}:${msg}`);
    }
    throw new Error(msg || "Error updating order status");
  }
  return true;
}
