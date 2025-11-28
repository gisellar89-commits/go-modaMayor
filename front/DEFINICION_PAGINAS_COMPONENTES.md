# Definición inicial de páginas y componentes – Frontend Tienda de Ropa

## Páginas principales (src/app)
- `/` (Home): Destacados, novedades, banner principal.
- `/productos`: Catálogo de productos, filtros, búsqueda.
- `/productos/[id]`: Detalle de producto (imágenes, variantes, stock, agregar al carrito).
- `/carrito`: Carrito de compras.
- `/checkout`: Proceso de compra.
- `/login` y `/registro`: Autenticación de usuario.
- `/perfil`: Panel de usuario (historial, datos personales).
- `/admin`: Panel de administración (productos, stock, pedidos, usuarios, reportes).

## Componentes reutilizables (src/components)
- `Navbar`: Navegación principal (logo, links, login, carrito).
- `Footer`: Pie de página.
- `ProductCard`: Tarjeta de producto para el catálogo.
- `ProductGallery`: Galería de imágenes en el detalle.
- `CartIcon`: Icono de carrito con contador.
- `Button`: Botón reutilizable.
- `Input`: Campo de texto reutilizable.
- `Loader`: Indicador de carga.
- `Alert`: Mensajes de error/éxito.
- `ProtectedRoute`: Wrapper para rutas privadas (admin, usuario).

## Hooks/contextos sugeridos (src/contexts, src/hooks)
- `useAuth`: Manejo de autenticación y usuario actual.
- `useCart`: Manejo del carrito de compras.
- `useProducts`: Lógica para obtener productos y detalles.

## Siguientes pasos sugeridos
1. Crear la estructura de carpetas y archivos base para estas páginas y componentes.
2. Implementar la navegación principal (Navbar + rutas).
3. Probar la app en modo desarrollo (`npm run dev`).

¿Quieres que cree los archivos base y la estructura de carpetas para que puedas empezar a trabajar sobre ellos?