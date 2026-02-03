# 📚 Manual de Configuración - Sistema go-modaMayor

## Guía Completa para Configurar el Sistema desde Cero

**Versión**: 1.1  
**Fecha**: 2 de febrero de 2026  
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
17. [Gestión de Direcciones de Clientes](#17-gestión-de-direcciones-de-clientes)
18. [Remitos Internos](#18-remitos-internos)
19. [Configuración de Imágenes (Cloudinary)](#19-configuración-de-imágenes-cloudinary)

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
   Teléfono: 1123456789
   Role: vendedor
   Password: vendedor123
   Horario desde: 09:00 (opcional)
   Horario hasta: 18:00 (opcional)
   Activo: ✓ (marcado)
   ```
4. Click en **"Crear Usuario"**
5. Verificar que aparece en la lista con badge "vendedor"

**Nota sobre horarios**: Los campos de horario son opcionales y permiten definir el horario de trabajo de cada vendedor para mejor organización.

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

> **💡 Colores Precargados**: El sistema incluye 11 colores básicos automáticamente al iniciar por primera vez. Puedes editarlos, desactivarlos o agregar nuevos según necesites.

### 5.3. Colores Incluidos por Defecto

Al iniciar el sistema por primera vez, ya encontrarás estos colores disponibles:

1. **Negro** - #000000
2. **Blanco** - #FFFFFF
3. **Gris** - #808080
4. **Azul** - #0000FF
5. **Azul Marino** - #000080
6. **Rojo** - #FF0000
7. **Verde** - #008000
8. **Amarillo** - #FFFF00
9. **Rosa** - #FFC0CB
10. **Marrón** - #8B4513
11. **Beige** - #F5F5DC

### 5.4. Agregar Nuevos Colores
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

### 5.4. Agregar Nuevos Colores

Si necesitas agregar más colores personalizados:

1. Click en **"Nuevo Color"**
2. Completar el formulario:
   ```
   Nombre: Turquesa
   Código Hex: #40E0D0
   ```
3. Click en **"Crear"**

**Algunos colores adicionales útiles**:
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

> **💡 Tipos Precargados**: El sistema incluye 6 tipos de talles comunes con todos sus valores. Están listos para usar y puedes agregar más si necesitas.

### 6.3. Tipos de Talle Incluidos por Defecto

**1. Talle único / sin variantes**
- Para productos sin variaciones de talle
- Valor incluido: Único

**2. Letras Estándar**
- Descripción: XS, S, M, L, XL, XXL
- Valores incluidos: XS, S, M, L, XL, XXL (ordenados del 1 al 6)

**3. Numérico Femenino**
- Descripción: Talles 36 a 50
- Valores incluidos: 36, 38, 40, 42, 44, 46, 48, 50

**4. Numérico Masculino**
- Descripción: Talles 38 a 52
- Valores incluidos: 38, 40, 42, 44, 46, 48, 50, 52

**5. Numérico Calzado**
- Descripción: Talles 35 a 45
- Valores incluidos: 35 al 45 (del 1 al 11)

**6. Talle de Jeans**
- Descripción: Talles 24 a 38
- Valores incluidos: 24, 26, 28, 30, 32, 34, 36, 38

### 6.4. Agregar Nuevos Tipos de Talle

Si necesitas crear un tipo de talle personalizado:

1. Click **"Nuevo Tipo de Talle"**
2. Completar:
   ```
   Nombre: Talles Especiales
   Descripción: Talles no estándar
   ☐ Talle único (sin variantes) - dejar sin marcar
   ```
3. **"Crear"**

---

## 7. Configuración de Valores de Talle

### 7.1. ¿Qué son?
Son los talles específicos dentro de cada tipo (ej: S, M, L dentro de "Letras Estándar")

> **💡 Valores Precargados**: Todos los tipos de talle vienen con sus valores correspondientes ya cargados. Solo necesitas agregar valores si creas nuevos tipos personalizados.

### 7.2. Acceder
1. **"Configuración"** → **"Tipos de Talle"**
2. Click en un tipo para ver sus valores
3. O ir a **"Valores de Talle"** para ver todos

### 7.3. Agregar Valores a Tipos Personalizados

Si creaste un tipo de talle personalizado y necesitas agregarle valores:

1. Click **"Nuevo Valor de Talle"**
2. Completar:
   ```
   Valor: A
   Tipo de Talle: [Seleccionar tu tipo personalizado]
   Orden: 1
   ```
3. **"Crear"**
4. Repetir para cada valor (B, C, etc.)

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

### 11.1. Acceder al Wizard de Creación
1. **"Productos"** en el menú lateral
2. Click en **"Nuevo Producto"**
3. Se abre un wizard de 4 pasos:
   - **Paso 1**: Información básica del producto
   - **Paso 2**: Generación de variantes (solo si aplica)
   - **Paso 3**: Selección manual de variantes (opcional)
   - **Paso 4**: Configuración de stock por ubicación

### 11.2. Paso 1: Información Básica

**Campos Obligatorios:**
- **Nombre**: Nombre descriptivo del producto
- **Descripción**: Detalles del producto (tela, uso, características)
- **Precio de Costo**: Precio al que compraste el producto
- **Categoría**: Seleccionar categoría principal
- **Subcategoría**: Se carga automáticamente según la categoría

**Campos Opcionales:**
- **Código**: SKU o código interno (si no se completa, el sistema genera uno)
- **Descuento**: Tipo (porcentaje/fijo) y valor
- **Imágenes**: Hasta 3 imágenes (Principal, Con Modelo, En Perchero)
- **Tipo de Talle**: Seleccionar el tipo de talles que usará este producto
- **Proveedor**: Seleccionar proveedor si corresponde
- **Temporada**: Asociar a una temporada (Otoño, Primavera, etc.)
- **Año**: Año de la temporada
- **Tags**: Etiquetas para el home (Nuevo Ingreso, Destacado, En Oferta, Tendencia)

**Configuración de Variantes:**

**Para productos CON variantes:**
- Seleccionar uno o más colores de la lista
- Seleccionar un tipo de talle diferente de "Talle único / sin variantes"

**Para productos SIN variantes** (accesorios, productos únicos):
- Marcar "Sin variante de color" 
- Y seleccionar "Talle único / sin variantes" (o dejar sin seleccionar)

> **💡 Nota**: El sistema detecta automáticamente si tu producto necesita variantes y te lleva al paso correspondiente.

### 11.3. Ejemplo de Producto CON Variantes

**Remera Básica de Algodón**
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

Tipo de Talle: Letras Estándar (S, M, L, XL)
Colores: Negro, Blanco, Azul (marcar los que correspondan)

Tags: Nuevo Ingreso, Destacado
```

### 11.4. Ejemplo de Producto SIN Variantes

**Gorra Deportiva Unisex**
```
Nombre: Gorra Deportiva Unisex
Código: GORRA-001
Descripción: 
  Gorra deportiva con ajuste regulable.
  Talle único, material transpirable.

Categoría: Accesorios
Subcategoría: Gorras
Precio de Costo: 800

Tipo de Talle: Talle único / sin variantes
Colores: ✓ Sin variante de color
```

### 11.5. Crear el Producto
1. Completar todos los campos obligatorios
2. Click en **"Crear Producto"**
3. El sistema:
   - Guarda el producto
   - Analiza si necesita variantes
   - Te lleva al paso siguiente (Variantes o Stock)

---

## 12. Generación de Variantes

### 12.1. ¿Qué son las Variantes?
Combinaciones de talle + color de un producto (ej: Remera Azul M, Remera Azul L)

> **Nota importante:** No todos los productos requieren variantes. Si tu producto no tiene variaciones de talle ni color (por ejemplo, un accesorio único), puedes crear un producto sin variantes.

### 12.2. Flujo del Wizard de Creación

Al crear un producto, el sistema analiza automáticamente tus selecciones:

**Productos CON variantes** (el sistema te llevará al Paso 2 - Generación de Variantes):
- Si seleccionaste colores Y un tipo de talle diferente de "Talle único"
- Si seleccionaste solo colores (producto con variante de color únicamente)
- Si seleccionaste solo un tipo de talle diferente de "único" (producto con variante de talle únicamente)

**Productos SIN variantes** (el sistema te llevará directo al Paso 4 - Stock):
- Si NO seleccionaste colores (o marcaste "Sin variante de color")
- Y NO seleccionaste tipo de talle (o seleccionaste "Talle único / sin variantes")
- Ejemplo: Accesorios, productos únicos, artículos sin variaciones

### 12.3. Generar Variantes Automáticamente

Si tu producto tiene variantes, el sistema te mostrará el Paso 2 del wizard:

1. **Seleccionar Talles**:
   - Verás una lista de talles según el tipo seleccionado
   - Marcar los talles que tendrás en stock
   - Ejemplo: S, M, L, XL (dejar sin marcar XS y XXL si no los tendrás)

2. **Seleccionar Colores**:
   - Verás los colores disponibles en el sistema
   - Marcar los colores disponibles para este producto
   - Ejemplo: Negro, Blanco, Azul

3. Click en **"Generar Variantes"** o **"Selección Manual"**

4. El sistema crea automáticamente todas las combinaciones:
   ```
   Ejemplo con 4 talles × 3 colores = 12 variantes:
   - S + Negro, S + Blanco, S + Azul
   - M + Negro, M + Blanco, M + Azul
   - L + Negro, L + Blanco, L + Azul
   - XL + Negro, XL + Blanco, XL + Azul
   ```

### 12.4. Selección Manual de Variantes

Si prefieres elegir exactamente qué combinaciones crear (en lugar de generarlas todas):

1. En el Paso 2, click en **"Selección Manual"**
2. Verás un modal con todas las combinaciones posibles
3. Marca solo las combinaciones que quieres crear
4. Confirmar → El sistema crea solo esas variantes

### 12.5. Editar Variantes Individualmente
Si necesitas cambiar algo específico de una variante:
1. En la lista de variantes, click en **"Editar"** en la variante
2. Puedes cambiar:
   - SKU (código único de la variante)
   - Imagen específica (si la variante tiene foto propia)
3. **"Guardar"**

### 12.6. Eliminar Variantes
Si una combinación no existe (ej: no hay XL en Azul):
1. Click en **"Eliminar"** (ícono de basura) en esa variante
2. Confirmar

### 12.7. Subir Imágenes por Color
Opcional: Si tenés fotos de cada color:
1. Click en **"Propagar Imagen"**
2. Seleccionar color (ej: Azul)
3. Subir imagen de remera azul
4. El sistema asigna esa imagen a todas las variantes de ese color

---

## 13. Gestión de Stock

### 13.1. Sistema de Ubicaciones
El sistema maneja **stock por ubicación**. Las ubicaciones disponibles son:
- **Depósito**: Almacén central (ubicación principal para ventas online)
- **Mendoza**: Sucursal de Mendoza
- **Salta**: Sucursal de Salta

Cada variante de producto puede tener stock en múltiples ubicaciones simultáneamente.

### 13.2. Acceder al Módulo de Inventario
1. **"Inventario"** en el menú lateral
2. Verás la pantalla principal de inventario con:
   - Filtros por ubicación, categoría, proveedor
   - Búsqueda por nombre o código
   - Tabla con todos los productos y su stock por ubicación

### 13.3. Gestionar Stock desde Edición de Producto

#### Opción A: Productos con Variantes
1. **"Productos"** → Seleccionar producto → Click en **"Editar"**
2. Ir a la pestaña **"Stock por Ubicación"**
3. Verás una tabla con todas las variantes (Color × Talle) y 3 columnas para cada ubicación:
   ```
   Color | Talle | Depósito | Mendoza | Salta | Total
   Negro | S     | 50       | 10      | 5     | 65
   Negro | M     | 40       | 15      | 8     | 63
   Azul  | S     | 30       | 0       | 0     | 30
   ```
4. Editar directamente los números en cada celda
5. Click en **"Guardar Stocks"** al finalizar

#### Opción B: Productos sin Variantes
1. Si el producto no tiene variantes, verás una tabla simple:
   ```
   Ubicación | Stock
   Depósito  | 100
   Mendoza   | 50
   Salta     | 25
   ```
2. Editar los valores y guardar

### 13.4. Gestionar Stock desde Inventario

1. **"Inventario"** → Seleccionar ubicación en el filtro (ej: Depósito)
2. Ver el stock de todos los productos en esa ubicación
3. Para editar:
   - Click en el ícono de **"Ver Detalles"** (ojo) en el producto/variante
   - Se abre un modal con:
     - **Pestaña "Ubicaciones"**: Ver y editar stock en cada ubicación
     - **Pestaña "Movimientos"**: Historial de movimientos de esa variante
4. Editar el stock y guardar

### 13.5. Filtros de Inventario
En la pantalla de inventario puedes filtrar por:
- **Ubicación**: Depósito, Mendoza, Salta
- **Categoría**: Filtrar por tipo de producto
- **Proveedor**: Filtrar por proveedor
- **Estado de Stock**:
  - **Todos**: Ver todos los productos
  - **Bajo Stock**: Productos con stock menor al umbral (configurable, por defecto 10 unidades)
  - **Sin Stock**: Productos con 0 unidades
  - **Con Reservas**: Productos con stock reservado por carritos activos

### 13.6. Stock Reservado
El sistema maneja **stock reservado** automáticamente:
- Cuando un cliente agrega productos al carrito, se reserva el stock
- El stock reservado no está disponible para otros clientes
- Si el carrito no se completa en 24 horas, la reserva se libera automáticamente
- En el inventario verás:
  - **Stock**: Cantidad total física
  - **Reservado**: Cantidad reservada por carritos
  - **Disponible**: Stock - Reservado (disponible para nuevas ventas)

### 13.7. Ver Historial de Movimientos
1. **"Inventario"** → **"Movimientos de Stock"** (menú lateral)
2. O desde el detalle de un producto/variante
3. Verás tabla con:
   - **Fecha y hora**
   - **Producto y variante**
   - **Ubicación**
   - **Tipo de movimiento**:
     - `Ajuste`: Corrección manual de stock
     - `Venta`: Venta confirmada
     - `Devolución`: Producto devuelto
     - `Transferencia`: Traslado entre ubicaciones (remito interno)
     - `Stock Inicial`: Carga inicial de stock
   - **Cantidad**: Positiva (entrada) o negativa (salida)
   - **Usuario**: Quién realizó el movimiento

### 13.8. Productos con Bajo Stock
Para ver productos que necesitan reposición:
1. **"Inventario"** → Filtro **"Estado de Stock"** → Seleccionar **"Bajo Stock"**
2. Ajustar el umbral si es necesario (por defecto 10 unidades)
3. Verás solo los productos cuyo stock en la ubicación seleccionada es menor al umbral

### 13.9. Expansión de Productos con Variantes
En la vista de inventario:
- Productos con variantes muestran un **botón "+"** para expandir
- Click en el botón para ver el stock de cada variante individual
- Verás una subtabla con Color, Talle y stock por ubicación

### 13.10. Notas Importantes
- **Los cambios de stock NO se guardan automáticamente**: Siempre hacer click en "Guardar" o "Guardar Stocks"
- **Stock en Depósito**: Es la ubicación principal para ventas online
- **Stock en Sucursales**: Para ventas locales o traslados a depósito vía remitos internos
- **Stock Reservado**: Se gestiona automáticamente, no editar manualmente
- **Movimientos de Stock**: Se registran automáticamente con cada cambio

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

## 17. Gestión de Direcciones de Clientes

### 17.1. ¿Para qué?
Los clientes pueden tener múltiples direcciones de envío guardadas (casa, trabajo, etc.) para facilitar sus compras.

### 17.2. Acceder a las Direcciones de un Cliente
1. **"Usuarios"** → Buscar el cliente
2. Click en el cliente para ver su perfil
3. Click en **"Ver Direcciones"** (botón morado)
4. Se muestra la lista de direcciones del cliente

### 17.3. Estructura de una Dirección
Cada dirección contiene:
- **Etiqueta**: Casa, Trabajo, etc. (opcional)
- **Nombre del destinatario**: Quien recibe el pedido
- **Teléfono del destinatario**: Contacto para la entrega
- **Calle y número**: Dirección completa
- **Piso/Depto**: Opcional
- **Ciudad**: Localidad
- **Provincia**: Estado/Provincia
- **Código Postal**: CP
- **País**: Por defecto Argentina
- **Referencia**: Indicaciones adicionales (opcional)
- **Predeterminada**: Una dirección puede ser marcada como principal

### 17.4. Marcar Dirección como Predeterminada
1. En la lista de direcciones del cliente
2. Click en **"Marcar como predeterminada"** en la dirección deseada
3. Esa dirección se usará por defecto en los pedidos

### 17.5. Eliminar una Dirección
1. En la lista de direcciones
2. Click en el botón **"Eliminar"** (ícono de basura)
3. Confirmar la eliminación

### 17.6. Notas Importantes
- Los clientes pueden gestionar sus propias direcciones desde su perfil
- Solo admin y encargado pueden ver/editar direcciones de otros usuarios
- Los vendedores no tienen acceso a la gestión de direcciones
- Cada cliente puede tener múltiples direcciones, pero solo una predeterminada

---

## 18. Remitos Internos

### 18.1. ¿Qué son los Remitos Internos?
Son documentos que registran el traslado de mercadería entre sucursales del sistema (ej: de Mendoza a Depósito, de Salta a Depósito).

### 18.2. Acceder a Remitos Internos
1. **"Inventario"** → **"Remitos Internos"**
2. Se muestra la lista de remitos pendientes

### 18.3. ¿Cuándo se Genera un Remito Interno?
El sistema genera automáticamente un remito interno cuando:
- Hay stock en una sucursal (Mendoza, Salta)
- Ese stock necesita trasladarse al depósito central
- Se completa una orden que requiere consolidar stock

### 18.4. Información de un Remito
Cada remito muestra:
- **ID del remito**
- **Ubicación origen**: Desde dónde se envía (Mendoza, Salta)
- **Ubicación destino**: Hacia dónde va (generalmente Depósito)
- **Estado**: pendiente, en_transito, completado, cancelado
- **Items**: Lista de productos y cantidades a trasladar
- **Fecha de creación**
- **Notas**: Observaciones adicionales

### 18.5. Gestión de Remitos
- **Ver detalles**: Click en el remito para ver la información completa
- **Cambiar estado**: Marcar como "en tránsito" o "completado" según avance el traslado
- **Imprimir**: Generar documento para adjuntar al envío físico

### 18.6. Estados de Remitos
- **Pendiente**: Remito creado, esperando procesamiento
- **En tránsito**: Mercadería en camino entre ubicaciones
- **Completado**: Traslado finalizado, stock actualizado
- **Cancelado**: Remito anulado

---

## 19. Configuración de Imágenes (Cloudinary)

### 19.1. ¿Qué es Cloudinary?
Cloudinary es un servicio de almacenamiento de imágenes en la nube que permite:
- ✅ Almacenar imágenes de forma persistente
- ✅ Las imágenes no se pierden al hacer deploy
- ✅ CDN global para carga rápida en todo el mundo
- ✅ 25 GB de almacenamiento gratuito
- ✅ Transformaciones automáticas de imágenes

### 19.2. Configuración en Producción (Render)
Para configurar Cloudinary en el servidor de producción:

1. Ir al **Dashboard de Render**
2. Seleccionar el **servicio de backend (Go)**
3. Click en **"Environment"** en el menú lateral
4. Agregar las siguientes variables de entorno:
   ```
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```
5. Click en **"Save Changes"**
6. Render hará un redeploy automático

### 19.3. Verificar que Funciona
Al iniciar el backend, verás en los logs:
```
✅ Cloudinary inicializado correctamente
```

### 19.4. Subir Imágenes
Una vez configurado:
1. Ir al admin → Productos
2. Crear o editar un producto
3. Subir una imagen
4. La URL guardada será: `https://res.cloudinary.com/tu_cloud_name/image/upload/v.../products/product_1.jpg`

### 19.5. Migración de Imágenes Antiguas
Si tenías imágenes locales antes de configurar Cloudinary:
- Las imágenes locales se pierden en cada deploy
- Debes volver a subir las imágenes desde el admin
- Las nuevas imágenes se guardarán automáticamente en Cloudinary y persistirán

### 19.6. Notas Importantes
- Las credenciales de Cloudinary se configuran solo en el backend
- El frontend accede a las imágenes a través de las URLs públicas
- No es necesario configurar nada en el frontend
- El plan gratuito incluye 25 GB de almacenamiento y 25 GB de bandwidth por mes

---

## 20. Sistema de Migraciones Automáticas

### 20.1. ¿Qué son las Migraciones?
Las migraciones son cambios en la estructura de la base de datos (crear tablas, agregar columnas, etc.).

### 20.2. Sistema Automático
El sistema ahora ejecuta automáticamente todas las migraciones SQL al iniciar:
- ✅ Lee todos los archivos `.sql` de la carpeta `migrations/`
- ✅ Ejecuta solo las migraciones pendientes
- ✅ Registra cada migración en la tabla `migration_records`
- ✅ Evita ejecutar la misma migración dos veces
- ✅ Funciona tanto en desarrollo como en producción

### 20.3. Verificar Migraciones
Al iniciar el backend, verás en los logs:
```
✅ Sistema de migraciones inicializado
✅ Migraciones ejecutadas correctamente: 25 migraciones aplicadas
```

### 20.4. Agregar una Nueva Migración
Si necesitas agregar una migración:
1. Crear un archivo `.sql` en `migrations/`
2. Nombrar con formato: `YYYYMMDD_descripcion.sql`
3. Ejemplo: `20260202_add_new_table.sql`
4. Reiniciar el backend
5. El sistema detectará y aplicará la nueva migración automáticamente

### 20.5. Tabla migration_records
El sistema mantiene un registro de todas las migraciones ejecutadas:
- **filename**: Nombre del archivo de migración
- **executed_at**: Fecha y hora de ejecución
- **success**: Si la migración fue exitosa

---

## 📊 Resumen de Configuración

### Orden Recomendado de Configuración:
1. ✅ **Usuarios** (vendedoras con horarios)
2. ✅ **Categorías** y **Subcategorías**
3. ✅ **Colores**
4. ✅ **Tipos de Talle** y **Valores de Talle**
5. ✅ **Proveedores**
6. ✅ **Temporadas**
7. ✅ **Price Tiers**
8. ✅ **Cloudinary** (configurar en producción)
9. ✅ **Productos** (con imágenes en Cloudinary)
10. ✅ **Variantes** (por cada producto)
11. ✅ **Stock** (por cada variante)
12. ✅ **Home** (banners, videos, secciones)
13. ✅ **FAQs**
14. ✅ **Contacto**
15. ✅ **Direcciones de clientes** (se gestionan automáticamente)
16. ✅ **Remitos internos** (se generan automáticamente)

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
| Ver direcciones de clientes      |   ✔   |     ✔     |          | Propias |
| Gestionar remitos internos       |   ✔   |     ✔     |          |         |
| Configurar Cloudinary            |   ✔   |           |          |         |
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

### Configuraciones Avanzadas
- [ ] Cloudinary configurado en producción
- [ ] Migraciones ejecutadas correctamente
- [ ] Horarios de vendedores configurados (opcional)
- [ ] Sistema de direcciones funcionando
- [ ] Remitos internos verificados

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

### Las imágenes no se guardan o se pierden
**Problema**: Las imágenes se pierden después de hacer deploy  
**Solución**:
- Verificar que Cloudinary esté configurado correctamente en Render
- Revisar las variables de entorno: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Verificar en los logs del backend que diga "✅ Cloudinary inicializado correctamente"
- Volver a subir las imágenes desde el admin después de configurar Cloudinary

### Errores de migraciones en producción
**Problema**: Tabla no existe (seasons, addresses, etc.)  
**Solución**:
- El sistema ahora ejecuta migraciones automáticamente al iniciar
- Verificar en los logs que las migraciones se ejecutaron correctamente
- Si persiste el error, revisar la tabla migration_records en la base de datos
- Contactar al equipo de desarrollo si el problema continúa

---

## 📞 Soporte

Si tenés problemas durante la configuración:
1. Revisar logs del backend (terminal)
2. Revisar consola del navegador (F12)
3. Consultar documentación técnica
4. Contactar al equipo de desarrollo

---

**¡Sistema configurado y listo para usar!** 🎉
