-- Seed de colores comunes (idempotente)
-- Se ejecuta automáticamente al iniciar el servidor

INSERT INTO colors (key, name, hex, active, created_at, updated_at)
VALUES
  ('negro', 'Negro', '#000000', true, NOW(), NOW()),
  ('blanco', 'Blanco', '#FFFFFF', true, NOW(), NOW()),
  ('gris', 'Gris', '#808080', true, NOW(), NOW()),
  ('azul', 'Azul', '#0000FF', true, NOW(), NOW()),
  ('azul_marino', 'Azul Marino', '#000080', true, NOW(), NOW()),
  ('rojo', 'Rojo', '#FF0000', true, NOW(), NOW()),
  ('verde', 'Verde', '#008000', true, NOW(), NOW()),
  ('amarillo', 'Amarillo', '#FFFF00', true, NOW(), NOW()),
  ('rosa', 'Rosa', '#FFC0CB', true, NOW(), NOW()),
  ('marron', 'Marrón', '#8B4513', true, NOW(), NOW()),
  ('beige', 'Beige', '#F5F5DC', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
