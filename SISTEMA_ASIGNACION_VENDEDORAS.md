# Sistema de Asignación de Vendedoras - Actualización

## Resumen de Cambios

Se ha actualizado el sistema de asignación de vendedoras con un enfoque más robusto y configurable:

### 1. **Horarios Laborales Centralizados**
- Los horarios laborales ahora se configuran a nivel de **tienda** (no por vendedora individual)
- Tabla `working_hours`: configuración por día de la semana
- Tabla `holidays`: gestión de feriados y días no laborables
- Interfaces de administración web para configurar horarios y feriados

### 2. **Tracking de Vendedoras Logueadas**
- Nuevo campo `is_online` en la tabla `users` para saber qué vendedoras están activas
- Campo `last_login` para registrar el último acceso
- Campo `last_activity` para tracking de actividad en tiempo real
- Sistema automático que marca offline a usuarios inactivos por más de 5 minutos

### 3. **Sistema Round Robin Mejorado**
La asignación ahora considera:
- ✅ Vendedoras **activas** (`active = true`)
- ✅ Vendedoras **logueadas** (`is_online = true`)
- ✅ **Horario laboral de la tienda** (no del usuario individual)
- ✅ **Días laborables configurables**
- ✅ **Feriados configurables**

### 4. **Asignación Diferida Inteligente**
Si un cliente solicita asignación fuera de horario o en día no laboral:
- La orden queda en estado `pendiente_asignacion`
- Se calcula y notifica el próximo horario laboral disponible
- Se notifica al cliente con la fecha/hora estimada de asignación
- Un job automático revisa cada 5 minutos y asigna cuando hay vendedoras disponibles

### 5. **Nuevos Endpoints**

**Gestión de Usuarios:**
```
POST /logout                  - Marcar usuario como offline al cerrar sesión
POST /user/activity           - Actualizar actividad del usuario (llamar cada 2-3 minutos desde frontend)
```

**Gestión de Horarios (Admin only):**
```
GET    /settings/working-hours      - Listar horarios laborales por día
PUT    /settings/working-hours/:id  - Actualizar horario de un día específico
GET    /settings/holidays           - Listar feriados
POST   /settings/holidays           - Crear nuevo feriado
DELETE /settings/holidays/:id       - Eliminar feriado
```

### 5. **Jobs en Background**

1. **Activity Monitor** (cada 2 minutos)
   - Marca como offline a usuarios sin actividad en los últimos 5 minutos

2. **Pending Order Assignment** (cada 5 minutos)
   - Asigna automáticamente órdenes pendientes cuando hay vendedoras disponibles
   - Solo en días laborales (L-V)
   - Solo en horario laboral de las vendedoras

## Aplicación de Cambios

### 1. Aplicar Migraciones SQL

```bash
# Si usas AUTO_MIGRATE=true, las migraciones se aplicarán automáticamente al iniciar
export AUTO_MIGRATE=true
go run cmd/main.go

# O aplicarlas manualmente con psql
psql "$DATABASE_URL" -f migrations/20260204_add_login_tracking_to_users.sql
psql "$DATABASE_URL" -f migrations/20260204_create_working_hours_and_holidays.sql
```

### 2. Reiniciar el Backend

```bash
go run cmd/main.go
```

Los jobs y configuración se iniciarán automáticamente.

## Integración con Frontend

### 1. Activity Tracking Automático

El tracking está implementado automáticamente en los layouts de Admin y Vendedora usando el hook `useActivityTracking()`.

**Ya implementado en:**
- `/admin/layout.tsx`
- `/vendedora/layout.tsx`

El hook actualiza la actividad cada 3 minutos automáticamente mientras el usuario esté en esas secciones.

### 2. Logout con Marcado Offline

El componente `LogoutButton` ya está actualizado para usar la función `logout()` que:
- Llama al endpoint `/logout` para marcar al usuario como offline
- Limpia el localStorage
- Redirige al login

**No se requiere ningún cambio adicional en el frontend existente.**

### 3. Configuración de Horarios Laborales

Nueva página de administración en `/admin/horarios` para:
- Configurar horarios por día de la semana
- Gestionar feriados y días no laborables
- Solo accesible para administradores

Para acceder: Panel Admin → Configuración → Horarios Laborales

## Flujo de Asignación Actualizado

### Caso 1: Horario Laboral con Vendedoras Online
1. Cliente solicita asignación desde el carrito
2. Sistema verifica: horario laboral de la tienda + vendedoras online
3. Asigna inmediatamente con round robin entre vendedoras disponibles
4. Notifica a vendedora y cliente

### Caso 2: Fuera de Horario o Sin Vendedoras
1. Cliente solicita asignación
2. Sistema detecta: fuera de horario laboral o sin vendedoras online
3. Crea orden en estado `pendiente_asignacion`
4. Calcula próximo horario laboral disponible
5. Notifica al cliente con fecha/hora estimada (ej: "Será asignada aprox. 05/02 09:00")
6. Job revisa cada 5 minutos y asigna cuando sea posible

### Caso 3: Día Feriado
1. Cliente solicita durante un feriado configurado
2. Sistema calcula siguiente día laboral
3. Orden queda pendiente hasta el próximo día hábil
4. El próximo día hábil, cuando una vendedora se loguea, el job la asigna automáticamente

## Configuración Inicial

### 1. Horarios Laborales por Defecto

La migración SQL crea automáticamente:
- **Lunes a Viernes**: 09:00 - 18:00
- **Sábado y Domingo**: No laborables

Puedes modificarlos desde `/admin/horarios`.

### 2. Configurar Feriados

Desde `/admin/horarios` puedes agregar:
- Fechas específicas (Navidad, Año Nuevo, etc.)
- Nombres descriptivos
- Descripción opcional

Ejemplo:
```
Fecha: 2026-12-25
Nombre: Navidad
Descripción: Feriado nacional
```

## Monitoreo

Ver logs del servidor para verificar:
```
✅ Activity monitor iniciado: marcará usuarios inactivos como offline
✅ Job de asignación de órdenes pendientes iniciado
📊 Marcados 2 usuarios como offline por inactividad
📊 Procesando 3 órdenes pendientes con 2 vendedoras disponibles
📊 Orden #123 asignada a vendedora María (ID: 5)
```

## Archivos Modificados/Creados

### Backend
- `migrations/20260204_add_login_tracking_to_users.sql` - Campos de tracking de actividad
- `migrations/20260204_create_working_hours_and_holidays.sql` - Tablas de horarios y feriados
- `internal/user/model.go` - Agregados campos LastLogin, IsOnline, LastActivity
- `internal/user/handler.go` - Actualizado Login, agregados Logout y UpdateActivity
- `internal/user/activity_monitor.go` - Job para marcar usuarios inactivos
- `internal/settings/working_hours_model.go` - Modelos WorkingHours y Holiday
- `internal/settings/working_hours_handler.go` - Handlers y helpers para horarios
- `internal/order/handler.go` - Mejorada lógica de SubmitCartForAssignment
- `internal/order/pending_assignment_job.go` - Job para asignar órdenes pendientes
- `routes/router.go` - Agregadas rutas para logout, activity y horarios
- `cmd/main.go` - Inicialización de jobs y migraciones

### Frontend
- `front/src/app/admin/horarios/page.tsx` - Página de configuración de horarios
- `front/src/hooks/useActivityTracking.ts` - Hook y función de logout
- `front/src/app/admin/layout.tsx` - Integrado useActivityTracking
- `front/src/app/vendedora/layout.tsx` - Integrado useActivityTracking
- `front/src/components/LogoutButton.tsx` - Actualizado para usar logout()
- `front/src/components/AdminSidebar.tsx` - Agregado enlace a horarios

## Testing

### 1. Test de Asignación en Horario
```bash
# Como cliente con token
curl -X POST http://localhost:8080/cart/1/submit-for-assignment \
  -H "Authorization: Bearer $TOKEN"

# Verificar que se asigna inmediatamente si hay vendedoras online
```

### 2. Test de Asignación Fuera de Horario
```bash
# Desloguear todas las vendedoras o hacer el test fuera de horario
# Verificar que la orden queda como pendiente_asignacion
```

### 3. Test de Activity Monitor
```bash
# Loguear una vendedora
# Esperar 6 minutos sin actividad
# Verificar que is_online = false
```

## Notas Importantes

- Las vendedoras deben estar logueadas para recibir asignaciones
- El sistema NO asigna en fines de semana (sábado/domingo)
- La inactividad de 5 minutos marca al usuario como offline
- Los clientes pueden solicitar asignación 24/7, pero se procesará en horario laboral
