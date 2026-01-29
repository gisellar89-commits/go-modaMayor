-- Corregir la configuración de precios que estaba al revés
-- El precio minorista debe ser MÁS ALTO que el mayorista

-- Actualizar Precio Minorista: costo × 2.0 (precio público/individual)
UPDATE price_tiers 
SET multiplier = 2.0,
    description = 'Precio base para compras individuales (sin descuento por volumen)',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'retail';

-- Actualizar Precio Mayorista: costo × 1.0 (precio base mayorista, 6+ prendas)
UPDATE price_tiers 
SET multiplier = 1.0,
    description = 'Precio para compras de 6 prendas o más. Precio base mayorista',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'wholesale';

-- Actualizar Precio con Descuento 1: costo × 0.9 (10% descuento adicional, 8+ prendas)
UPDATE price_tiers 
SET multiplier = 0.9,
    description = 'Precio para compras de 8 prendas o más. 10% descuento sobre precio mayorista',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'discount1';

-- Actualizar Precio Final: costo × 0.75 (25% descuento sobre mayorista, 12+ prendas)
UPDATE price_tiers 
SET multiplier = 0.75,
    description = 'Precio para compras de 12 prendas o más. Mejor precio disponible',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'discount2';

-- Verificar la configuración
SELECT 
    name,
    display_name,
    multiplier,
    min_quantity,
    active,
    order_index,
    description
FROM price_tiers
WHERE deleted_at IS NULL
ORDER BY multiplier DESC;

-- Mostrar ejemplo de precios con costo de $30,500
SELECT 
    display_name,
    min_quantity,
    multiplier,
    (30500 * multiplier) as precio_ejemplo,
    active
FROM price_tiers
WHERE deleted_at IS NULL
ORDER BY multiplier DESC;
