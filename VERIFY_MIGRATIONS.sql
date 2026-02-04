-- Script para verificar que todas las migraciones están correctamente registradas
-- Ejecutar en la base de datos de producción

-- 1. Ver todas las migraciones aplicadas relacionadas con size_values y colores
SELECT name, applied_at, 
       to_timestamp(applied_at)::timestamp as fecha_aplicacion
FROM migration_records 
WHERE name LIKE '%size%' OR name LIKE '%color%'
ORDER BY name;

-- 2. Verificar que el índice único existe
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'size_values'
ORDER BY indexname;

-- 3. Verificar datos cargados
SELECT 
    (SELECT COUNT(*) FROM colors) as total_colores,
    (SELECT COUNT(*) FROM size_types) as total_tipos_talle,
    (SELECT COUNT(*) FROM size_values) as total_valores_talle;

-- 4. Ver detalle de tipos de talle con sus valores
SELECT 
    st.name as tipo,
    st.key,
    COUNT(sv.id) as cantidad_valores
FROM size_types st
LEFT JOIN size_values sv ON sv.size_type_id = st.id
GROUP BY st.id, st.name, st.key
ORDER BY st.name;

-- RESULTADO ESPERADO:
-- - Índice: idx_size_values_type_value debe existir
-- - Colores: 11
-- - Tipos de talle: 6
-- - Valores de talle: 49 (aproximadamente)
-- - Cada tipo debe tener sus valores correspondientes
