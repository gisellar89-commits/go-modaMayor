-- Seed de colores comunes (idempotente)
-- Ejecutar en la base de datos Postgres del proyecto.

INSERT INTO colors (key, name, hex, active, created_at, updated_at)
VALUES
  ('negro', 'Negro', '#000000', true, NOW(), NOW()),
  ('blanco', 'Blanco', '#FFFFFF', true, NOW(), NOW()),
  ('rojo', 'Rojo', '#FF0000', true, NOW(), NOW()),
  ('azul', 'Azul', '#0000FF', true, NOW(), NOW()),
  ('verde', 'Verde', '#00AA00', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Nota: esta instrucción asume que existe un índice único en la columna `key` de la tabla `colors`.
-- Si no existe, creálo antes de ejecutar o ejecutá el INSERT sin ON CONFLICT (pero tendrás riesgo de duplicados).
