import("../src/app/productos/ProductosClient.tsx").then(module => {
	window.products = JSON.stringify(module.default);
});
