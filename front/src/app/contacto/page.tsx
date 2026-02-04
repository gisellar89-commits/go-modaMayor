"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";

interface ContactSettings {
  id?: number;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  business_hours?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

interface ContactAddress {
  id: number;
  name: string;
  address: string;
  business_hours?: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [addresses, setAddresses] = useState<ContactAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/contact`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setAddresses(data.addresses || []);
        } else {
          setSettings(data);
        }
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-yellow-600 bg-clip-text text-transparent mb-6 sm:mb-8">
          Contacto
        </h1>

        {/* Información de contacto */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Cómo contactarnos?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {settings?.whatsapp_number && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">WhatsApp</p>
                  <a 
                    href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    {settings.whatsapp_number}
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
                    className="text-blue-600 hover:text-blue-700 break-all"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Redes sociales */}
          {(settings?.instagram_url || settings?.facebook_url) && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="font-semibold text-gray-800 mb-4">Síguenos en redes</p>
              <div className="flex gap-4">
                {settings?.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  >
                    <span className="text-2xl">📷</span>
                  </a>
                )}
                {settings?.facebook_url && (
                  <a
                    href={settings.facebook_url}
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

        {/* Nuestras Ubicaciones */}
        {addresses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuestras Ubicaciones</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {addresses.map((addr, index) => (
                <div key={addr.id || `addr-${index}`} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Información de la dirección */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📍</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg">{addr.address}</p>
                        {addr.business_hours && (
                          <p className="text-sm text-gray-600 mt-1">
                            🕐 {addr.business_hours}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botón para abrir en Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-semibold py-3 px-4 text-center transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      🗺️ Ver en Google Maps
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
