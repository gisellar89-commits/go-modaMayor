"use client";
import React from "react";
import Link from "next/link";

export default function SeasonHighlight() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="relative rounded-lg overflow-hidden bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('/season-banner.jpg')` }}>
        <div className="p-8 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold">Nueva temporada</h2>
          <p className="mt-2 text-lg md:text-xl">Descubrí las novedades de la temporada: estilos, talles y colores pensados para tu negocio.</p>
          <div className="mt-6">
            <Link href="/productos" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-medium">Ver colección</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
