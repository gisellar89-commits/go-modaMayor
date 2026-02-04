# Guía: Diagnóstico y Solución - Datos Precargados No Aparecen

## Problema
Después del deploy en Render, los colores y tipos de talles precargados no aparecen en el sistema.

## Diagnóstico

### 1. Verificar si las migraciones están en el código desplegado

En Render:
1. Ve a tu servicio → **Shell**
2. Ejecuta:
```bash
ls -la migrations/
```

✅ **Debe mostrar**: Los archivos de migración incluyendo:
- `20251110_seed_common_colors.sql`
- `20251111_seed_size_types_and_values.sql`

❌ **Si no aparecen**: Problema con el deploy. Verifica que la carpeta `migrations/` esté en el repositorio.

### 2. Verificar logs del servidor

En Render Dashboard:
1. Ve a **Logs**
2. Busca líneas que contengan:
   - `"Aplicando migración"`
   - `"Migración ya aplicada"`
   - Errores relacionados con SQL

✅ **Deberías ver**: 
```
✓ Migración ya aplicada: 20251110_seed_common_colors.sql
✓ Migración ya aplicada: 20251111_seed_size_types_and_values.sql
```

❌ **Si ves errores**: Las migraciones fallaron. Revisa el error específico.

### 3. Verificar la base de datos directamente

Conectarte a PostgreSQL en Render:
1. Dashboard de Render → Tu base de datos → **Connect**
2. Copia el comando PSQL
3. Pégalo en tu terminal local

Ejecuta:
```sql
-- Ver si existen colores
SELECT COUNT(*) FROM colors;

-- Ver si existen tipos de talles
SELECT COUNT(*) FROM size_types;

-- Ver si existen valores de talles
SELECT COUNT(*) FROM size_values;
```

✅ **Respuestas esperadas**:
- `colors`: 11 registros
- `size_types`: 6 registros  
- `size_values`: 49 registros (aproximadamente)

## Soluciones

### Solución 1: Forzar re-ejecución de migraciones

Si las migraciones se marcaron como ejecutadas pero fallaron:

**Opción A - Desde Render Shell:**
```bash
# Conectar a la base de datos desde el shell de Render
psql $DATABASE_URL

# Ejecutar:
DELETE FROM migration_records 
WHERE name IN ('20251110_seed_common_colors.sql', '20251111_seed_size_types_and_values.sql');

# Salir
\q

# Reiniciar el servicio (o esperar que Render lo reinicie)
```

**Opción B - Desde PostgreSQL local (conectado a producción):**
```bash
# Usar el comando de conexión que te da Render
psql postgresql://usuario:password@host/database

# Luego ejecutar el script FORCE_SEED_MIGRATIONS.sql
\i FORCE_SEED_MIGRATIONS.sql
```

Después de eliminar los registros, **reinicia el servicio en Render** para que las migraciones se ejecuten automáticamente.

### Solución 2: Ejecutar las migraciones manualmente

Si el método automático no funciona, ejecuta el SQL directamente:

1. Conéctate a la base de datos de producción
2. Copia el contenido completo de:
   - `migrations/20251110_seed_common_colors.sql`
   - `migrations/20251111_seed_size_types_and_values.sql`
3. Ejecútalos uno por uno en el cliente PostgreSQL

### Solución 3: Verificar tabla de migraciones

La tabla de control puede tener un nombre diferente. Verifica:

```sql
-- Ver todas las tablas
\dt

-- Buscar tabla de migraciones (puede ser migration_records o migrations)
SELECT * FROM migration_records LIMIT 5;
-- O
SELECT * FROM migrations LIMIT 5;
```

Si la tabla se llama `migrations` en lugar de `migration_records`, ajusta los comandos anteriores.

## Prevención

Para evitar este problema en futuros deploys:

1. **Siempre verifica los logs** después de un deploy
2. **Monitorea la ejecución de migraciones** en los primeros minutos
3. **Ten un backup** de la base de datos antes de grandes cambios

## Contacto de Soporte

Si nada de esto funciona:
1. Exporta los logs completos de Render
2. Copia el resultado de las consultas SQL de diagnóstico
3. Revisa el código en `config/migrations.go` para entender el flujo

---

**Fecha de creación**: 3 de febrero de 2026
**Última actualización**: 3 de febrero de 2026
