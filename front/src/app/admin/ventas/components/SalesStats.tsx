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
        <div className="text-sm text-gray-500">Total Órdenes</div>
        <div className="text-2xl font-bold">{totalOrders}</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Ventas Finalizadas</div>
        <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
        <div className="text-xs text-gray-500 mt-1">Solo órdenes completadas</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">En Proceso</div>
        <div className="text-2xl font-bold text-yellow-600">{pending}</div>
      </div>
      <div className="p-4 bg-white border rounded shadow-sm">
        <div className="text-sm text-gray-500">Finalizadas</div>
        <div className="text-2xl font-bold text-green-600">{completed}</div>
      </div>
    </div>
  );
}
