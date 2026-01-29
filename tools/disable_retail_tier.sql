-- Desactivar el tier "Precio Minorista" para que la tienda funcione solo como mayorista
-- La compra mínima será de 6 prendas (primer tier mayorista)

UPDATE price_tiers 
SET active = false, 
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'retail';

-- Verificar los tiers activos
SELECT 
    id,
    name,
    display_name,
    min_quantity,
    active,
    order_index
FROM price_tiers
WHERE deleted_at IS NULL
ORDER BY order_index;
