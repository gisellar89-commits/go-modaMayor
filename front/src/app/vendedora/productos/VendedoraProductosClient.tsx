"use client";
import dynamic from "next/dynamic";

const AdminProductosPage = dynamic(() => import("../../admin/productos/page"), { ssr: false });

export default function VendedoraProductosClient() {
  return <AdminProductosPage />;
}