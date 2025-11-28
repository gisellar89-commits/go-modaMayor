# Sistema de Autenticación y Protección de Rutas

## Resumen

Este documento explica cómo está implementado el sistema de autenticación y protección de rutas en la aplicación.

## Componentes del Sistema

### 1. Backend (Go + JWT)

**Middleware de Autenticación:**
- `AuthMiddleware()`: Verifica que el token JWT sea válido
- `RequireRole(role)`: Requiere un rol específico (ej: "admin")
- `RequireAnyRole(roles...)`: Requiere uno de varios roles (ej: "admin" o "encargado")

**Ejemplo de uso en rutas:**
```go
r.GET("/settings/banners", 
    user.AuthMiddleware(), 
    user.RequireAnyRole("admin", "encargado"), 
    handler.ListBanners
)
```

### 2. Frontend (Next.js + React)

#### AuthContext (`contexts/AuthContext.tsx`)

Provee el estado de autenticación global:

```typescript
const auth = useAuth();
// auth.user - Usuario actual (null si no está logueado)
// auth.loading - true mientras se verifica la sesión
// auth.logout() - Función para cerrar sesión
// auth.refreshUser() - Refrescar datos del usuario
```

**Usuario incluye:**
- `id`: ID del usuario
- `name`: Nombre
- `email`: Email
- `role`: Rol ("admin", "encargado", "vendedor", "cliente")

#### Hook useRequireAuth (`hooks/useRequireAuth.ts`)

Hook personalizado para proteger componentes que requieren autenticación:

```typescript
const { user, loading, isAuthenticated, hasRole } = useRequireAuth(['admin', 'encargado']);
```

**Características:**
- Verifica que el usuario esté logueado
- Valida que tenga uno de los roles permitidos
- Redirige automáticamente a `/login` si no está autenticado
- Redirige a `/` y muestra alerta si no tiene permisos
- Incluye parámetro `redirect` en la URL para volver después del login

#### Componente AdminGuard (`components/AdminGuard.tsx`)

Componente wrapper para proteger secciones completas:

```tsx
<AdminGuard allowedRoles={['admin', 'encargado']}>
  {/* Contenido protegido */}
</AdminGuard>
```

**Características:**
- Muestra spinner mientras verifica permisos
- Redirige automáticamente si no hay acceso
- Acepta prop `fallback` para personalizar UI de carga

#### Layout de Admin (`app/admin/layout.tsx`)

El layout de admin está protegido globalmente:

```tsx
export default function AdminLayout({ children }) {
  return (
    <AdminGuard allowedRoles={['admin', 'encargado']}>
      {/* ... */}
    </AdminGuard>
  );
}
```

Esto significa que **todas las páginas dentro de `/admin/*` están protegidas automáticamente**.

## Flujo de Protección

### Escenario 1: Usuario NO logueado intenta acceder a /admin

1. Usuario navega a `http://localhost:3000/admin/banners`
2. `AdminLayout` renderiza `AdminGuard`
3. `useRequireAuth` detecta que `auth.user === null`
4. Hook ejecuta: `router.replace('/login?redirect=/admin/banners')`
5. Usuario es redirigido a login
6. Después de loguearse, vuelve a `/admin/banners`

### Escenario 2: Usuario logueado como "cliente" intenta acceder a /admin

1. Usuario navega a `http://localhost:3000/admin/banners`
2. `AdminLayout` renderiza `AdminGuard` con `allowedRoles={['admin', 'encargado']}`
3. `useRequireAuth` detecta que `auth.user.role === "cliente"`
4. Hook verifica roles: `"cliente"` NO está en `['admin', 'encargado']`
5. Muestra alerta: "No tenés permisos para acceder a esta sección"
6. Redirige a `/` (home)

### Escenario 3: Usuario logueado como "admin" accede a /admin

1. Usuario navega a `http://localhost:3000/admin/banners`
2. `AdminLayout` renderiza `AdminGuard`
3. `useRequireAuth` detecta que `auth.user.role === "admin"`
4. Hook verifica roles: `"admin"` SÍ está en `['admin', 'encargado']`
5. Renderiza el contenido normalmente

## Protección en Páginas Individuales

Si necesitás proteger una página específica fuera del layout de admin:

```tsx
"use client";
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function MiPaginaProtegida() {
  const { user, loading } = useRequireAuth(['admin']);
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      {/* Contenido protegido */}
    </div>
  );
}
```

O usando el componente:

```tsx
import AdminGuard from '@/components/AdminGuard';

export default function MiPaginaProtegida() {
  return (
    <AdminGuard allowedRoles={['admin']}>
      <div>
        {/* Contenido protegido */}
      </div>
    </AdminGuard>
  );
}
```

## Verificación Backend

Aunque el frontend protege las rutas, **el backend SIEMPRE valida los permisos**:

```go
// En routes/router.go
r.GET("/settings/banners", 
    user.AuthMiddleware(),           // 1. Verifica token JWT
    user.RequireAnyRole("admin", "encargado"),  // 2. Verifica rol
    handler.ListBanners              // 3. Ejecuta handler
)
```

Esto significa:
- ✅ Protección en frontend: Mejor UX, evita renderizar páginas sin permisos
- ✅ Protección en backend: Seguridad real, imposible bypassear

## Roles Disponibles

| Rol | Acceso |
|-----|--------|
| `admin` | Acceso completo a todo el panel de administración |
| `encargado` | Acceso a la mayoría de funciones administrativas (gestión de productos, inventario, etc.) |
| `vendedor` | Acceso a sus propias ventas y asignación de pedidos |
| `cliente` | Solo acceso público (productos, carrito, checkout) |

## Manejo de Sesiones

- **Token JWT**: Almacenado en `localStorage` con clave `"token"`
- **Usuario**: Almacenado en `localStorage` con clave `"user"` (caché)
- **Verificación**: Al cargar la app, se consulta `/me` para validar el token
- **Expiración**: Si el backend responde 401, se limpia el token automáticamente
- **Multi-tab**: Cambios en una pestaña se sincronizan con otras mediante eventos `storage`

## Debugging

Si tenés problemas con la autenticación:

1. **Verificar token en localStorage:**
   ```javascript
   localStorage.getItem('token')
   ```

2. **Verificar usuario actual:**
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   ```

3. **Verificar endpoint /me:**
   ```bash
   curl http://localhost:8080/me -H "Authorization: Bearer TU_TOKEN"
   ```

4. **Limpiar sesión manualmente:**
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   window.location.reload();
   ```

## Seguridad

### ✅ Implementado

- JWT verificado en cada petición al backend
- Validación de roles en middleware de Go
- Protección de rutas en frontend con redirección automática
- Limpieza de tokens inválidos o expirados
- CORS configurado para orígenes específicos

### ⚠️ Recomendaciones para Producción

- [ ] Usar cookies HttpOnly en lugar de localStorage (más seguro contra XSS)
- [ ] Implementar refresh tokens para sesiones largas
- [ ] Rate limiting en endpoints de login
- [ ] HTTPS obligatorio en producción
- [ ] Monitoreo de intentos de acceso no autorizado
- [ ] Logs de auditoría para acciones administrativas

## Testing

Para probar el sistema:

1. **Sin login:**
   - Navegar a `/admin/banners`
   - Debe redirigir a `/login?redirect=/admin/banners`

2. **Login como cliente:**
   - Loguearse con un usuario `role: "cliente"`
   - Intentar acceder a `/admin/banners`
   - Debe mostrar alerta y redirigir a `/`

3. **Login como admin:**
   - Loguearse con un usuario `role: "admin"`
   - Acceder a `/admin/banners`
   - Debe permitir el acceso y mostrar contenido
