"use client";
import React from "react";

type Props = {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  colorCandidate?: string | undefined;
  variant?: "color" | "size";
};

export default function FilterCheckbox({ checked, onChange, label, count, colorCandidate, variant = "color" }: Props) {
  const swatch = variant === "color" && colorCandidate ? colorCandidate : undefined;

  // Render visible native checkbox (more intuitive). Keep swatch for colors and compact pills for sizes.
  return (
    <label className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${checked ? 'bg-gradient-to-r from-yellow-500 to-pink-500 text-white shadow-md' : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-checked={checked}
        className="h-4 w-4 rounded accent-pink-500 focus:ring-2 focus:ring-pink-400"
      />

      {swatch ? (
        <span
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: swatch }}
          aria-hidden
        />
      ) : variant === 'color' ? (
        <span className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0 shadow-sm" aria-hidden>
          {String(label).trim().charAt(0).toUpperCase()}
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-md bg-transparent text-sm text-inherit border border-transparent" aria-hidden />
      )}

      <span className="ml-1 truncate font-medium">{label}{typeof count === 'number' ? <span className={`ml-1 ${checked ? 'text-white/90' : 'text-gray-500'}`}> ({count})</span> : null}</span>
    </label>
  );
}
