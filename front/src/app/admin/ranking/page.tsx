"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function RankingVentasPage() {
  const [ranking, setRanking] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/reports/sales-ranking", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("No se pudo obtener el ranking");
        return res.json();
      })
      .then(setRanking)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando ranking...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ranking de Ventas</h1>
        </div>
        <p className="text-gray-600">Mejores vendedores del mes actual</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : !ranking || ranking.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ventas registradas</h3>
          <p className="text-gray-500">No hay datos de ventas para este mes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Top 3 Destacado */}
          {ranking.length >= 3 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 3 Vendedores</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ranking.slice(0, 3).map((seller, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const bgColors = ['bg-yellow-100 border-yellow-300', 'bg-gray-100 border-gray-300', 'bg-orange-100 border-orange-300'];
                  return (
                    <div key={seller.UserID} className={`${bgColors[idx]} border-2 rounded-lg p-4 text-center`}>
                      <div className="text-4xl mb-2">{medals[idx]}</div>
                      <div className="font-bold text-gray-900 text-lg">{seller.Name}</div>
                      <div className="text-sm text-gray-600 mb-2">{seller.Role}</div>
                      <div className="text-2xl font-bold text-gray-900">{seller.Ventas}</div>
                      <div className="text-xs text-gray-500">ventas</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla Completa */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Posición</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vendedor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Rol</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Total Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.map((seller, idx) => {
                  const isTop3 = idx < 3;
                  const position = idx + 1;
                  return (
                    <tr key={seller.UserID} className={`hover:bg-gray-50 ${isTop3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isTop3 ? 'text-yellow-600 text-lg' : 'text-gray-600'}`}>
                            #{position}
                          </span>
                          {position === 1 && <span className="text-xl">👑</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{seller.Name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">{seller.Email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {seller.Role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className={`font-bold ${isTop3 ? 'text-xl text-yellow-600' : 'text-lg text-gray-900'}`}>
                          {seller.Ventas}
                        </div>
                        <div className="text-xs text-gray-500">ventas</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer con estadísticas */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Total de vendedores activos: <span className="font-semibold text-gray-900">{ranking.length}</span>
              </div>
              <div>
                Total de ventas: <span className="font-semibold text-gray-900">
                  {ranking.reduce((sum, s) => sum + (s.Ventas || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
