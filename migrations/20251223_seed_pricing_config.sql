-- Seed inicial de configuración de precios
-- Solo inserta si no existe ningún registro

INSERT INTO pricing_configs (
    wholesale_percent, 
    discount1_percent, 
    discount2_percent, 
    min_qty_wholesale, 
    min_qty_discount1, 
    min_qty_discount2,
    created_at,
    updated_at
)
SELECT 
    150.0,  -- wholesale_percent: precio mayorista = costo * 2.5 (150% de markup)
    10.0,   -- discount1_percent: 10% de descuento sobre precio mayorista
    20.0,   -- discount2_percent: 20% de descuento sobre precio mayorista
    6,      -- min_qty_wholesale: mínimo 6 unidades para precio mayorista
    12,     -- min_qty_discount1: mínimo 12 unidades para descuento 1
    24,     -- min_qty_discount2: mínimo 24 unidades para descuento 2
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM pricing_configs LIMIT 1);
