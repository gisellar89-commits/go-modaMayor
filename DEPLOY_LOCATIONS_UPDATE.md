# 📦 Deploy: Sistema de Ubicaciones

## ⚠️ Cambios Importantes para Producción

Este update introduce el **sistema de gestión de ubicaciones dinámico** que reemplaza las ubicaciones hardcodeadas en variables de entorno.

---

## 🎯 Checklist de Deploy

### ✅ 1. Backend (Go)

**Archivos nuevos:**
- `internal/location/model.go` - Modelo de ubicaciones
- `internal/location/handler.go` - Handlers CRUD
- `migrations/20260204_create_locations_table.sql` - Nueva migración

**Archivos modificados:**
- `routes/router.go` - Nuevas rutas de ubicaciones

**Rutas nuevas:**
```go
GET    /locations                  (público - ubicaciones activas)
GET    /admin/locations            (admin - todas)
POST   /admin/locations            (admin - crear)
PUT    /admin/locations/:id        (admin - editar)
DELETE /admin/locations/:id        (admin - eliminar con validación)
```

### ✅ 2. Frontend (Next.js)

**Archivos nuevos:**
- `front/src/app/admin/ubicaciones/page.tsx` - Página admin CRUD

**Archivos modificados:**
- `front/src/components/AddStockModal.tsx` - Usa API
- `front/src/app/admin/productos/[id]/stocks/page.tsx` - Usa API
- `front/src/components/AdminSidebar.tsx` - Nuevo enlace "Ubicaciones"

**Variables de entorno eliminadas:**
- ❌ `NEXT_PUBLIC_LOCATIONS` - Ya no se usa

### ✅ 3. Base de Datos

**Nueva migración:**
```sql
migrations/20260204_create_locations_table.sql
```

**Tablas creadas:**
- `locations` - Ubicaciones de stock

**Datos iniciales:**
- `deposito` - Depósito Central
- `mendoza` - Local Mendoza
- `salta` - Local Salta

---

## 🚀 Pasos para Deploy en Producción

### Paso 1: Aplicar la Migración

**Opción A: Desde tu máquina local (recomendado)**

```bash
# Conectar a la base de datos de producción
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" \
  -f migrations/20260204_create_locations_table.sql
```

**Verificar:**
```sql
-- Conectar a la DB de producción
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

-- Verificar que la tabla existe
\dt locations

-- Verificar los datos iniciales
SELECT * FROM locations ORDER BY display_order;

-- Deberías ver:
-- ID | code     | name             | description                           | active | display_order
-- 1  | deposito | Depósito Central | Ubicación principal de almacenamiento | t      | 1
-- 2  | mendoza  | Local Mendoza    | Sucursal ubicada en calle Mendoza     | t      | 2
-- 3  | salta    | Local Salta      | Sucursal ubicada en calle Salta       | t      | 3
```

**Opción B: Desde Render Shell (si usas Render)**

1. Ir a tu servicio de PostgreSQL en Render
2. Connect → External Connection
3. Copiar la URL externa
4. Ejecutar desde terminal local:

```bash
cd /Users/gisellaromano/Documents/go-modaMayor
psql "TU_URL_EXTERNA_RENDER" -f migrations/20260204_create_locations_table.sql
```

### Paso 2: Deploy del Backend

**Si usas Render:**

1. Push a GitHub:
```bash
git add .
git commit -m "feat: sistema de gestión de ubicaciones dinámico"
git push origin main
```

2. Render detectará los cambios y hará deploy automático
3. Esperar a que el deploy termine (5-10 minutos)
4. Verificar logs en Render Dashboard

**Verificar que funcionó:**

```bash
# Probar el endpoint público
curl https://tu-backend.onrender.com/locations?active=true

# Debería devolver:
[
  {"ID":1,"code":"deposito","name":"Depósito Central",...},
  {"ID":2,"code":"mendoza","name":"Local Mendoza",...},
  {"ID":3,"code":"salta","name":"Local Salta",...}
]
```

### Paso 3: Deploy del Frontend

**Si usas Render/Vercel/Netlify:**

1. **NO necesitas cambiar variables de entorno** - ya no se usa `NEXT_PUBLIC_LOCATIONS`

2. Push a GitHub (si no lo hiciste):
```bash
git push origin main
```

3. El frontend se rebuildeará automáticamente

4. Verificar que `NEXT_PUBLIC_API_URL` apunte a tu backend de producción:
```bash
# En Render/Vercel/Netlify, verificar variable:
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```

### Paso 4: Verificación Post-Deploy

**1. Verificar endpoint público:**
```bash
curl https://tu-api.com/locations?active=true
```

**2. Login como admin y verificar la página:**
- Ir a: `https://tu-frontend.com/admin`
- Login como admin
- Sidebar → Catálogo → **Ubicaciones** (nuevo enlace)
- Deberías ver las 3 ubicaciones por defecto

**3. Probar CRUD:**
- ✅ Crear nueva ubicación
- ✅ Editar ubicación existente
- ✅ Desactivar ubicación
- ❌ Intentar eliminar ubicación con stock (debe fallar con mensaje de error)

**4. Verificar componentes de stock:**
- Ir a un producto
- Click en "Agregar Stock"
- El dropdown de ubicaciones debe mostrar:
  - ✅ "Depósito Central"
  - ✅ "Local Mendoza"
  - ✅ "Local Salta"

---

## 🔍 Validaciones Implementadas

### No se puede eliminar ubicación con stock

**Regla de negocio:**
```
Si location_stocks tiene registros con:
  - location = [código_ubicación]
  - Y (stock > 0 OR reserved > 0)
  
Entonces: No permitir eliminación
Mensaje: "No se puede eliminar la ubicación porque tiene productos en stock. 
         Por favor, transfiera o elimine el stock primero."
```

**Ejemplo de cómo funciona:**

```bash
# Intentar eliminar ubicación con stock
curl -X DELETE https://api.com/admin/locations/1 \
  -H "Authorization: Bearer TOKEN"

# Respuesta si tiene stock:
{
  "error": "No se puede eliminar la ubicación porque tiene productos en stock. Por favor, transfiera o elimine el stock primero."
}

# Respuesta si NO tiene stock:
{
  "message": "Ubicación eliminada correctamente"
}
```

---

## 🆘 Troubleshooting

### Error: "404 page not found" en /locations

**Causa:** El backend no tiene las rutas registradas o no se reinició.

**Solución:**
1. Verificar que `routes/router.go` incluya:
```go
import "go-modaMayor/internal/location"
...
r.GET("/locations", location.ListLocations)
```

2. Reiniciar el servidor backend en producción

### Error: "relation 'locations' does not exist"

**Causa:** La migración no se aplicó.

**Solución:**
```bash
# Aplicar la migración
psql "URL_PRODUCCION" -f migrations/20260204_create_locations_table.sql
```

### Frontend muestra "Cargando ubicaciones..." pero nunca carga

**Causa:** Frontend no puede conectar al backend o CORS.

**Solución:**
1. Verificar `NEXT_PUBLIC_API_URL` en variables de entorno del frontend
2. Verificar CORS en backend (`routes/router.go`):
```go
AllowOrigins: []string{
  "http://localhost:3000",
  "https://tu-frontend.onrender.com", // ← Agregar tu dominio
},
```

### Admin no ve el enlace "Ubicaciones"

**Causa:** El usuario no tiene rol admin o encargado.

**Solución:**
```sql
-- Verificar rol del usuario
SELECT id, email, role FROM users WHERE email = 'tu@email.com';

-- Cambiar a admin si es necesario
UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
```

---

## 📝 Notas Importantes

### Compatibilidad Backward

✅ **Totalmente compatible:** El sistema sigue funcionando sin ubicaciones en caso de error.
- Los componentes tienen fallbacks para estados de carga y vacíos
- No rompe funcionalidad existente

### Variables de Entorno

❌ **Eliminar de .env (local y producción):**
```bash
# Ya no se usa:
NEXT_PUBLIC_LOCATIONS=deposito,mendoza,salta
```

✅ **Mantener:**
```bash
# Backend
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
# ... resto de variables

# Frontend
NEXT_PUBLIC_API_URL=https://tu-backend.com
```

### Datos Iniciales

Las ubicaciones por defecto se crean automáticamente con la migración:
- `deposito` - Depósito Central
- `mendoza` - Local Mendoza
- `salta` - Local Salta

**Para agregar más ubicaciones:** Usar la interfaz admin `/admin/ubicaciones`

---

## ✅ Checklist Final

Antes de considerar el deploy completo:

- [ ] Migración aplicada en producción
- [ ] Backend deployado con nuevas rutas
- [ ] Frontend deployado sin `NEXT_PUBLIC_LOCATIONS`
- [ ] Endpoint `/locations?active=true` responde correctamente
- [ ] Login admin → Ubicaciones visible en sidebar
- [ ] CRUD de ubicaciones funciona
- [ ] Validación de eliminación funciona (no permite borrar con stock)
- [ ] Componentes de stock cargan ubicaciones desde API
- [ ] No hay errores en logs del backend
- [ ] No hay errores en consola del frontend

---

## 📞 Soporte

Si hay problemas durante el deploy:

1. **Revisar logs del backend:**
   - Render: Dashboard → Logs
   - Local: Terminal donde corre `go run cmd/main.go`

2. **Revisar consola del navegador:**
   - F12 → Console
   - Buscar errores de red (400, 404, 500)

3. **Verificar conectividad BD:**
   ```bash
   psql "URL_PRODUCCION" -c "SELECT * FROM locations;"
   ```

4. **Rollback si es necesario:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

**Fecha de creación:** 4 de febrero de 2026  
**Versión del sistema:** 2.0 (con ubicaciones dinámicas)
