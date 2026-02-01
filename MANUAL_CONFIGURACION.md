# 📚 Manual de Configuración - Sistema go-modaMayor

## Guía Completa para Configurar el Sistema desde Cero

**Versión**: 1.0  
**Fecha**: 26 de diciembre de 2025  
**Para**: Administradores del sistema

---

## 📋 Índice

1. [Acceso Inicial al Sistema](#1-acceso-inicial-al-sistema)
2. [Configuración de Usuarios](#2-configuración-de-usuarios)
3. [Configuración de Categorías](#3-configuración-de-categorías)
4. [Configuración de Subcategorías](#4-configuración-de-subcategorías)
5. [Configuración de Colores](#5-configuración-de-colores)
6. [Configuración de Tipos de Talle](#6-configuración-de-tipos-de-talle)
7. [Configuración de Valores de Talle](#7-configuración-de-valores-de-talle)
8. [Configuración de Proveedores](#8-configuración-de-proveedores)
9. [Configuración de Temporadas](#9-configuración-de-temporadas)
10. [Configuración de Price Tiers](#10-configuración-de-price-tiers)
11. [Creación de Productos](#11-creación-de-productos)
12. [Generación de Variantes](#12-generación-de-variantes)
13. [Gestión de Stock](#13-gestión-de-stock)
14. [Configuración del Home](#14-configuración-del-home)
15. [Configuración de FAQs](#15-configuración-de-faqs)
16. [Configuración de Contacto](#16-configuración-de-contacto)

---

## 1. Acceso Inicial al Sistema

### 1.1. Requisitos Previos
- Sistema instalado y corriendo
- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- Credenciales de administrador

### 1.2. Primer Acceso
1. Abrir navegador web
2. Ir a: `http://localhost:3000`
3. Click en **"Iniciar Sesión"** (esquina superior derecha)
4. Ingresar credenciales de admin:
   - **Email**: admin@modamayor.com
   - **Password**: admin123
5. Click en **"Ingresar"**
6. El sistema redirige al **Dashboard de Administrador**

### 1.3. Navegación del Panel Admin
Una vez dentro, verás el menú lateral con las siguientes opciones:
- 🏠 **Dashboard**: Vista general de estadísticas
- 📦 **Productos**: Gestión del catálogo
- 📊 **Inventario**: Control de stock
- 💰 **Ventas**: Órdenes y ventas
- 👥 **Usuarios**: Gestión de usuarios y roles
- ⚙️ **Configuración**: Settings generales
- 🎨 **Contenido**: Banners, videos, FAQs
- 📋 **Categorías**: Organización de productos

---

## 2. Configuración de Usuarios


### 2.1. Crear Vendedoras
**¿Para qué?** Las vendedoras asisten a los clientes en su proceso de compra.

#### Permisos del rol "vendedor"
Un usuario con rol "vendedor" tiene los siguientes permisos:

- Acceso a su propio panel de ventas y pedidos asignados.
- Puede ver el listado de productos y precios, pero no puede crear, editar ni eliminar productos.
- Puede gestionar y consultar sus propias órdenes y carritos asignados.
- Puede realizar el proceso de checkout y asignarse pedidos.
- Puede ver reportes de ventas y rankings donde figura como vendedor.
- No tiene acceso a la gestión de usuarios, configuración de sistema, ni administración de productos (solo consulta).
- No puede acceder a rutas administrativas reservadas para admin/encargado (ejemplo: /admin/productos, /admin/usuarios, /admin/banners, etc.).
- No puede editar carritos ni pedidos de otros vendedores.

**Pasos**:
1. Click en **"Usuarios"** en el menú lateral
2. Click en **"Nuevo Usuario"** (botón azul arriba a la derecha)
3. Completar el formulario:
   ```
   Nombre: Maria Lopez
   Email: maria@modamayor.com
   Teléfono: 1123456789 (opcional)
   Role: vendedor
   Password: vendedor123
   Activo: ✓ (marcado)
   ```
4. Click en **"Crear Usuario"**
5. Verificar que aparece en la lista con badge "vendedor"

**Repetir** para crear más vendedoras según necesites (ej: 2-3 vendedoras)

### 2.2. Crear Encargado (Opcional)
Si necesitas un rol intermedio entre vendedor y admin:
1. Mismo proceso que 2.1
2. En **Role** seleccionar: **encargado**

### 2.3. Notas Importantes
- Los **clientes** se registran solos desde el frontend
- Solo crear usuarios para roles internos (vendedor, encargado)
- Guardar las contraseñas en un lugar seguro

---

## 3. Configuración de Categorías

### 3.1. ¿Qué son las Categorías?
Son las clasificaciones principales de productos (ej: Remeras, Pantalones, Camperas)

### 3.2. Crear Primera Categoría
1. Click en **"Categorías"** en el menú lateral
2. Verás una lista vacía o con categorías existentes
3. Click en **"Nueva Categoría"** (botón verde)
4. Completar el formulario:
   ```
   Nombre: Remeras
   Descripción: Remeras de todo tipo (opcional)
   Orden: 1
   ```
5. Click en **"Crear"**

### 3.3. Crear Más Categorías
Repetir el proceso para:

**Categoría 2**:
```
Nombre: Pantalones
Descripción: Pantalones y jeans
Orden: 2
```

**Categoría 3**:
```
Nombre: Camperas
Descripción: Camperas y abrigos
Orden: 3
```

**Categoría 4**:
```
Nombre: Buzos
Descripción: Buzos y sweaters
Orden: 4
```

**Categoría 5**:
```
Nombre: Accesorios
Descripción: Gorros, bufandas, etc
Orden: 5
```

### 3.4. Editar Categorías
1. En la lista, click en **"Editar"** (ícono de lápiz)
2. Modificar campos necesarios
3. Click en **"Guardar"**

### 3.5. Eliminar Categorías
⚠️ **Cuidado**: Solo eliminar si no tiene productos asociados
1. Click en **"Eliminar"** (ícono de basura)
2. Confirmar la acción

### 3.6. Reordenar Categorías
Las categorías se muestran según el campo **"Orden"**:
- Orden 1 = Primera en aparecer
- Orden 2 = Segunda
- etc.

Para cambiar el orden, editar y cambiar el número de orden.

---

## 4. Configuración de Subcategorías

### 4.1. ¿Qué son las Subcategorías?
Son subdivisiones dentro de cada categoría (ej: Remeras → Manga Corta, Manga Larga)

### 4.2. Crear Subcategorías para "Remeras"
1. Ir a **"Categorías"**
2. Click en la categoría **"Remeras"**
3. Buscar sección **"Subcategorías"**
4. Click en **"Nueva Subcategoría"**

**Subcategoría 1**:
```
Nombre: Manga Corta
Descripción: Remeras de manga corta
Orden: 1
```

**Subcategoría 2**:
```
Nombre: Manga Larga
Descripción: Remeras de manga larga
Orden: 2
```

**Subcategoría 3**:
```
Nombre: Musculosas
Descripción: Remeras sin mangas
Orden: 3
```

### 4.3. Subcategorías para "Pantalones"
```
- Jean Clásico (Orden: 1)
- Jean Elastizado (Orden: 2)
- Jogger (Orden: 3)
- Cargo (Orden: 4)
```

### 4.4. Subcategorías para "Camperas"
```
- Campera de Jean (Orden: 1)
- Campera de Cuero (Orden: 2)
- Campera Deportiva (Orden: 3)
- Campera Impermeable (Orden: 4)
```

### 4.5. Subcategorías para "Buzos"
```
- Buzo Liso (Orden: 1)
- Buzo con Capucha (Orden: 2)
- Sweater (Orden: 3)
```

### 4.6. Notas
- Cada categoría puede tener N subcategorías
- Los productos se asocian a una subcategoría específica
- Si no necesitas subcategorías, puedes crear solo una genérica: "General"

---

## 5. Configuración de Colores

### 5.1. ¿Para qué?
Los colores se usan para generar variantes de productos (ej: Remera Azul, Remera Roja)

### 5.2. Acceder a Colores
1. Click en **"Configuración"** en el menú lateral
2. Click en **"Colores"** o buscar en el menú de productos

### 5.3. Crear Colores Básicos
Click en **"Nuevo Color"** y crear uno por uno:

**Color 1**:
```
Nombre: Negro
Código Hex: #000000
```

**Color 2**:
```
Nombre: Blanco
Código Hex: #FFFFFF
```

**Color 3**:
```
Nombre: Gris
Código Hex: #808080
```

**Color 4**:
```
Nombre: Azul
Código Hex: #0000FF
```

**Color 5**:
```
Nombre: Azul Marino
Código Hex: #000080
```

**Color 6**:
```
Nombre: Rojo
Código Hex: #FF0000
```

**Color 7**:
```
Nombre: Verde
Código Hex: #008000
```

**Color 8**:
```
Nombre: Amarillo
Código Hex: #FFFF00
```

**Color 9**:
```
Nombre: Rosa
Código Hex: #FFC0CB
```

**Color 10**:
```
Nombre: Beige
Código Hex: #F5F5DC
```

### 5.4. Agregar Más Colores Según Necesidad
Algunos adicionales útiles:
```
- Bordo (#800020)
- Celeste (#87CEEB)
- Naranja (#FFA500)
- Violeta (#8B00FF)
- Marrón (#8B4513)
- Crudo (#F8F4E3)
```

### 5.5. Editar/Eliminar Colores
- **Editar**: Click en el lápiz, cambiar nombre o código
- **Eliminar**: Solo si no hay productos con ese color

---

## 6. Configuración de Tipos de Talle

### 6.1. ¿Qué son los Tipos de Talle?
Son sistemas de medidas que agrupa talles (ej: XS-XL, Numérico 38-48)

### 6.2. Acceder
1. **"Configuración"** → **"Tipos de Talle"**

### 6.3. Crear Tipos Comunes

**Tipo 1: Letras Estándar**
```
Nombre: Letras Estándar
Descripción: XS, S, M, L, XL, XXL
```

**Tipo 2: Numérico Femenino**
```
Nombre: Numérico Femenino
Descripción: Talles 36 a 50
```

**Tipo 3: Numérico Masculino**
```
Nombre: Numérico Masculino
Descripción: Talles 38 a 52
```

**Tipo 4: Talle Único**
```
Nombre: Talle Único
Descripción: Un solo talle
```

**Tipo 5: Numérico Calzado**
```
Nombre: Numérico Calzado
Descripción: Talles 35 a 45
```

---

## 7. Configuración de Valores de Talle

### 7.1. ¿Qué son?
Son los talles específicos dentro de cada tipo (ej: S, M, L dentro de "Letras Estándar")

### 7.2. Acceder
1. **"Configuración"** → **"Valores de Talle"**

### 7.3. Valores para "Letras Estándar"
Asociar cada valor al tipo "Letras Estándar":

```
1. XS  (Orden: 1)
2. S   (Orden: 2)
3. M   (Orden: 3)
4. L   (Orden: 4)
5. XL  (Orden: 5)
6. XXL (Orden: 6)
```

**Cómo crear cada uno**:
1. Click **"Nuevo Valor de Talle"**
2. Completar:
   ```
   Valor: M
   Tipo de Talle: Letras Estándar (seleccionar del dropdown)
   Orden: 3
   ```
3. Crear

### 7.4. Valores para "Numérico Femenino"
```
36 (Orden: 1)
38 (Orden: 2)
40 (Orden: 3)
42 (Orden: 4)
44 (Orden: 5)
46 (Orden: 6)
48 (Orden: 7)
50 (Orden: 8)
```

### 7.5. Valores para "Numérico Masculino"
```
38 (Orden: 1)
40 (Orden: 2)
42 (Orden: 3)
44 (Orden: 4)
46 (Orden: 5)
48 (Orden: 6)
50 (Orden: 7)
52 (Orden: 8)
```

### 7.6. Valores para "Talle Único"
```
Único (Orden: 1)
```

### 7.7. Valores para "Numérico Calzado"
```
35 - 36 - 37 - 38 - 39 - 40 - 41 - 42 - 43 - 44 - 45
(Orden del 1 al 11)
```

---

## 8. Configuración de Proveedores

### 8.1. ¿Para qué?
Registrar los proveedores de mercadería para trazabilidad y gestión

### 8.2. Acceder
1. **"Productos"** → **"Proveedores"**

### 8.3. Crear Primer Proveedor
1. Click en **"Nuevo Proveedor"**
2. Completar formulario:
   ```
   Nombre: Textil SRL
   Contacto: Juan Pérez
   Email: contacto@textilsrl.com
   Teléfono: 1145678901
   Dirección: Av. Corrientes 1234, CABA
   CUIT: 30-12345678-9
   Notas: Proveedor principal de remeras
   ```
3. Click en **"Crear"**

### 8.4. Crear Más Proveedores (Ejemplos)

**Proveedor 2**:
```
Nombre: Confecciones del Sur
Contacto: María González
Email: info@confeccionesdelsur.com
Teléfono: 1156789012
Dirección: Calle 123, Mar del Plata
CUIT: 30-87654321-9
Notas: Especialistas en pantalones
```

**Proveedor 3**:
```
Nombre: Indumentaria Total
Contacto: Carlos Rodríguez
Email: ventas@indumentariatotal.com
Teléfono: 1167890123
Dirección: Av. Santa Fe 5678, CABA
CUIT: 30-11223344-5
Notas: Proveedor de camperas y buzos
```

### 8.5. Gestión de Proveedores
- **Editar**: Click en lápiz para actualizar datos
- **Desactivar**: Marcar como inactivo si ya no se trabaja con él
- **Eliminar**: Solo si no hay productos asociados

---

## 9. Configuración de Temporadas

### 9.1. ¿Para qué?
Clasificar productos por temporada (Verano, Invierno, Todo el año)

### 9.2. Acceder
1. **"Productos"** → **"Temporadas"**

### 9.3. Crear Temporadas

**Temporada 1**:
```
Nombre: Verano
Descripción: Productos de temporada cálida
```

**Temporada 2**:
```
Nombre: Invierno
Descripción: Productos de temporada fría
```

**Temporada 3**:
```
Nombre: Primavera
Descripción: Productos de entretiempo
```

**Temporada 4**:
```
Nombre: Otoño
Descripción: Productos de entretiempo
```

**Temporada 5**:
```
Nombre: Todo el Año
Descripción: Productos sin temporada específica
```

### 9.4. Uso
Al crear un producto, se puede asociar a una o más temporadas.

---

## 10. Configuración de Price Tiers

### 10.1. ¿Qué son?
Sistema de precios por cantidad: a más prendas compradas, mejor precio

### 10.2. Acceder
1. **"Configuración"** → **"Price Tiers"**

### 10.3. Ver Configuración Actual
Por defecto el sistema tiene 4 niveles:
```
1. Minorista:   0+ prendas  → 1x costo
2. Mayorista:   6+ prendas  → 2.5x costo
3. Descuento 1: 8+ prendas  → 2.25x costo
4. Descuento 2: 12+ prendas → 1.75x costo
```

### 10.4. Modificar un Tier
1. Click en **"Editar"** en el tier que quieras cambiar
2. Ejemplo: Cambiar "Mayorista" de 6 a 5 prendas:
   ```
   Nombre: Mayorista
   Cantidad Mínima: 5 (cambiar de 6 a 5)
   Tipo de Fórmula: Multiplier
   Valor: 2.5
   Orden: 2
   Activo: ✓
   ```
3. **"Guardar"**

### 10.5. Crear un Nuevo Tier
Si querés agregar un nivel adicional:
1. Click **"Nuevo Price Tier"**
2. Ejemplo de tier VIP:
   ```
   Nombre: VIP
   Nombre para Mostrar: Precio VIP
   Cantidad Mínima: 20
   Tipo de Fórmula: Multiplier
   Valor: 1.5
   Orden: 5
   Activo: ✓
   ```
3. **"Crear"**

### 10.6. Tipos de Fórmula
- **Multiplier**: Multiplica el costo (ej: 2.5x)
- **Percentage**: Agrega un porcentaje (ej: 150%)
- **Flat**: Suma un valor fijo (ej: +500)

### 10.7. Reordenar Tiers
El sistema evalúa de mayor a menor cantidad:
- Orden 1 = Se evalúa primero
- Si no cumple, pasa al siguiente

**Importante**: El tier de menor cantidad debe tener Orden más alto.

### 10.8. Recalcular Precios
Después de cambiar tiers:
1. Click en **"Recalcular Todos los Productos"**
2. Esto actualiza los precios de todos los productos según los nuevos tiers

---

## 11. Creación de Productos

### 11.1. Acceder
1. **"Productos"** en el menú lateral
2. Click en **"Nuevo Producto"**

### 11.2. Completar Información Básica

**Ejemplo: Remera Básica de Algodón**

```
Nombre: Remera Básica de Algodón
Código: REM-BAS-001
Descripción: 
  Remera de algodón 100%, corte clásico.
  Ideal para uso diario.
  Cuello redondo, manga corta.

Categoría: Remeras
Subcategoría: Manga Corta
Proveedor: Textil SRL
Temporada: Todo el Año

Precio de Costo: 1500
(El sistema calculará automáticamente los precios de venta según los tiers)

Tipo de Talle: Letras Estándar

Tags/Etiquetas: basica, algodon, clasica (separar por comas)
```

### 11.3. Subir Imagen Principal
1. En **"Imagen Principal"**, click en **"Seleccionar Archivo"**
2. Elegir imagen del producto (formato JPG/PNG)
3. La imagen se sube automáticamente

### 11.4. Crear el Producto
1. Click en **"Crear Producto"**
2. El sistema guarda el producto
3. Redirige a la página de detalle del producto

### 11.5. Crear Más Productos (Ejemplos)

**Producto 2: Pantalón Jean Elastizado**
```
Nombre: Pantalón Jean Elastizado
Código: PANT-JEA-002
Descripción: Jean elastizado de corte moderno. Tiro medio.
Categoría: Pantalones
Subcategoría: Jean Elastizado
Proveedor: Confecciones del Sur
Temporada: Todo el Año
Precio de Costo: 3500
Tipo de Talle: Numérico Femenino
Tags: jean, elastizado, comodo
```

**Producto 3: Campera de Jean**
```
Nombre: Campera de Jean Clásica
Código: CAMP-JEA-003
Descripción: Campera de jean con corte clásico. Cierre con botones.
Categoría: Camperas
Subcategoría: Campera de Jean
Proveedor: Indumentaria Total
Temporada: Otoño
Precio de Costo: 5000
Tipo de Talle: Letras Estándar
Tags: campera, jean, clasica
```

---

## 12. Generación de Variantes

### 12.1. ¿Qué son las Variantes?
Combinaciones de talle + color de un producto (ej: Remera Azul M, Remera Azul L)

### 12.2. Generar Variantes Automáticamente
Después de crear un producto:

1. Estando en la página del producto, buscar sección **"Variantes"**
2. Click en **"Generar Variantes"**
3. Se abre un modal con dos listas:
   - **Talles**: Lista de talles del tipo asociado
   - **Colores**: Lista de todos los colores disponibles

4. **Seleccionar Talles**:
   - Marcar los talles que tendrás en stock
   - Ejemplo: S, M, L, XL (dejar sin marcar XS y XXL si no los tendrás)

5. **Seleccionar Colores**:
   - Marcar los colores disponibles
   - Ejemplo: Negro, Blanco, Azul

6. Click en **"Generar Variantes"**

7. El sistema crea automáticamente todas las combinaciones:
   ```
   - S + Negro
   - S + Blanco
   - S + Azul
   - M + Negro
   - M + Blanco
   - M + Azul
   - L + Negro
   - L + Blanco
   - L + Azul
   - XL + Negro
   - XL + Blanco
   - XL + Azul
   
   Total: 12 variantes (4 talles × 3 colores)
   ```

### 12.3. Editar Variantes Individualmente
Si necesitas cambiar algo específico de una variante:
1. En la lista de variantes, click en **"Editar"** en la variante
2. Puedes cambiar:
   - SKU (código único de la variante)
   - Imagen específica (si la variante tiene foto propia)
3. **"Guardar"**

### 12.4. Eliminar Variantes
Si una combinación no existe (ej: no hay XL en Azul):
1. Click en **"Eliminar"** (ícono de basura) en esa variante
2. Confirmar

### 12.5. Subir Imágenes por Color
Opcional: Si tenés fotos de cada color:
1. Click en **"Propagar Imagen"**
2. Seleccionar color (ej: Azul)
3. Subir imagen de remera azul
4. El sistema asigna esa imagen a todas las variantes de ese color

---

## 13. Gestión de Stock

### 13.1. Acceder al Stock de un Producto
Opción A:
1. **"Productos"** → Buscar el producto → Click en el producto
2. Sección **"Variantes"** → cada variante tiene botón **"Gestionar Stock"**

Opción B:
1. **"Inventario"** → Ver todas las variantes con stock

### 13.2. Cargar Stock en una Variante
1. Click en **"Gestionar Stock"** en la variante
2. Se abre modal con campos:
   ```
   Ubicación: Principal (default)
   Stock Actual: 0
   Nuevo Stock: [ingresar cantidad]
   ```
3. Ejemplo: Ingresar **50** en "Nuevo Stock"
4. Click en **"Actualizar Stock"**

### 13.3. Cargar Stock Masivo
Si necesitas cargar stock de todas las variantes de un producto:

1. En el producto, click en **"Cargar Stock Masivo"**
2. Se muestra tabla con todas las variantes
3. En cada fila, ingresar la cantidad:
   ```
   S + Negro:  30
   S + Blanco: 25
   S + Azul:   20
   M + Negro:  50
   M + Blanco: 45
   ...
   ```
4. Click en **"Guardar Todo"**

### 13.4. Ajustar Stock
Si necesitas corregir stock (por rotura, devolución, etc):
1. Click en **"Gestionar Stock"** en la variante
2. Ingresar el nuevo valor total
3. El sistema registra el movimiento de stock

### 13.5. Ver Historial de Movimientos
1. **"Inventario"** → **"Movimientos de Stock"**
2. Verás tabla con:
   - Fecha y hora
   - Producto y variante
   - Cantidad (positiva o negativa)
   - Tipo: entrada, salida, ajuste, venta
   - Usuario que realizó el cambio

### 13.6. Productos con Bajo Stock
1. **"Inventario"** → **"Bajo Stock"**
2. Verás productos con stock menor a un umbral (ej: menos de 5 unidades)
3. Útil para saber qué reponer

---

## 14. Configuración del Home

### 14.1. Configurar Topbar (Barra Superior)
1. **"Contenido"** → **"Topbar"**
2. Completar:
   ```
   Mensaje: ¡Envíos gratis en compras mayores a $50.000!
   Color de Fondo: #000000 (negro)
   Color de Texto: #FFFFFF (blanco)
   Activo: ✓
   ```
3. **"Guardar"**

### 14.2. Configurar Banners Principales
**¿Qué son?** Imágenes grandes en el slider principal del home

1. **"Contenido"** → **"Banners"**
2. Click en **"Nuevo Banner"**

**Banner 1**:
```
Título: Nueva Colección Primavera
Subtítulo: Descubrí los últimos modelos
Imagen: [subir imagen 1920x600px]
Enlace: /productos?season=primavera
Orden: 1
Activo: ✓
```

**Banner 2**:
```
Título: Ofertas de Temporada
Subtítulo: Hasta 30% OFF en productos seleccionados
Imagen: [subir imagen]
Enlace: /productos?discount=true
Orden: 2
Activo: ✓
```

**Banner 3**:
```
Título: Envíos a Todo el País
Subtítulo: Comprá online desde tu casa
Imagen: [subir imagen]
Enlace: /productos
Orden: 3
Activo: ✓
```

### 14.3. Configurar Videos del Home
Si querés mostrar videos:
1. **"Contenido"** → **"Videos"**
2. Click en **"Nuevo Video"**
3. Completar:
   ```
   Título: Catálogo Otoño-Invierno 2025
   URL de Video: https://www.youtube.com/watch?v=xxxxxxxxx
   Orden: 1
   Activo: ✓
   ```

### 14.4. Configurar Secciones del Home
**¿Qué son?** Secciones de productos destacados (ej: "Más Vendidos", "Nuevos Ingresos")


1. **"Contenido"** → **"Secciones de Home"**
2. Click en **"Sincronizar desde Tags"**
3. Esto crea automáticamente secciones basadas en los tags de productos

**O crear manualmente**:
1. Click en **"Nueva Sección"**
2. Completar:
   ```
   Título: Más Vendidos
   Subtítulo: Los productos más populares
   Tipo: tag
   Tag: bestseller
   Orden: 1
   Límite de Productos: 12 (puede ser de 1 a 100)
   Modo de Visualización: both (puede ser 'manual', 'auto' o 'both')
   Activo: ✓
   ```

**Campos importantes:**
- **Límite de Productos:** Debe estar entre 1 y 100.
- **Modo de Visualización (show_mode):**
  - `manual`: productos seleccionados manualmente
  - `auto`: productos seleccionados automáticamente por el sistema
  - `both`: muestra productos tanto manuales como automáticos

**Ejemplo de secciones útiles**:
```
- Más Vendidos (tag: bestseller)
- Nuevos Ingresos (tag: nuevo)
- Ofertas (tag: oferta)
- Remeras (tag: remera)
- Camperas (tag: campera)
```

### 14.5. Reordenar Elementos
Todos los elementos del home tienen un campo **"Orden"**:
- Cambiar el número para reordenar
- Menor número = aparece primero

---

## 15. Configuración de FAQs

### 15.1. ¿Para qué?
Sección de Preguntas Frecuentes para clientes

### 15.2. Acceder
1. **"Contenido"** → **"FAQs"**

### 15.3. Crear Preguntas

**FAQ 1**:
```
Pregunta: ¿Cómo hago una compra?
Respuesta: 
Navegá por nuestro catálogo, agregá productos al carrito y solicitá ayuda de una vendedora. 
Ella te guiará en el proceso de compra y pago.

Categoría: Compras
Orden: 1
Activo: ✓
```

**FAQ 2**:
```
Pregunta: ¿Cuáles son los medios de pago?
Respuesta: 
Aceptamos efectivo, transferencia bancaria y Mercado Pago. 
Consultá con tu vendedora las opciones disponibles.

Categoría: Pagos
Orden: 2
Activo: ✓
```

**FAQ 3**:
```
Pregunta: ¿Hacen envíos?
Respuesta: 
Sí, realizamos envíos a todo el país. 
El costo y tiempo de envío se calculan según tu ubicación.

Categoría: Envíos
Orden: 3
Activo: ✓
```

**FAQ 4**:
```
Pregunta: ¿Puedo cambiar o devolver un producto?
Respuesta: 
Tenés 30 días para realizar cambios o devoluciones. 
El producto debe estar sin uso y con etiquetas originales.

Categoría: Cambios y Devoluciones
Orden: 4
Activo: ✓
```

**FAQ 5**:
```
Pregunta: ¿Cuánto tarda un pedido?
Respuesta: 
Una vez confirmado el pago, preparamos tu pedido en 24-48hs hábiles. 
El envío tarda 3-7 días según la zona.

Categoría: Envíos
Orden: 5
Activo: ✓
```

### 15.4. Organizar FAQs
- Usar **"Orden"** para organizarlas
- Agrupar por **"Categoría"** (Compras, Pagos, Envíos, etc.)
- Las más importantes con orden menor

---

## 16. Configuración de Contacto

### 16.1. Acceder
1. **"Configuración"** → **"Contacto"**

### 16.2. Completar Datos
```
Teléfono: +54 11 1234-5678
WhatsApp: +54 9 11 1234-5678
Email: contacto@modamayor.com
Dirección: Av. Corrientes 1234, CABA, Argentina
Horario de Atención: Lunes a Viernes de 9:00 a 18:00hs

Instagram: @modamayor
Facebook: /modamayor
```

### 16.3. Guardar
Click en **"Guardar Configuración"**

### 16.4. ¿Dónde se muestra?
- Footer del sitio
- Página de contacto
- Topbar (si está configurado)

---

## 📊 Resumen de Configuración

### Orden Recomendado de Configuración:
### Tabla de permisos por rol

| Permiso / Función                | Admin | Encargado | Vendedor | Cliente |
|-----------------------------------|:-----:|:---------:|:--------:|:-------:|
| Acceso total al panel admin       |   ✔   |     ✔     |          |         |
| Gestión de usuarios              |   ✔   |     ✔*    |          |         |
| Gestión de productos             |   ✔   |     ✔     | Consulta |         |
| Gestión de stock                 |   ✔   |     ✔     | Consulta |         |
| Gestión de price tiers           |   ✔   |     ✔     |          |         |
| Gestión de banners y home        |   ✔   |     ✔     |          |         |
| Gestión de FAQs y contacto       |   ✔   |     ✔     |          |         |
| Ver y gestionar sus ventas       |   ✔   |     ✔     |    ✔     |         |
| Ver reportes y rankings          |   ✔   |     ✔     |    ✔     |         |
| Asignarse pedidos                |   ✔   |     ✔     |    ✔     |         |
| Checkout y gestión de carritos   |   ✔   |     ✔     |    ✔     |   ✔     |
| Acceso público (catálogo, home)  |   ✔   |     ✔     |    ✔     |   ✔     |

*Encargado puede gestionar usuarios solo en algunos módulos según configuración.
1. ✅ **Usuarios** (vendedoras)
2. ✅ **Categorías** y **Subcategorías**
3. ✅ **Colores**
4. ✅ **Tipos de Talle** y **Valores de Talle**
5. ✅ **Proveedores**
6. ✅ **Temporadas**
7. ✅ **Price Tiers**
8. ✅ **Productos** (uno a la vez)
9. ✅ **Variantes** (por cada producto)
10. ✅ **Stock** (por cada variante)
11. ✅ **Home** (banners, videos, secciones)
12. ✅ **FAQs**
13. ✅ **Contacto**

### Tiempo Estimado:
- Configuración básica: **2-3 horas**
- Con 20-30 productos: **1 día completo**
- Sistema completo: **2-3 días**

---

## 🎯 Checklist de Configuración Inicial

### Usuarios
- [ ] Al menos 2 vendedoras creadas
- [ ] Credenciales guardadas

### Productos Base
- [ ] 5+ categorías creadas
- [ ] Subcategorías asociadas
- [ ] 10+ colores disponibles
- [ ] 3+ tipos de talle configurados
- [ ] Valores de talle ingresados
- [ ] 3+ proveedores registrados
- [ ] Temporadas configuradas

### Catálogo
- [ ] Price tiers ajustados según negocio
- [ ] Al menos 10 productos creados
- [ ] Variantes generadas para cada producto
- [ ] Stock cargado en todas las variantes
- [ ] Imágenes subidas

### Frontend
- [ ] Topbar configurado
- [ ] 3+ banners en el home
- [ ] Secciones de home configuradas
- [ ] FAQs cargadas (mínimo 5)
- [ ] Datos de contacto actualizados

---

## 🆘 Problemas Comunes y Soluciones

### No puedo crear productos
**Problema**: Error al crear producto  
**Solución**: Verificar que existan:
- Al menos 1 categoría
- Al menos 1 proveedor
- Al menos 1 tipo de talle

### No aparecen variantes
**Problema**: Generé variantes pero no aparecen  
**Solución**: 
- Verificar que seleccionaste al menos 1 talle y 1 color
- Refrescar la página
- Verificar que no haya errores en consola del navegador

### Stock no se actualiza
**Problema**: Cambio el stock pero no se guarda  
**Solución**:
- Verificar que la variante existe
- Verificar permisos de usuario
- Revisar logs del backend

### Precios incorrectos
**Problema**: Los precios no se calculan bien  
**Solución**:
- Verificar configuración de price tiers
- Click en "Recalcular Todos los Productos"
- Verificar que el producto tenga precio de costo

---

## 📞 Soporte

Si tenés problemas durante la configuración:
1. Revisar logs del backend (terminal)
2. Revisar consola del navegador (F12)
3. Consultar documentación técnica
4. Contactar al equipo de desarrollo

---

**¡Sistema configurado y listo para usar!** 🎉
