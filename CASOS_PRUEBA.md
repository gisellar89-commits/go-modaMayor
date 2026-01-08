# Casos de Prueba - Sistema go-modaMayor

## 📋 Información General
- **Fecha**: 26 de diciembre de 2025
- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3000
- **Base de datos**: PostgreSQL (modamayor)

---

## 👤 Usuarios de Prueba

```
CLIENTE 1:
- Email: cliente1@cliente.com
- Password: cliente123
- ID: 5
- Role: cliente

VENDEDORA 1:
- Email: vendedor1@modamayor.com
- Password: vendedor123
- ID: 3
- Role: vendedor

VENDEDORA 2:
- Email: vendedor2@modamayor.com
- Password: vendedor123
- ID: 4
- Role: vendedor

ADMIN:
- Email: admin@modamayor.com
- Password: admin123
- ID: 2
- Role: admin
```

---

## 🔓 FASE 1: Usuario NO Logueado

### TC-001: Navegación pública
**Objetivo**: Verificar que el usuario puede navegar sin estar logueado

**Pasos**:
1. Abrir http://localhost:3000
2. Verificar que aparece el home con:
   - Topbar con información de contacto
   - Banners principales
   - Videos (si están configurados)
   - Secciones de productos destacados
   - Menú de categorías
3. Click en "Todos los Productos"
4. Verificar que se muestran los productos con:
   - Imagen
   - Nombre
   - Precio
   - Código

**Resultado esperado**: ✅ Se puede navegar sin problemas

---

### TC-002: Ver detalle de producto sin login
**Objetivo**: Verificar que se puede ver información del producto

**Pasos**:
1. Desde la lista de productos, click en cualquier producto
2. Verificar que se muestra:
   - Imágenes del producto
   - Nombre y código
   - Descripción
   - Precio según tier actual (Minorista por defecto)
   - Selector de talle
   - Selector de color
   - Información de stock
3. Intentar agregar al carrito
4. Verificar que redirige a login

**Resultado esperado**: ✅ Muestra detalle pero solicita login para agregar al carrito

---

### TC-003: Registro de nuevo cliente
**Objetivo**: Crear una cuenta nueva

**Pasos**:
1. Click en "Iniciar Sesión" → "Registrarse"
2. Completar formulario:
   - Nombre: "Cliente Test"
   - Email: "clientetest@test.com"
   - Teléfono: "1234567890"
   - Password: "test123"
   - Confirmar password: "test123"
3. Click en "Registrarse"
4. Verificar que redirige al home y muestra mensaje de éxito
5. Verificar que en el header aparece el nombre del usuario

**Resultado esperado**: ✅ Usuario registrado y logueado automáticamente

---

## 🛒 FASE 2: Cliente Logueado

### TC-004: Agregar productos al carrito
**Objetivo**: Agregar productos y verificar cálculo de precios por cantidad

**Pasos**:
1. Login como cliente1@cliente.com
2. Buscar "Campera" en productos
3. Seleccionar "Campera Matelaseé"
4. Elegir talle "M" y color "Negro"
5. Cantidad: 2
6. Click "Agregar al carrito"
7. Verificar mensaje de éxito
8. Click en el ícono del carrito (esquina superior derecha)
9. Verificar que muestra:
   - 2 prendas en el carrito
   - Precio: Minorista (1x costo) porque son solo 2 prendas
10. Agregar 5 unidades más del mismo producto (u otro)
11. Verificar que ahora muestra:
    - 7 prendas total
    - Precio: Mayorista (2.5x costo) porque superó 6 prendas

**Resultado esperado**: 
✅ Los precios se actualizan según la cantidad total
- 0-5 prendas: Minorista (1x)
- 6-7 prendas: Mayorista (2.5x)
- 8-11 prendas: Descuento1 (2.25x)
- 12+ prendas: Descuento2 (1.75x)

---

### TC-005: Modificar cantidades en el carrito
**Objetivo**: Editar cantidades y verificar recalculo de precios

**Pasos**:
1. En el carrito, cambiar la cantidad de un producto
2. Verificar que:
   - Se actualiza el subtotal del producto
   - Se recalcula el tier de precio si cambia la cantidad total
   - Se actualiza el total general
3. Eliminar un producto (X roja)
4. Verificar que se elimina y recalcula todo

**Resultado esperado**: ✅ Cálculos correctos y actualizaciones en tiempo real

---

### TC-006: Solicitar ayuda de vendedora
**Objetivo**: Cliente solicita asistencia y se crea la orden

**Pasos**:
1. Con productos en el carrito, click en "Solicitar Ayuda de Vendedora"
2. Confirmar la solicitud
3. Verificar mensaje: "Solicitud enviada. Una vendedora será asignada pronto"
4. Verificar que el estado del carrito cambió a "esperando_vendedora" o "edicion" (si hay vendedora disponible)
5. **IMPORTANTE**: Anotar el ID del carrito para verificar después

**Resultado esperado**: 
✅ Se crea una ORDEN inmediatamente con:
- cart_id: vinculado al carrito
- status: "asignada" (si hay vendedora) o "pendiente_asignacion" (si no hay)
- assigned_to: ID de vendedora (si se asignó automáticamente)

---

### TC-007: Cliente consulta FAQs
**Objetivo**: Verificar información de ayuda

**Pasos**:
1. Click en "Preguntas Frecuentes" en el footer
2. Verificar que se muestran las FAQs configuradas
3. Click en cada pregunta para expandir/contraer
4. Verificar que las respuestas se muestran correctamente

**Resultado esperado**: ✅ FAQs funcionan correctamente

---

## 👩‍💼 FASE 3: Vendedora Logueada

### TC-008: Login como vendedora
**Objetivo**: Acceder al panel de vendedora

**Pasos**:
1. Logout del cliente
2. Login como vendedor1@modamayor.com
3. Verificar que redirige a /vendedora/carritos
4. Verificar que aparece "Carritos asignados" como título

**Resultado esperado**: ✅ Acceso correcto al panel de vendedora

---

### TC-009: Ver carritos asignados
**Objetivo**: Verificar que la vendedora ve solo sus carritos

**Pasos**:
1. En el panel de vendedora, verificar que aparecen los carritos donde:
   - vendedor_id = 3 (ID de vendedor1)
   - estado = "edicion", "listo_para_pago", "pagado"
2. Verificar que NO aparecen carritos de otras vendedoras
3. Cada carrito debe mostrar:
   - ID del carrito
   - Estado actual
   - Datos del cliente (nombre, email, teléfono)
   - Fecha de creación
   - Cantidad de artículos
   - Botones: "Ver" y "Editar"

**Resultado esperado**: ✅ Solo ve carritos asignados a ella

---

### TC-010: Editar carrito del cliente
**Objetivo**: Vendedora puede modificar el carrito

**Pasos**:
1. Click en "Editar" en uno de los carritos
2. Verificar que se muestra:
   - Tabla con productos actuales (thumbnail, código, variante, precio, cantidad)
   - **Indicador de tier actual**: "📊 Tier actual: Mayorista - 7 prendas en el carrito - Precio: 2.5x costo"
   - **Indicador de progreso**: "🎯 ¡4 prendas más para Descuento 1!"
   - Buscador de productos con autocomplete
   - Controles de estado del carrito
3. Buscar un producto en el buscador (ej: "remera")
4. Seleccionar producto, variante, cantidad
5. Click "Agregar"
6. Verificar que:
   - El producto se agrega a la tabla
   - Se recalcula el tier si cambia la cantidad total
   - Los indicadores se actualizan
7. Cambiar cantidad de un producto existente
8. Verificar recalculo inmediato

**Resultado esperado**: ✅ Vendedora puede editar el carrito sin problemas

---

### TC-011: Cambiar estados del carrito
**Objetivo**: Vendedora avanza el carrito por los estados

**Pasos**:
1. Con el carrito en estado "edicion", click "Listo para pago"
2. Verificar que:
   - Estado cambia a "listo_para_pago"
   - Los controles de agregar productos se deshabilitan
   - Aparece mensaje: "Este carrito está en estado listo_para_pago y no puede ser editado"
   - Aparece botón "Habilitar edición" (por si necesita volver atrás)
3. Click "Marcar como pagado"
4. Verificar que estado cambia a "pagado"
5. Click "Finalizar venta"
6. **CRÍTICO**: Verificar que:
   - Stock se descuenta de location_stocks
   - Orden existente se actualiza con items y total
   - Estado de orden cambia a "finalizada"
   - Estado de carrito cambia a "finalizado"
   - Items del carrito se vacían

**Resultado esperado**: 
✅ Flujo completo funciona:
- Edición → Listo para pago → Pagado → Finalizado
- Stock se descuenta solo al finalizar
- Orden se actualiza correctamente

---

### TC-012: Verificar descuento de stock
**Objetivo**: Confirmar que el stock se descontó correctamente

**Pasos**:
1. ANTES de finalizar, anotar el stock actual de un producto:
   - Panel admin → Inventario → buscar el producto → ver stock
2. Finalizar la venta (TC-011 paso 5)
3. Volver a verificar el stock del mismo producto
4. Calcular: stock_final = stock_inicial - cantidad_vendida

**Resultado esperado**: ✅ El stock se descontó correctamente

---

## 👨‍💼 FASE 4: Admin Logueado

### TC-013: Login como admin y vista general
**Objetivo**: Acceder al panel de administración

**Pasos**:
1. Logout de vendedora
2. Login como admin@modamayor.com
3. Verificar que redirige a /admin (dashboard)
4. Verificar que aparecen estadísticas:
   - Total Órdenes: cuenta todas las órdenes
   - Ventas Finalizadas: suma solo órdenes con status="finalizada"
   - En Proceso: cuenta órdenes en progreso
   - Finalizadas: cuenta órdenes finalizadas
5. Verificar tabla de "Órdenes Recientes" (últimas 5)
6. Verificar "Productos con Bajo Stock"
7. Verificar "Productos Más Vendidos"

**Resultado esperado**: ✅ Dashboard muestra información correcta

---

### TC-014: Gestión de órdenes - Ver todas
**Objetivo**: Admin ve todas las órdenes del sistema

**Pasos**:
1. Click en "Ventas" en el menú lateral
2. Verificar que aparecen TODAS las órdenes (de todos los clientes)
3. Verificar columnas:
   - **Orden ID**: #1, #2, #3, #4...
   - **Carrito ID**: Debe mostrar el ID del carrito vinculado (o "-" si es legacy)
   - Cliente: nombre o email
   - Estado: creada, procesando, enviada, finalizada, cancelada
   - Total: monto con 2 decimales
   - Fecha: fecha y hora de creación
   - Acciones: dropdown de estados + botón "Ver"
4. Buscar por ID o cliente
5. Filtrar por estado usando el dropdown superior

**Resultado esperado**: ✅ Admin ve todas las órdenes con vinculación a carritos

---

### TC-015: Cambiar estado de orden
**Objetivo**: Admin puede modificar el estado de cualquier orden

**Pasos**:
1. Seleccionar una orden en estado "asignada"
2. Cambiar a "procesando" usando el dropdown
3. Verificar que cambia sin confirmación
4. Cambiar a "finalizada"
5. Verificar que aparece diálogo de confirmación
6. Confirmar
7. Verificar que:
   - Estado cambia a "finalizada"
   - Se actualiza el contador de "Ventas Finalizadas" en el dashboard
8. Cambiar otra orden a "cancelada"
9. Verificar confirmación
10. Confirmar y verificar cambio

**Resultado esperado**: 
✅ Admin puede cambiar estados
✅ Estados críticos (finalizada, cancelada) piden confirmación

---

### TC-016: Cancelar una orden
**Objetivo**: Marcar una orden como cancelada

**Pasos**:
1. Seleccionar una orden activa
2. Cambiar estado a "cancelada"
3. Confirmar en el diálogo
4. Verificar que:
   - Estado cambia a "cancelada"
   - NO cuenta para "Ventas Finalizadas"
   - Aparece en el filtro de "cancelada"

**Resultado esperado**: ✅ Orden cancelada correctamente y no cuenta como venta

---

### TC-017: Asignar vendedora manualmente
**Objetivo**: Admin asigna una orden pendiente a una vendedora

**Pasos**:
1. Crear una orden en estado "pendiente_asignacion" (o usar TC-006)
2. En el panel de órdenes, verificar que aparece botón "Asignar"
3. Click en "Asignar"
4. Seleccionar vendedora del dropdown
5. Click "Confirmar"
6. Verificar que:
   - Estado cambia a "asignada"
   - assigned_to se actualiza con el ID de la vendedora
   - La vendedora puede ver el carrito en su panel

**Resultado esperado**: ✅ Asignación manual funciona correctamente

---

### TC-018: Gestión de productos
**Objetivo**: Admin puede crear/editar productos

**Pasos**:
1. Click en "Productos" en el menú lateral
2. Click "Nuevo Producto"
3. Completar formulario:
   - Nombre: "Remera Test"
   - Código: "REM-TEST-001"
   - Descripción: "Remera de prueba"
   - Categoría: seleccionar una
   - Precio Costo: 1000
   - Tipo de talle: seleccionar uno
4. Click "Crear Producto"
5. Verificar que aparece en la lista
6. Click en el producto → "Generar Variantes"
7. Seleccionar talles y colores
8. Click "Generar"
9. Verificar que se crearon las variantes
10. Para cada variante, click "Gestionar Stock"
11. Ingresar stock: 10 unidades
12. Guardar

**Resultado esperado**: ✅ Producto creado con variantes y stock

---

### TC-019: Configuración de price tiers
**Objetivo**: Admin configura los niveles de precio

**Pasos**:
1. Click en "Configuración" → "Price Tiers"
2. Verificar que aparecen los 4 tiers actuales:
   - Minorista: 0+ prendas, 1x costo
   - Mayorista: 6+ prendas, 2.5x costo
   - Descuento1: 8+ prendas, 2.25x costo
   - Descuento2: 12+ prendas, 1.75x costo
3. Click "Editar" en uno de los tiers
4. Cambiar valores (ej: Mayorista de 6 a 5 prendas)
5. Guardar
6. Verificar que se actualiza

**Resultado esperado**: ✅ Price tiers configurables

---

### TC-020: Gestión de usuarios
**Objetivo**: Admin puede crear vendedoras

**Pasos**:
1. Click en "Usuarios"
2. Click "Nuevo Usuario"
3. Completar:
   - Nombre: "Vendedora Test"
   - Email: "vendedoratest@test.com"
   - Role: vendedor
   - Password: "vendedor123"
4. Crear
5. Verificar que aparece en la lista con role="vendedor"
6. Intentar login con esas credenciales
7. Verificar que accede al panel de vendedora

**Resultado esperado**: ✅ Nueva vendedora creada y funcional

---

## 🔄 FASE 5: Flujo Completo End-to-End

### TC-021: Flujo completo de venta
**Objetivo**: Probar el ciclo completo desde cliente hasta finalización

**Preparación**:
- Usuario cliente nuevo o limpiar carrito existente
- Vendedora activa disponible
- Productos con stock suficiente

**Pasos**:
1. **CLIENTE**: Login como cliente
2. Agregar 8 productos al carrito (para probar tier Descuento1)
3. Verificar que el precio unitario es 2.25x el costo
4. Click "Solicitar Ayuda de Vendedora"
5. **BACKEND VERIFICA**: Se crea orden inmediatamente
6. Logout del cliente

7. **VENDEDORA**: Login como vendedor1
8. Verificar que el carrito aparece en "Carritos asignados"
9. Click "Editar" en el carrito
10. Verificar indicadores:
    - "📊 Tier actual: Descuento 1"
    - "🎯 ¡4 prendas más para Precio Final!"
11. Agregar 4 productos más (total 12, para alcanzar tier Descuento2)
12. Verificar que el tier cambia a "Precio Final (1.75x)"
13. Click "Listo para pago"
14. Click "Marcar como pagado"
15. Click "Finalizar venta"
16. Verificar mensaje de éxito
17. Logout de vendedora

18. **ADMIN**: Login como admin
19. Click en "Ventas"
20. Buscar la orden recién creada
21. Verificar:
    - Orden ID: [número]
    - Carrito ID: [debe mostrar el ID del carrito]
    - Estado: "finalizada"
    - Total: correcto con 12 prendas a 1.75x
22. Click "Ver" para ver detalle
23. Verificar items y total

24. **VERIFICACIÓN DE STOCK**: Click en "Inventario"
25. Buscar uno de los productos vendidos
26. Verificar que el stock se descontó correctamente

**Resultado esperado**: 
✅ Flujo completo funciona:
1. Cliente solicita → Orden se crea inmediatamente
2. Vendedora edita → Precios se calculan correctamente
3. Vendedora finaliza → Stock se descuenta
4. Admin ve → Orden vinculada a carrito correctamente
5. Inventario actualizado

**Datos a anotar durante la prueba**:
- Carrito ID: _______
- Orden ID: _______
- Stock inicial producto 1: _______
- Stock final producto 1: _______
- Total orden: $_______

---

## 🐛 FASE 6: Casos de Borde y Errores

### TC-022: Stock insuficiente
**Objetivo**: Verificar manejo de stock insuficiente

**Pasos**:
1. Como admin, reducir stock de un producto a 2 unidades
2. Como cliente, intentar agregar 5 unidades al carrito
3. Verificar mensaje de error
4. Como vendedora, intentar finalizar venta con más productos que stock
5. Verificar que no permite finalizar

**Resultado esperado**: ✅ Sistema previene venta sin stock

---

### TC-023: Carrito sin productos
**Objetivo**: No permitir solicitar vendedora con carrito vacío

**Pasos**:
1. Login como cliente con carrito vacío
2. Intentar "Solicitar Ayuda de Vendedora"
3. Verificar que no permite o muestra error

**Resultado esperado**: ✅ Requiere al menos 1 producto

---

### TC-024: Doble finalización
**Objetivo**: Prevenir finalizar un carrito ya finalizado

**Pasos**:
1. Como vendedora, intentar editar un carrito en estado "finalizado"
2. Verificar que no permite edición
3. Verificar mensaje informativo

**Resultado esperado**: ✅ No permite modificar carritos finalizados

---

### TC-025: Acceso no autorizado
**Objetivo**: Verificar permisos entre roles

**Pasos**:
1. Login como cliente
2. Intentar acceder a /admin
3. Verificar que redirige o muestra error 403
4. Login como vendedora
5. Intentar acceder a /admin
6. Verificar que no permite
7. Intentar editar carrito de otra vendedora
8. Verificar que no permite

**Resultado esperado**: ✅ Permisos funcionan correctamente

---

## ✅ Checklist de Pruebas

### Funcionalidades Básicas
- [ ] TC-001: Navegación pública
- [ ] TC-002: Ver detalle de producto sin login
- [ ] TC-003: Registro de nuevo cliente

### Cliente
- [ ] TC-004: Agregar productos al carrito
- [ ] TC-005: Modificar cantidades
- [ ] TC-006: Solicitar vendedora (CRÍTICO - verifica creación de orden)
- [ ] TC-007: Consultar FAQs

### Vendedora
- [ ] TC-008: Login como vendedora
- [ ] TC-009: Ver carritos asignados
- [ ] TC-010: Editar carrito
- [ ] TC-011: Cambiar estados (CRÍTICO - verifica actualización de orden)
- [ ] TC-012: Verificar descuento de stock

### Admin
- [ ] TC-013: Login y dashboard
- [ ] TC-014: Ver todas las órdenes (CRÍTICO - verifica cart_id)
- [ ] TC-015: Cambiar estado de orden
- [ ] TC-016: Cancelar orden
- [ ] TC-017: Asignar vendedora manualmente
- [ ] TC-018: Gestión de productos
- [ ] TC-019: Configuración de price tiers
- [ ] TC-020: Gestión de usuarios

### Flujo Completo
- [ ] TC-021: End-to-End completo (CRÍTICO - valida todo el sistema)

### Casos de Borde
- [ ] TC-022: Stock insuficiente
- [ ] TC-023: Carrito vacío
- [ ] TC-024: Doble finalización
- [ ] TC-025: Acceso no autorizado

---

## 📝 Notas Importantes

### Verificaciones Críticas:
1. **Vinculación Carrito-Orden**: Verificar que el cart_id aparece en la tabla de órdenes del admin
2. **Creación Temprana de Orden**: La orden se crea cuando cliente solicita vendedora, NO cuando se finaliza
3. **Actualización de Orden**: Al finalizar, la orden existente se actualiza (no se crea una nueva)
4. **Descuento de Stock**: Solo ocurre al finalizar (estado "finalizado")
5. **Price Tiers**: Los precios se recalculan dinámicamente según la cantidad total

### Datos de Prueba Útiles:
- Productos existentes: Campera Matelaseé, Remera, Musculosa
- Talles: S, M, L, XL
- Colores: Negro, Blanco, Gris, Azul

### Reportar Bugs:
Para cada bug encontrado, documentar:
- TC donde ocurrió
- Pasos exactos para reproducir
- Resultado esperado vs resultado actual
- Screenshots si aplica
- Logs del backend (en la terminal)

---

## 🎯 Criterios de Éxito

### Sistema considera exitoso si:
✅ Cliente puede comprar sin problemas
✅ Vendedora puede asistir y finalizar ventas
✅ Admin puede gestionar todo el sistema
✅ Stock se mantiene consistente
✅ Price tiers funcionan correctamente
✅ Órdenes están vinculadas a carritos
✅ No hay errores 500 en el backend
✅ No hay errores en la consola del navegador
