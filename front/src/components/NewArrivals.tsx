"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { fetchProductsPaged } from "../utils/api";

type AnyItem = any;

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default function NewArrivals() {
  const [items, setItems] = useState<AnyItem[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchProductsPaged({ limit: 12 });
        setItems(res.items || []);
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

  const slides = chunkItems(items, 4); // 4 items per slide on desktop

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
  <h3 className="text-xl font-semibold">Nuevos ingresos</h3>
  <Link href="/productos" className="text-sm text-gray-600">Ver todos</Link>
      </div>

      <div className="relative">
        {/* Add a min-height so the section keeps its vertical space and avoids overlapping following sections */}
        <div className="overflow-hidden rounded-md min-h-96">
          <div className="w-full">
            {slides.map((slide, i) => (
              // Use hidden/block instead of absolute positioning to prevent slides from overlapping other sections
              <div key={slide.map((p: any) => (p.ID ?? p.id)).filter(Boolean).join('-') || i} className={`transition-opacity duration-500 ${i === index ? 'opacity-100 relative' : 'hidden'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-2">
                  {slide.map((p: any) => (
                    <ProductCard key={p.ID ?? p.id} id={p.ID ?? p.id} name={p.name ?? p.title ?? 'Producto'} wholesale_price={p.wholesale_price ?? p.price ?? 0} image_url={p.image_url ?? p.image} description={p.description} variants={p.variants} location_stocks={p.location_stocks} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
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
                <button key={slide.map((p: any) => (p.ID ?? p.id)).filter(Boolean).join('-') || i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i === index ? 'bg-gray-800' : 'bg-gray-400'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
