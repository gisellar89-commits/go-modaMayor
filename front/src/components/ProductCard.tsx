"use client";

import React from "react";
import Link from "next/link";
import { resolveImageUrl } from "../utils/api";

type ProductCardProps = {
  id: number;
  name: string;
  wholesale_price: number;
  image_url?: string;
  description?: string;
  variants?: any[];
  location_stocks?: any[];
  discount_type?: string;
  discount_value?: number;
  // optional extras for bestsellers display
  rank?: number;
  quantitySold?: number;
};

export default function ProductCard({ id, name, wholesale_price, image_url, description, variants, location_stocks, discount_type, discount_value, rank, quantitySold }: ProductCardProps) {
  const tieneVariantes = Array.isArray(variants) && variants.length > 0;
  // obtener colores únicos de variantes
  const variantColors: string[] = [];
  if (Array.isArray(variants)) {
    for (const v of variants) {
      const col = v?.color;
      if (!col) continue;
      const s = String(col).trim();
      if (!s) continue;
      if (!variantColors.includes(s)) variantColors.push(s);
    }
  }

  // comprobar si un string es un color CSS válido (usa DOM - solo en cliente)
  const isValidCssColor = (value: string) => {
    if (typeof document === "undefined") return false;
    try {
      const s = value?.trim();
      if (!s) return false;
      const el = document.createElement("div");
      el.style.backgroundColor = "";
      el.style.backgroundColor = s;
      // Si el navegador acepta el valor, el style.backgroundColor no estará vacío
      return !!el.style.backgroundColor;
    } catch {
      return false;
    }
  };

  // Mapeo sencillo de nombres comunes (español/inglés) a hex para mejorar detección
  const colorNameMap: Record<string, string> = {
    rojo: '#ff0000',
    rojooscuro: '#8b0000',
    azul: '#0000ff',
    negro: '#000000',
    blanco: '#ffffff',
    verde: '#008000',
    amarillo: '#ffff00',
    gris: '#808080',
    marron: '#8b4513',
    naranja: '#ff7f00',
    rosa: '#ff69b4',
    violeta: '#8a2be2',
    beige: '#f5f5dc',
    "azul marino": '#000080',
    "gris claro": '#d3d3d3',
  };

  // Estado para los colores procesados (con mapeo y validez)
  const [processedColors, setProcessedColors] = React.useState<Array<{ original: string; css?: string; valid: boolean }>>([]);
  // Heurística: mapear por palabras clave y aplicar modificadores ('oscuro', 'claro', 'marino')
  const colorHeuristic = (orig: string): string | undefined => {
    if (!orig) return undefined;
    const s = String(orig).toLowerCase();
    // palabras base
    const bases: Record<string, string> = {
      rojo: '#ff0000',
      azul: '#0000ff',
      verde: '#008000',
      negro: '#000000',
      blanco: '#ffffff',
      gris: '#808080',
      marron: '#8b4513',
      naranja: '#ff7f00',
      rosa: '#ff69b4',
      violeta: '#8a2be2',
      beige: '#f5f5dc',
      amarillo: '#ffff00',
    };

    let foundBase: string | undefined;
    for (const k of Object.keys(bases)) {
      if (s.includes(k)) {
        foundBase = bases[k];
        break;
      }
    }
    if (!foundBase) return undefined;

    // modificadores
    const isOscuro = /oscuro|dark|darker/.test(s);
    const isClaro = /claro|light/.test(s);
    const isMarino = /marino|navy/.test(s);
    if (isMarino && foundBase === bases['azul']) {
      foundBase = '#000080';
    }

    const adjustHex = (hex: string, percent: number) => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
      const factor = (100 + percent) / 100;
      const nr = clamp(r * factor);
      const ng = clamp(g * factor);
      const nb = clamp(b * factor);
      const toHex = (v: number) => v.toString(16).padStart(2, '0');
      return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
    };

    if (isOscuro) return adjustHex(foundBase, -25);
    if (isClaro) return adjustHex(foundBase, 20);
    return foundBase;
  };

  React.useEffect(() => {
    if (!Array.isArray(variantColors)) return;
    const out: Array<{ original: string; css?: string; valid: boolean }> = [];
    const normalizeKey = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '');
    for (const orig of variantColors) {
      const key = normalizeKey(orig);
      // prioridad: mapeo exacto (colorNameMap) -> heurística por palabras -> original
      const exact = colorNameMap[key];
      const heuristic = colorHeuristic(orig);
      const candidate = exact ?? heuristic ?? orig;
      const valid = isValidCssColor(candidate);
      out.push({ original: orig, css: candidate, valid });
    }
    // eslint-disable-next-line no-console
    console.debug('ProductCard.processedColors', out);
    setProcessedColors(out);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantColors.join('|')]);
  // Calcular precio con descuento si el producto incluye campos de descuento (preferir props)
  // Algunos productos pueden venir con discount_type/discount_value en la API
  const discountType = discount_type ?? (variants && (variants as any).discount_type) ?? undefined;
  const discountValue = (typeof discount_value === 'number' ? discount_value : (variants && (variants as any).discount_value)) ?? undefined;
  let finalPrice = wholesale_price;
  if (discountType === 'percent' && typeof discountValue === 'number') {
    finalPrice = wholesale_price * (1 - discountValue / 100);
  } else if (discountType === 'fixed' && typeof discountValue === 'number') {
    finalPrice = wholesale_price - discountValue;
  }
  if (finalPrice < 0) finalPrice = 0;

  // calcular stock total: priorizar location_stocks a nivel de producto si vienen, sino sumar por variante
  let totalStock = 0;
  if (Array.isArray(location_stocks) && location_stocks.length > 0) {
    for (const ls of location_stocks) {
      const q = ls?.quantity ?? ls?.qty ?? ls?.stock ?? ls?.available ?? 0;
      totalStock += Number(q || 0);
    }
  } else if (Array.isArray(variants)) {
    for (const v of variants) {
      let variantStock = 0;
      if (Array.isArray(v?.location_stocks)) {
        for (const ls of v.location_stocks) {
          const q = ls?.quantity ?? ls?.qty ?? ls?.stock ?? ls?.available ?? 0;
          variantStock += Number(q || 0);
        }
      } else {
        const q = v?.stock ?? v?.quantity ?? v?.available ?? 0;
        variantStock += Number(q || 0);
      }
      totalStock += variantStock;
    }
  }
  const noStock = totalStock <= 0;
  return (
    <div className="card-hover rounded-xl p-4 flex flex-col items-center bg-white relative group">
      {/* Rank badge (corner, gradient) */}
      {typeof rank === 'number' && (
        <div className="absolute -left-3 -top-3 z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-yellow-400 text-white flex flex-col items-center justify-center font-bold shadow-lg border-2 border-white">
            <span className="text-[10px] uppercase tracking-wider">Top</span>
            <span className="text-sm">#{rank}</span>
          </div>
        </div>
      )}
      {/* Discount badge top-left */}
      {discountType === 'percent' && typeof discountValue === 'number' && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white flex flex-col items-center justify-center text-center font-bold shadow-lg">
            <span className="text-xs leading-none">{Math.round(discountValue)}%</span>
            <span className="text-[10px] leading-none">OFF</span>
          </div>
        </div>
      )}
      {discountType === 'fixed' && typeof discountValue === 'number' && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white flex flex-col items-center justify-center text-center font-bold shadow-lg">
            <span className="text-[11px] leading-none">-${Math.round(discountValue)}</span>
            <span className="text-[9px] leading-none">OFF</span>
          </div>
        </div>
      )}
      {noStock && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-full shadow-sm">Sin stock</span>
        </div>
      )}
      {/* Swatches moved below image and above the detail button */}
      <div className="w-40 h-40 flex items-center justify-center mb-2 bg-gray-100 rounded">
        {image_url ? (
          <img src={resolveImageUrl(image_url) as string} alt={name} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-gray-400">Sin imagen</span>
        )}
      </div>
      <div className="font-semibold text-center mb-2 text-lg line-clamp-2 group-hover:text-pink-600 transition-colors">{name}</div>
      <div className="text-xl font-bold mb-3">
        {finalPrice !== wholesale_price ? (
          <>
            <span className="text-sm line-through text-gray-400 mr-2">${wholesale_price}</span>
            <span className="bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">${finalPrice.toFixed(2)}</span>
          </>
        ) : (
          <span className="bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">${wholesale_price}</span>
        )}
      </div>
      {description && <div className="text-sm text-gray-500 mb-3 line-clamp-2 text-center">{description}</div>}
      {/* show quantity sold when available (small pill) */}
      {typeof quantitySold === 'number' && (
        <div className="mb-3">
          <span className="inline-block text-xs bg-gradient-to-r from-yellow-50 to-pink-50 text-pink-600 px-3 py-1 rounded-full border border-pink-200 font-medium">
            🔥 Vendidos: {quantitySold}
          </span>
        </div>
      )}
      {/* Mostrar cantidad de colores disponibles (swatches en filtros) */}
      {tieneVariantes && (
        <div className="w-full flex items-center justify-center mb-3">
          <div className="inline-flex items-center px-3 py-1 border rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-xs font-medium text-gray-700 gap-1">
              <span className="md:hidden">{variantColors.length}</span>
              <span className="hidden md:inline">{variantColors.length} colores</span>
            </div>
        </div>
      )}

      <Link href={`/productos/${id}`} className="w-full mt-auto">
        <button className="btn-primary w-full">Ver detalle</button>
      </Link>
    </div>
  );
}
