-- Script para forzar la re-ejecución de las migraciones de seed
-- Ejecutar en la consola de PostgreSQL de Render si los datos no aparecieron

-- 1. Verificar si las migraciones están registradas
SELECT name, applied_at FROM migration_records 
WHERE name IN ('20251110_seed_common_colors.sql', '20251111_seed_size_types_and_values.sql')
ORDER BY applied_at DESC;

-- 2. Si aparecen, eliminar los registros para forzar re-ejecución
DELETE FROM migration_records 
WHERE name IN ('20251110_seed_common_colors.sql', '20251111_seed_size_types_and_values.sql');

-- 3. Verificar que los colores existen
SELECT COUNT(*) as total_colores FROM colors;
SELECT * FROM colors ORDER BY name LIMIT 5;

-- 4. Verificar que los tipos de talles existen
SELECT COUNT(*) as total_tipos FROM size_types;
SELECT * FROM size_types ORDER BY name;

-- 5. Verificar que los valores de talles existen
SELECT COUNT(*) as total_valores FROM size_values;
SELECT st.name as tipo, sv.value as valor, sv.ordinal 
FROM size_values sv
JOIN size_types st ON sv.size_type_id = st.id
ORDER BY st.name, sv.ordinal
LIMIT 20;

-- NOTA: Después de eliminar los registros de migration_records,
-- reinicia el servidor de Render para que ejecute las migraciones automáticamente.
