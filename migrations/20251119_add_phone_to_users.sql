-- Agregar campo de teléfono a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
