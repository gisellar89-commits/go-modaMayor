-- Seeder: insertar tipos de talles comunes y sus valores de ejemplo
-- Usa ON CONFLICT para ser idempotente.

-- 1) Insertar tipos de talles (usa 'key' único en la tabla)
INSERT INTO size_types (key, name, description, is_singleton, created_at, updated_at)
VALUES
  ('unico', 'Talle único / sin variantes', 'Producto sin variantes de talle', true, now(), now()),
  ('especiales', 'Talles especiales', 'Talles no estándar', false, now(), now()),
  ('letras', 'Letras (S/M/L)', 'Talles por letra', false, now(), now()),
  ('numericos', 'Númericos', 'Talles numericos', false, now(), now()),
  ('jeans', 'Talle de jeans', 'Talles de jean (ej: 28,30,32)', false, now(), now())
ON CONFLICT (key) DO NOTHING;

-- 2) Insertar valores de ejemplo para cada tipo (idempotente)
-- Para cada insertamos usando el id actual del size_type (puede existir ya)

-- Letras: S,M,L
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st CROSS JOIN (VALUES ('S',1),('M',2),('L',3)) AS v(val, ordinal)
WHERE st.key = 'letras'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Numericos: 36,38,40 (ejemplo)
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st CROSS JOIN (VALUES ('36',1),('38',2),('40',3)) AS v(val, ordinal)
WHERE st.key = 'numericos'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Jeans: 28,30,32,34
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st CROSS JOIN (VALUES ('28',1),('30',2),('32',3),('34',4)) AS v(val, ordinal)
WHERE st.key = 'jeans'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Talles especiales: ejemplo A,B
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st CROSS JOIN (VALUES ('A',1),('B',2)) AS v(val, ordinal)
WHERE st.key = 'especiales'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Talle único: insertar valor "Único"
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, 'Único', 1, now(), now()
FROM size_types st
WHERE st.key = 'unico'
ON CONFLICT (size_type_id, value) DO NOTHING;
