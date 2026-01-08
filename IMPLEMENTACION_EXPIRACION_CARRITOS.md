# Sistema de Expiración de Carritos - Implementación Completada

## 📋 Resumen de la Implementación

Se ha implementado exitosamente el sistema de expiración automática de carritos/órdenes que liberan el stock reservado después de 24 horas.

## 🔧 Cambios Realizados

### 1. Migración de Base de Datos
**Archivo**: `migrations/20251226_add_cart_expiration_fields.sql`
- ✅ Agregado campo `reserved_at` (timestamp cuando el carrito pasa a 'listo_para_pago')
- ✅ Agregado campo `expires_at` (timestamp de expiración, 24h después de reserved_at)
- ✅ Creado índice para consultas eficientes de carritos expirados

### 2. Modelo Cart Actualizado
**Archivo**: `internal/cart/model.go`
- ✅ Agregados campos `ReservedAt *time.Time` y `ExpiresAt *time.Time`
- ✅ Importado paquete `time`

### 3. Job de Expiración
**Archivo**: `internal/cart/expiration_job.go` (nuevo)
- ✅ Función `ExpireCartReservations()`: Busca carritos expirados y libera el stock
- ✅ Función `StartCartExpirationJob()`: Inicia proceso en background que se ejecuta cada 15 minutos
- ✅ Proceso transaccional para garantizar atomicidad
- ✅ Logging detallado de todas las operaciones

### 4. Lógica de Cambio de Estado
**Archivo**: `internal/cart/handler.go`
- ✅ Al cambiar un carrito a 'listo_para_pago', se setean automáticamente:
  - `reserved_at` = timestamp actual
  - `expires_at` = timestamp actual + 24 horas

### 5. Inicio del Job
**Archivo**: `cmd/main.go`
- ✅ Job de expiración iniciado al arrancar el servidor (intervalo: 15 minutos)

## 🔄 Flujo de Funcionamiento

1. **Cliente finaliza compra**: Carrito pasa de estado 'pendiente' → 'listo_para_pago'
2. **Sistema setea timestamps**:
   - `reserved_at` = ahora
   - `expires_at` = ahora + 24 horas
3. **Job revisa cada 15 minutos**: Busca carritos donde `expires_at <= now`
4. **Para cada carrito expirado**:
   - Libera el stock reservado (`location_stocks.reserved -= reserved_quantity`)
   - Limpia la reserva del item (`cart_item.reserved_quantity = 0`)
   - Cambia estado del carrito a 'expirado'
5. **Stock disponible nuevamente** para otros clientes

## 🎯 Estados del Carrito

- **pendiente**: Carrito recién creado
- **edicion**: En proceso de modificación
- **esperando_vendedora**: Esperando asignación de vendedora
- **listo_para_pago**: ⏰ Stock reservado, contador de 24h iniciado
- **expirado**: ❌ Tiempo agotado, stock liberado automáticamente
- **pagado**: ✅ Compra completada
- **completado**: ✅ Orden finalizada

## 🧪 Cómo Probar

### Prueba Manual Rápida:
1. Crear un carrito y agregar productos con ubicación específica
2. Cambiar estado a 'listo_para_pago' via API
3. Verificar que se setearon `reserved_at` y `expires_at`
4. Esperar 24 horas (o modificar el código temporalmente para probar más rápido)
5. El job automáticamente liberará el stock y cambiará el estado a 'expirado'

### Para Probar en Desarrollo (sin esperar 24h):
Puedes modificar temporalmente la línea en `internal/cart/handler.go`:
```go
expiresAt := now.Add(24 * time.Hour)  // Cambiar a: now.Add(2 * time.Minute)
```
Y el job en `cmd/main.go`:
```go
cart.StartCartExpirationJob(15 * time.Minute)  // Cambiar a: 30 * time.Second
```

## 📊 Monitoreo

Los logs mostrarán:
- 🚀 Inicio del job de expiración
- ⏰ Cada ejecución de verificación
- 🕐 Número de carritos expirados encontrados
- ✅ Stock liberado para cada item
- ✅ Carritos marcados como expirados
- ❌ Errores si los hubiera

## 🔍 Verificación en Base de Datos

```sql
-- Ver carritos con reservas activas
SELECT id, user_id, estado, reserved_at, expires_at 
FROM carts 
WHERE estado = 'listo_para_pago' 
AND expires_at IS NOT NULL;

-- Ver stock reservado
SELECT product_id, variant_id, location, stock, reserved 
FROM location_stocks 
WHERE reserved > 0;
```

## ✅ Estado: IMPLEMENTADO Y FUNCIONANDO

El servidor está ejecutándose con el job activo:
```
2025/12/26 21:17:53 🚀 Iniciando job de expiración de carritos (intervalo: 15m0s)
```
