"use client";
import React from "react";

type Props = {
  totalOrders: number;
  totalRevenue: number;
  pending: number;
  completed: number;
};

export default function SalesStats({ totalOrders, totalRevenue, pending, completed }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Pedidos</div>
        <div className="text-2xl font-bold">{totalOrders}</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Ingresos</div>
        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Pendientes</div>
        <div className="text-2xl font-bold">{pending}</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Completados</div>
        <div className="text-2xl font-bold">{completed}</div>
      </div>
    </div>
  );
}
