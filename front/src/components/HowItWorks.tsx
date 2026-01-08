"use client";
import React from "react";

const Step = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-3">{icon}</div>
    <div className="font-semibold">{title}</div>
    <div className="text-sm text-gray-600 mt-2">{desc}</div>
  </div>
);

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-semibold text-center mb-6">Cómo comprar</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Step icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v4H3z" /></svg>} title="Elegí los productos" desc="Navegá y agregá lo que necesites al carrito." />
        <Step icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>} title="Te contactamos" desc="Un vendedor confirma el pedido y talles por WhatsApp o llamada." />
        <Step icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>} title="Realizás el pago" desc="Transferencia o medio de pago acordado." />
        <Step icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18v13H3z" /></svg>} title="Te enviamos tu pedido" desc="Envío nacional o retiro en sucursal, según lo pactado." />
      </div>
    </section>
  );
}
