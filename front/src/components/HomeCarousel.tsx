"use client"
import { useEffect, useState, useRef } from "react";

type Banner = {
  ID: number;
  image_url: string;
  alt_text?: string;
  link?: string;
}

export default function HomeCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/public/banners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBanners(data as Banner[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  function fullUrl(src?: string) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return base + src;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-4">
      <div className="relative overflow-hidden rounded-md">
        <div className="h-56 sm:h-80 md:h-96 w-full bg-gray-100">
          {banners.map((b, i) => (
            <a key={b.ID} href={b.link || '#'} className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
              <img src={fullUrl(b.image_url)} alt={b.alt_text || 'Banner'} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>

        {/* Arrows */}
        {banners.length > 1 && (
          <>
            <button aria-label="Prev" onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full">
              ‹
            </button>
            <button aria-label="Next" onClick={() => setIndex((i) => (i + 1) % banners.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full">
              ›
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2">
              {banners.map((b, i) => (
                <button key={b.ID ?? i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
