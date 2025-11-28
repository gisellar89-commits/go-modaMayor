"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

interface ContactSettings {
  id?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  business_hours?: string;
  instagram?: string;
  facebook?: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/contact-settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error al cargar configuración de contacto:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de contacto...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-yellow-600 bg-clip-text text-transparent mb-6 sm:mb-8">
          Contacto
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información de contacto */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Cómo contactarnos?</h2>
            
            <div className="space-y-4">
              {settings?.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📞</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Teléfono</p>
                    <a 
                      href={`tel:${settings.phone}`}
                      className="text-pink-600 hover:text-pink-700"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}

              {settings?.whatsapp && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">💬</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">WhatsApp</p>
                    <a 
                      href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      {settings.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {settings?.email && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">✉️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <a 
                      href={`mailto:${settings.email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}

              {settings?.address && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Dirección</p>
                    <p className="text-gray-600">{settings.address}</p>
                  </div>
                </div>
              )}

              {settings?.business_hours && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🕒</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Horario</p>
                    <p className="text-gray-600">{settings.business_hours}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Redes sociales */}
            {(settings?.instagram || settings?.facebook) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="font-semibold text-gray-800 mb-4">Síguenos en redes</p>
                <div className="flex gap-4">
                  {settings?.instagram && (
                    <a
                      href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      <span className="text-2xl">📷</span>
                    </a>
                  )}
                  {settings?.facebook && (
                    <a
                      href={settings.facebook.startsWith('http') ? settings.facebook : `https://facebook.com/${settings.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      <span className="text-2xl">f</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Formulario de contacto (opcional) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un mensaje</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 font-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Funcionalidad de envío de mensajes próximamente. Por ahora, contáctanos directamente por WhatsApp o email.');
                }}
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
