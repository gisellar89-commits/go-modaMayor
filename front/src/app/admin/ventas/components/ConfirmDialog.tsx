"use client";
import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title = "Confirmar", message = "¿Estás seguro?", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-80">
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 border rounded">Cancelar</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
