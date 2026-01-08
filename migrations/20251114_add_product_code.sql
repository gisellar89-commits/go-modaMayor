-- Agregar campo code a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- Generar códigos para productos existentes basados en ID
UPDATE products SET code = 'PROD-' || LPAD(id::text, 6, '0') WHERE code IS NULL OR code = '';

-- Comentario para documentación
COMMENT ON COLUMN products.code IS 'Código único identificador del producto';
