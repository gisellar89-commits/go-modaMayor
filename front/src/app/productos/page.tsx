import React, { Suspense } from "react";
import ProductosClient from "./ProductosClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando catálogo...</div>}>
      <ProductosClient />
    </Suspense>
  );
}

