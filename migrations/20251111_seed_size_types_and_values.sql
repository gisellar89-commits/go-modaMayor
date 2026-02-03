-- Seeder: insertar tipos de talles comunes y sus valores
-- Se ejecuta automáticamente al iniciar el servidor (idempotente)

-- 1) Insertar tipos de talles (usa 'key' único en la tabla)
INSERT INTO size_types (key, name, description, is_singleton, created_at, updated_at)
VALUES
  ('unico', 'Talle único / sin variantes', 'Producto sin variantes de talle', true, now(), now()),
  ('letras', 'Letras Estándar', 'XS, S, M, L, XL, XXL', false, now(), now()),
  ('numerico_femenino', 'Numérico Femenino', 'Talles 36 a 50', false, now(), now()),
  ('numerico_masculino', 'Numérico Masculino', 'Talles 38 a 52', false, now(), now()),
  ('numerico_calzado', 'Numérico Calzado', 'Talles 35 a 45', false, now(), now()),
  ('jeans', 'Talle de Jeans', 'Talles 24, 26, 28, 30, 32, 34, 36, 38', false, now(), now())
ON CONFLICT (key) DO NOTHING;

-- 2) Insertar valores de ejemplo para cada tipo (idempotente)

-- Talle único: valor "Único"
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, 'Único', 1, now(), now()
FROM size_types st
WHERE st.key = 'unico'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Letras Estándar: XS, S, M, L, XL, XXL
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st 
CROSS JOIN (VALUES 
  ('XS', 1),
  ('S', 2),
  ('M', 3),
  ('L', 4),
  ('XL', 5),
  ('XXL', 6)
) AS v(val, ordinal)
WHERE st.key = 'letras'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Numérico Femenino: 36 a 50
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st 
CROSS JOIN (VALUES 
  ('36', 1),
  ('38', 2),
  ('40', 3),
  ('42', 4),
  ('44', 5),
  ('46', 6),
  ('48', 7),
  ('50', 8)
) AS v(val, ordinal)
WHERE st.key = 'numerico_femenino'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Numérico Masculino: 38 a 52
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st 
CROSS JOIN (VALUES 
  ('38', 1),
  ('40', 2),
  ('42', 3),
  ('44', 4),
  ('46', 5),
  ('48', 6),
  ('50', 7),
  ('52', 8)
) AS v(val, ordinal)
WHERE st.key = 'numerico_masculino'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Numérico Calzado: 35 a 45
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st 
CROSS JOIN (VALUES 
  ('35', 1),
  ('36', 2),
  ('37', 3),
  ('38', 4),
  ('39', 5),
  ('40', 6),
  ('41', 7),
  ('42', 8),
  ('43', 9),
  ('44', 10),
  ('45', 11)
) AS v(val, ordinal)
WHERE st.key = 'numerico_calzado'
ON CONFLICT (size_type_id, value) DO NOTHING;

-- Jeans: 24 a 38
INSERT INTO size_values (size_type_id, value, ordinal, created_at, updated_at)
SELECT st.id, v.val, v.ordinal, now(), now()
FROM size_types st 
CROSS JOIN (VALUES 
  ('24', 1),
  ('26', 2),
  ('28', 3),
  ('30', 4),
  ('32', 5),
  ('34', 6),
  ('36', 7),
  ('38', 8)
) AS v(val, ordinal)
WHERE st.key = 'jeans'
ON CONFLICT (size_type_id, value) DO NOTHING;
