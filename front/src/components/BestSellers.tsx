"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { API_BASE, fetchProductsPaged } from "../utils/api";

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default function BestSellers() {
  const [items, setItems] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/public/bestsellers?limit=12`);
        if (!res.ok) throw new Error("Error fetching bestsellers");
        const data = await res.json();
        const rows = Array.isArray(data.data) ? data.data : [];
        if (rows.length === 0) {
          // fallback: load popular products via paged products endpoint
          try {
            const r = await fetchProductsPaged({ limit: 12 });
            const its = r.items || [];
            const mapped = its.map((p: any, idx: number) => ({ product: p, rank: idx + 1 }));
            setItems(mapped);
          } catch (e) {
            console.error('fallback fetchProductsPaged failed', e);
            setItems([]);
          }
        } else {
          setItems(rows);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (items.length <= 4) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % Math.max(1, Math.ceil(items.length / 4)));
    }, 4500);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [items]);

  if (!items || items.length === 0) return null;

  const slides = chunkItems(items, 4);

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
  <h3 className="text-xl font-semibold">Más vendidos</h3>
  <Link href="/productos" className="text-sm text-gray-600">Ver todos</Link>
      </div>

      <div className="relative">
        {/* Add min-height to prevent overlapping with the next sections when slides are hidden */}
        <div className="overflow-hidden rounded-md min-h-96">
          <div className="w-full">
            {slides.map((slide, i) => (
              <div key={slide.map((p: any) => ((p.product ?? p)?.ID ?? (p.product ?? p)?.id)).filter(Boolean).join('-') || i} className={`transition-opacity duration-500 ${i === index ? 'opacity-100 relative' : 'hidden'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-2">
                  {slide.map((row: any) => {
                    const p = row.product ?? row;
                    const id = p?.ID ?? p?.id;
                    return (
                      <ProductCard
                        key={id}
                        id={id}
                        name={p?.name ?? p?.title ?? "Producto"}
                        wholesale_price={p?.wholesale_price ?? p?.price ?? 0}
                        image_url={p?.image_url ?? p?.image}
                        description={p?.description}
                        variants={p?.variants}
                        location_stocks={p?.location_stocks}
                        rank={row?.rank}
                        quantitySold={row?.quantity_sold}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button aria-label="Prev" onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full z-10">
              ‹
            </button>
            <button aria-label="Next" onClick={() => setIndex((i) => (i + 1) % slides.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full z-10">
              ›
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2 z-10">
              {slides.map((slide, i) => (
                <button key={slide.map((p: any) => ((p.product ?? p)?.ID ?? (p.product ?? p)?.id)).filter(Boolean).join('-') || i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i === index ? 'bg-gray-800' : 'bg-gray-400'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
