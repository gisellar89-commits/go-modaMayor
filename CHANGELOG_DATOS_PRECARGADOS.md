# Changelog - Datos Precargados Automáticamente

**Fecha**: 3 de febrero de 2026
**Versión**: 1.2

## Resumen

Se actualizó el sistema para incluir datos básicos precargados automáticamente al iniciar por primera vez, eliminando la necesidad de configuración manual inicial.

## Cambios Implementados

### 1. Colores Precargados (11 colores)

**Archivo**: `migrations/20251110_seed_common_colors.sql`

Colores incluidos automáticamente:
- Negro (#000000)
- Blanco (#FFFFFF)
- Gris (#808080)
- Azul (#0000FF)
- Azul Marino (#000080)
- Rojo (#FF0000)
- Verde (#008000)
- Amarillo (#FFFF00)
- Rosa (#FFC0CB)
- Marrón (#8B4513)
- Beige (#F5F5DC)

### 2. Tipos de Talles Precargados (6 tipos completos)

**Archivo**: `migrations/20251111_seed_size_types_and_values.sql`

#### Tipos incluidos:

**a) Talle único / sin variantes**
- Key: `unico`
- Valores: Único
- Uso: Productos sin variaciones

**b) Letras Estándar**
- Key: `letras`
- Valores: XS, S, M, L, XL, XXL
- Uso: Indumentaria general

**c) Numérico Femenino**
- Key: `numerico_femenino`
- Valores: 36, 38, 40, 42, 44, 46, 48, 50
- Uso: Ropa de mujer

**d) Numérico Masculino**
- Key: `numerico_masculino`
- Valores: 38, 40, 42, 44, 46, 48, 50, 52
- Uso: Ropa de hombre

**e) Numérico Calzado**
- Key: `numerico_calzado`
- Valores: 35 al 45
- Uso: Calzado

**f) Talle de Jeans**
- Key: `jeans`
- Valores: 24, 26, 28, 30, 32, 34, 36, 38
- Uso: Pantalones jean

## Funcionamiento

Las migraciones SQL se ejecutan automáticamente al iniciar el servidor mediante el sistema de migraciones configurado en `config/migrations.go`.

- Las migraciones son **idempotentes** (se pueden ejecutar múltiples veces sin duplicar datos)
- Usan `ON CONFLICT DO NOTHING` para evitar errores en re-ejecuciones
- Se registran en la tabla `migrations` para no ejecutarse nuevamente

## Beneficios

1. **Experiencia de usuario mejorada**: El sistema está listo para usar inmediatamente
2. **Menos errores**: Elimina pasos manuales propensos a errores
3. **Configuración estándar**: Todos los usuarios empiezan con la misma base
4. **Flexibilidad**: Los datos precargados pueden editarse, desactivarse o eliminarse según necesidad

## Manual Actualizado

Se actualizaron las secciones 5, 6 y 7 del manual para reflejar que estos datos vienen precargados:
- Sección 5: Configuración de Colores
- Sección 6: Configuración de Tipos de Talle  
- Sección 7: Configuración de Valores de Talle

El manual ahora indica claramente qué está precargado y cómo agregar datos personalizados adicionales.

## Deploy

Estos cambios se aplicarán automáticamente en el próximo deploy a producción (Render).
Las migraciones se ejecutarán una vez y quedarán registradas.
