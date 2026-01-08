-- Agregar columna price a product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- Actualizar precios de variantes basándose en el precio mayorista del producto
-- (puedes ajustar esto según la lógica de negocio)
UPDATE product_variants pv
SET price = COALESCE(
    (SELECT CAST(p.wholesale_price * 100 AS INTEGER) 
     FROM products p 
     WHERE p.id = pv.product_id 
     AND p.deleted_at IS NULL),
    0
)
WHERE pv.price = 0 OR pv.price IS NULL;
