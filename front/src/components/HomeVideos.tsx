"use client";
import { useEffect, useState, useRef } from "react";
import { API_BASE } from "../utils/api";

type Video = { ID: number; title?: string; description?: string; video_url?: string; external_url?: string; thumbnail_url?: string; order: number; active: boolean };

export default function HomeVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [index, setIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_BASE.replace(/\/$/, '') + '/public/videos');
        if (!res.ok) {
          setLoadError(`Error ${res.status}`);
          return;
        }
        const data = await res.json();
        console.debug('[HomeVideos] fetched videos:', data);
        setVideos(data);
        setLoadError(null);
      } catch (e: any) {
        // Network error (backend down / CORS / offline)
        setLoadError(e?.message ?? 'network error');
        // Keep console.debug for debugging, but avoid noisy stack traces in prod
        console.debug('[HomeVideos] fetch failed:', e);
        setVideos([]);
      }
    })();
  }, []);

  const active = videos.filter(v => v.active).sort((a, b) => (a.order || 0) - (b.order || 0));

  useEffect(() => {
    if (active.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex(i => (i + 1) % active.length);
    }, 5000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [active]);

  function fullUrl(src?: string) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    const s = String(src);
    if (s.startsWith('/')) return API_BASE.replace(/\/$/, '') + s;
    return API_BASE.replace(/\/$/, '') + '/uploads/' + s;
  }

  if (!active || active.length === 0) return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <h3 className="text-xl font-semibold mb-4">Videos</h3>
      <div className="text-sm text-gray-500">{loadError ? `No se pueden cargar los videos: ${loadError}` : 'No se encontraron videos.'}</div>
    </section>
  );

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-lg">
        <div className="min-h-[500px] md:min-h-[700px] lg:min-h-[800px] w-full relative">
          {active.map((v, i) => (
            <div key={v.ID} className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-full h-full flex items-center justify-center p-4">
                <div
                  className="mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-xl border border-gray-200"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                  {v.external_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <ExternalVideoEmbed url={v.external_url} poster={fullUrl(v.thumbnail_url)} />
                    </div>
                  ) : (
                    // For vertical videos prefer filling the wrapper height so they appear larger
                    <video 
                      controls 
                      poster={fullUrl(v.thumbnail_url)} 
                      src={fullUrl(v.video_url)} 
                      className="mx-auto max-h-[480px] md:max-h-[680px] lg:max-h-[760px] w-auto rounded-lg shadow-lg"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        {active.length > 1 && (
          <>
            <button aria-label="Prev" onClick={() => setIndex((i) => (i - 1 + active.length) % active.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all text-xl font-bold">‹</button>
            <button aria-label="Next" onClick={() => setIndex((i) => (i + 1) % active.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all text-xl font-bold">›</button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2">
              {active.map((v, i) => (
                <button key={v.ID ?? v.order ?? i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full transition-all ${i === index ? 'bg-pink-500 scale-110' : 'bg-white/70 hover:bg-white'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExternalVideoEmbed({ url, poster }: { url?: string; poster?: string }) {
  if (!url) return null;
  // detect youtube, vimeo, instagram
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const idMatch = url.match(/(v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    const id = idMatch ? idMatch[2] : null;
    if (!id) return <a href={url} className="block p-4">Abrir en YouTube</a>;
  const embed = `https://www.youtube.com/embed/${id}`;
  return <iframe src={embed} className="block" style={{ width: 'auto', height: '100%' }} frameBorder={0} allowFullScreen />;
  }
  if (url.includes('vimeo.com')) {
    const idMatch = url.match(/vimeo\.com\/(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return <a href={url} className="block p-4">Abrir en Vimeo</a>;
  const embed = `https://player.vimeo.com/video/${id}`;
  return <iframe src={embed} className="block" style={{ width: 'auto', height: '100%' }} frameBorder={0} allowFullScreen />;
  }
  if (url.includes('instagram.com')) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={{ margin: 0 }}>
          <a href={url}>Instagram post</a>
        </blockquote>
        <InstagramEmbedLoader />
      </div>
    );
  }
  return <a href={url} className="block p-4">Abrir</a>;
}

function InstagramEmbedLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).instgrm) return;
    const s = document.createElement('script');
    s.async = true;
    s.defer = true;
    s.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(s);
  }, []);
  return null;
}
