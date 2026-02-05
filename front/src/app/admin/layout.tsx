"use client";
import React from 'react';
import "../globals.css";
import AdminSidebar from '../../components/AdminSidebar';
import AdminGuard from '../../components/AdminGuard';
import { useActivityTracking } from '@/hooks/useActivityTracking';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Activar tracking de actividad para mantener sesión online
  useActivityTracking();

  return (
    <AdminGuard allowedRoles={['admin', 'encargado', 'vendedor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto flex">
          <AdminSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
