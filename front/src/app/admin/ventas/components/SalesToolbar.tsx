"use client";
import React from "react";

type Props = {
  q: string;
  status: string;
  onChangeQ: (v: string) => void;
  onChangeStatus: (v: string) => void;
  onClear: () => void;
  onExport?: () => void;
};

export default function SalesToolbar({ q, status, onChangeQ, onChangeStatus, onClear, onExport }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <input value={q} onChange={e => onChangeQ(e.target.value)} placeholder="Buscar por ID o cliente" className="border px-2 py-1 rounded w-64" />
      <select value={status} onChange={e => onChangeStatus(e.target.value)} className="border px-2 py-1 rounded">
        <option value="">Todos los estados</option>
        <option value="creada">creada</option>
        <option value="procesando">procesando</option>
        <option value="enviada">enviada</option>
        <option value="finalizada">finalizada</option>
        <option value="cancelada">cancelada</option>
      </select>
      <button onClick={onClear} className="ml-2 px-3 py-1 bg-gray-100 rounded">Limpiar</button>
      <div className="ml-auto">
        <button onClick={onExport} className="px-3 py-1 bg-blue-600 text-white rounded">Exportar</button>
      </div>
    </div>
  );
}
