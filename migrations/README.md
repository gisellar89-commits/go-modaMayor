# 🗄️ Sistema de Migraciones de Base de Datos

## 📋 Resumen

Este proyecto utiliza un **sistema dual de migraciones**:

1. **GORM AutoMigrate**: Crea/actualiza tablas basadas en structs de Go
2. **Migraciones SQL**: Archivos `.sql` en la carpeta `migrations/` ejecutados automáticamente

## ✨ Funcionamiento Automático

### Al iniciar la aplicación:

1. **Se conecta a la base de datos** ([config/database.go](../config/database.go))
2. **Ejecuta migraciones SQL pendientes** ([config/migrations.go](../config/migrations.go))
   - Lee todos los archivos `.sql` de `migrations/`
   - Los ordena alfabéticamente por nombre
   - Verifica cuáles ya fueron aplicados (tabla `migration_records`)
   - Ejecuta solo las pendientes
   - Registra cada migración exitosa
3. **Ejecuta GORM AutoMigrate** (si `AUTO_MIGRATE=true`)
   - Actualiza esquemas de tablas según structs
4. **Inicia el servidor**

## 📁 Estructura de Migraciones

```
migrations/
├── 20250115_add_base_cost_to_order_items.sql
├── 20251116_add_tags_and_seasons_table.sql
├── 20251223_seed_pricing_config.sql
└── ...
```

### Convención de nombres:

```
YYYYMMDD_descripcion_clara.sql
```

Ejemplos:
- ✅ `20260201_create_seasons_table.sql`
- ✅ `20260201_add_email_index_users.sql`
- ❌ `fix.sql` (mal: no tiene fecha)
- ❌ `nueva_tabla.sql` (mal: no tiene fecha)

## 🆕 Crear una Nueva Migración

### 1. Crear el archivo SQL

```bash
# Crear archivo con la fecha actual
touch migrations/$(date +%Y%m%d)_descripcion_de_cambio.sql
```

Ejemplo: `migrations/20260201_add_user_avatar_field.sql`

```sql
-- Agregar campo avatar a usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- Crear índice si es necesario
CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_url);

-- Comentarios para documentación
COMMENT ON COLUMN users.avatar_url IS 'URL de la foto de perfil del usuario';
```

### 2. Probar localmente

```bash
# Iniciar el servidor (ejecutará la migración automáticamente)
go run cmd/main.go
```

Verás en los logs:
```
⏳ Aplicando migración: 20260201_add_user_avatar_field.sql
✅ Migración aplicada exitosamente: 20260201_add_user_avatar_field.sql
```

### 3. Commit y push

```bash
git add migrations/20260201_add_user_avatar_field.sql
git commit -m "feat: agregar campo avatar a usuarios"
git push
```

### 4. Deploy automático

Al hacer push, Render (o tu servidor) hará deploy automáticamente y:
- ✅ Detectará la nueva migración
- ✅ La ejecutará automáticamente
- ✅ La registrará como aplicada
- ✅ Nunca la volverá a ejecutar

## 🔍 Verificar Migraciones Aplicadas

### Desde código:

```go
import "go-modaMayor/config"

// Obtener lista de migraciones aplicadas
applied, err := config.GetAppliedMigrations(db)
for _, name := range applied {
    fmt.Println("✓", name)
}
```

### Desde base de datos:

```sql
-- Ver todas las migraciones aplicadas
SELECT * FROM migration_records ORDER BY applied_at ASC;
```

## 🚨 Solución de Problemas

### Problema: "Migración falló en producción"

**Síntoma**: El servidor no inicia, error de migración en los logs

**Solución 1: Verificar el archivo SQL**
```bash
# Probar la migración localmente primero
psql -d tu_base_local -f migrations/la_migracion_que_fallo.sql
```

**Solución 2: Marcar como aplicada manualmente (solo si ya se ejecutó)**
```sql
-- Conectar a la base de producción
INSERT INTO migration_records (name, applied_at) 
VALUES ('20260201_nombre_archivo.sql', EXTRACT(EPOCH FROM NOW()));
```

### Problema: "Necesito revertir una migración"

**No hay rollback automático**. Debes crear una nueva migración que revierta los cambios:

```bash
# Ejemplo: revertir campo agregado
touch migrations/20260202_rollback_user_avatar.sql
```

```sql
-- Revertir campo avatar
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

### Problema: "Migración ya ejecutada pero aparece como pendiente"

Verificar tabla de control:
```sql
SELECT * FROM migration_records WHERE name = '20260201_nombre.sql';
```

Si no está, ejecutarla manualmente y registrarla:
```sql
-- Ejecutar SQL manualmente
\i migrations/20260201_nombre.sql

-- Registrar como aplicada
INSERT INTO migration_records (name) VALUES ('20260201_nombre.sql');
```

## ⚙️ Variables de Entorno

```bash
# Desarrollo local
AUTO_MIGRATE=true      # Habilita GORM AutoMigrate
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=modamayor_dev
DB_SSLMODE=disable

# Producción (Render)
AUTO_MIGRATE=true      # Habilita GORM AutoMigrate
DATABASE_URL=postgresql://user:pass@host:5432/db
# Las migraciones SQL se ejecutan SIEMPRE automáticamente
```

## 📝 Buenas Prácticas

### ✅ DO (Hacer):
- Usar `IF NOT EXISTS` / `IF EXISTS` en DDL
- Nombrar migraciones con fecha: `YYYYMMDD_descripcion.sql`
- Probar localmente antes de hacer push
- Incluir comentarios explicativos en SQL
- Usar transacciones cuando sea posible
- Hacer migraciones pequeñas e incrementales

### ❌ DON'T (No hacer):
- Modificar migraciones ya aplicadas en producción
- Borrar archivos de migración del repo
- Ejecutar migraciones manualmente en producción (el sistema lo hace automáticamente)
- Usar nombres genéricos como `fix.sql`, `update.sql`
- Hacer cambios destructivos sin backup

## 🔒 Seguridad

- Las migraciones se ejecutan con los mismos permisos que la aplicación
- Si una migración falla, el servidor no inicia (fail-fast)
- Cada migración se registra con timestamp
- No se pueden ejecutar migraciones duplicadas

## 🎯 Migrar de Sistema Manual a Automático

Si ya tienes una base de datos en producción con migraciones aplicadas manualmente:

```sql
-- Registrar todas las migraciones existentes como aplicadas
INSERT INTO migration_records (name, applied_at) VALUES
  ('20250115_add_base_cost_to_order_items.sql', EXTRACT(EPOCH FROM NOW())),
  ('20251116_add_tags_and_seasons_table.sql', EXTRACT(EPOCH FROM NOW())),
  -- ... todas las demás
  ('20260130_seed_admin_user.sql', EXTRACT(EPOCH FROM NOW()))
ON CONFLICT (name) DO NOTHING;
```

O usar este script helper:

```bash
# Script para registrar migraciones existentes
for file in migrations/*.sql; do
  filename=$(basename "$file")
  echo "INSERT INTO migration_records (name) VALUES ('$filename') ON CONFLICT (name) DO NOTHING;"
done | psql "tu_database_url"
```

## 📚 Referencias

- [GORM Migrations](https://gorm.io/docs/migration.html)
- [PostgreSQL DDL](https://www.postgresql.org/docs/current/ddl.html)
- Código fuente: [config/migrations.go](../config/migrations.go)
