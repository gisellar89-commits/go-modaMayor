import React, { Suspense } from "react";
import InventarioPage from "../../admin/inventario/page";

export default function VendedoraInventarioPage() {
	return (
		<Suspense fallback={<div>Cargando inventario...</div>}>
			<InventarioPage />
		</Suspense>
	);
}