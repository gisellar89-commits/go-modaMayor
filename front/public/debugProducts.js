// Este script ayuda a depurar la estructura de los productos en el navegador
// Abre la consola y ejecuta: window.debugProducts(products)
window.debugProducts = (products) => {
  if (!Array.isArray(products)) {
    console.error('No es un array');
    return;
  }
  for (const p of products) {
    console.log('ID:', p.id || p.ID, 'Category:', p.category, 'Subcategory:', p.subcategory);
  }
  console.log('Ejemplo de producto:', products[0]);
};
