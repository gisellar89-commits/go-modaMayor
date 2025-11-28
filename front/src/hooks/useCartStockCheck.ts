import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../utils/api";

interface StockIssue {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_name: string;
  requested_qty: number;
  available_stock: number;
  issue_type: "out_of_stock" | "insufficient_stock" | "limited_stock";
  suggested_action: string;
  image_url: string;
}

interface StockCheckResult {
  items_with_issues: StockIssue[];
  all_available: boolean;
  total_items: number;
  issues_count: number;
}

export default function useCartStockCheck() {
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [allAvailable, setAllAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStock = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setStockIssues([]);
        setAllAvailable(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/cart/check-stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setStockIssues([]);
          setAllAvailable(true);
          setLoading(false);
          return;
        }
        throw new Error("Error al verificar stock");
      }

      const data: StockCheckResult = await res.json();
      setStockIssues(data.items_with_issues || []);
      setAllAvailable(data.all_available);
    } catch (err) {
      console.error("Error al verificar stock:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStock();
  }, [checkStock]);

  return {
    stockIssues,
    allAvailable,
    loading,
    error,
    recheckStock: checkStock,
  };
}
