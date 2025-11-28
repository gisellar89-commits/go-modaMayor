"use client";
import React from "react";
import OrderRow from "./OrderRow";
import { Order } from "../../../../utils/api";

type Props = {
  orders: Order[];
  loading: boolean;
  statuses: string[];
  onChangeStatus: (id: number | undefined, status: string) => void;
  onOpen?: (order: Order) => void;
  onRequestChangeStatus?: (id: number | undefined, status: string) => void;
  onAssign?: (id: number | undefined, sellerId: number) => void;
  sellers?: { id: number; name?: string; email?: string }[];
};

export default function SalesList({ orders, loading, statuses, onChangeStatus, onOpen, onRequestChangeStatus, onAssign, sellers }: Props) {
  if (loading) return <div>Cargando...</div>;
  if (orders.length === 0) return <div className="p-4 text-gray-500">No se encontraron ventas</div>;
  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-2 py-1 border">ID</th>
            <th className="px-2 py-1 border">Cliente</th>
            <th className="px-2 py-1 border">Estado</th>
            <th className="px-2 py-1 border">Total</th>
            <th className="px-2 py-1 border">Fecha</th>
            <th className="px-2 py-1 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => <OrderRow key={o.ID ?? o.id} order={o} statuses={statuses} onChangeStatus={onChangeStatus} onOpen={onOpen} onRequestChangeStatus={onRequestChangeStatus} onAssign={onAssign} sellers={sellers} />)}
        </tbody>
      </table>
    </div>
  );
}
