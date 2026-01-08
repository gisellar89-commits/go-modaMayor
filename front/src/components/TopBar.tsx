"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

type SocialLink = { platform: string; url: string };

function IconFor(platform: string) {
  const p = String(platform || '').toLowerCase();
  if (p.includes('instagram')) return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
          <stop offset="0%" style={{stopColor: '#FDF497', stopOpacity: 1}} />
          <stop offset="5%" style={{stopColor: '#FDF497', stopOpacity: 1}} />
          <stop offset="45%" style={{stopColor: '#FD5949', stopOpacity: 1}} />
          <stop offset="60%" style={{stopColor: '#D6249F', stopOpacity: 1}} />
          <stop offset="90%" style={{stopColor: '#285AEB', stopOpacity: 1}} />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-gradient)" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
    </svg>
  );
  if (p.includes('facebook')) return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path d="M15.5 12.3h-2.4v7.6h-3.1v-7.6H8.5V9.8h1.5V8.2c0-1.3.6-3.3 3.3-3.3l2.4.01v2.7h-1.8c-.3 0-.7.1-.7.8v1.4h2.5l-.3 2.5z" fill="white" />
    </svg>
  );
  if (p.includes('tiktok')) return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#000" />
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#EE1D52" />
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#69C9D0" opacity="0.5" />
    </svg>
  );
  if (p.includes('whatsapp')) return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366" />
    </svg>
  );
  // default link icon
  return (
    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function TopBar() {
  const [centerText, setCenterText] = useState<string>("");
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/settings/topbar`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setCenterText(data.center_text ?? "");
        const socials = Array.isArray(data.social_links) ? data.social_links : [];
        setLinks(socials.map((s: any) => ({ platform: s.platform ?? s.name ?? '', url: s.url ?? s.href ?? '' })));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!centerText && links.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 border-b-2 border-yellow-600/40 shadow-md overflow-hidden">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center justify-between text-xs sm:text-sm py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {links.slice(0, 3).map((l, i) => (
            <a key={l.url || l.platform || i} href={l.url} target="_blank" rel="noreferrer" className="transition-all hover:scale-110 inline-flex items-center gap-1 drop-shadow-sm">
              {IconFor(l.platform)}
            </a>
          ))}
          {/* En desktop mostrar más iconos */}
          <div className="hidden sm:flex items-center gap-3">
            {links.slice(3, 5).map((l, i) => (
              <a key={l.url || l.platform || i} href={l.url} target="_blank" rel="noreferrer" className="transition-all hover:scale-110 inline-flex items-center gap-1 drop-shadow-sm">
                {IconFor(l.platform)}
              </a>
            ))}
          </div>
        </div>
        <div className="text-center text-xs sm:text-sm font-bold flex-1 px-2 truncate">
          <span className="text-gray-800 drop-shadow-sm">
            {centerText}
          </span>
        </div>
        <div className="w-6 sm:w-12 flex-shrink-0" />
      </div>
    </div>
  );
}
