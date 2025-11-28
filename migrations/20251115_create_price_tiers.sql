-- Crear tabla de niveles de precio configurables
CREATE TABLE IF NOT EXISTS price_tiers (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    formula_type VARCHAR(20) NOT NULL,
    multiplier DECIMAL(10, 4) DEFAULT 1.0,
    percentage DECIMAL(10, 4) DEFAULT 0.0,
    flat_amount DECIMAL(10, 2) DEFAULT 0.0,
    min_quantity INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    show_in_public BOOLEAN DEFAULT true,
    color_code VARCHAR(7)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_price_tiers_active ON price_tiers(active);
CREATE INDEX idx_price_tiers_order ON price_tiers(order_index);
CREATE INDEX idx_price_tiers_deleted_at ON price_tiers(deleted_at);

-- Insertar datos iniciales basados en la configuración actual del sistema
-- Estos valores son un ejemplo que el admin puede modificar

-- Nivel 1: Precio por defecto (sin cantidad mínima)
INSERT INTO price_tiers (
    name, display_name, formula_type, multiplier, percentage, flat_amount, 
    min_quantity, order_index, active, description, is_default, show_in_public, color_code
) VALUES (
    'retail',
    'Precio Minorista',
    'multiplier',
    1.0,
    0.0,
    0.0,
    0,
    4,
    true,
    'Precio base para compras sin mínimo de cantidad',
    true,
    false,
    '#6B7280'
);

-- Nivel 2: Precio Mayorista (a partir de 6 prendas)
INSERT INTO price_tiers (
    name, display_name, formula_type, multiplier, percentage, flat_amount, 
    min_quantity, order_index, active, description, is_default, show_in_public, color_code
) VALUES (
    'wholesale',
    'Precio Mayorista',
    'multiplier',
    2.5,
    0.0,
    0.0,
    6,
    3,
    true,
    'Precio para compras de 6 prendas o más. Equivale a costo × 2.5',
    false,
    true,
    '#3B82F6'
);

-- Nivel 3: Descuento 1 (a partir de 8 prendas) - 10% menos que mayorista
INSERT INTO price_tiers (
    name, display_name, formula_type, multiplier, percentage, flat_amount, 
    min_quantity, order_index, active, description, is_default, show_in_public, color_code
) VALUES (
    'discount1',
    'Precio con Descuento 1',
    'multiplier',
    2.25,
    0.0,
    0.0,
    8,
    2,
    true,
    'Precio para compras de 8 prendas o más. Equivale a precio mayorista con 10% de descuento',
    false,
    true,
    '#10B981'
);

-- Nivel 4: Descuento 2 / Precio Final (a partir de 12 prendas) - 30% menos que mayorista
INSERT INTO price_tiers (
    name, display_name, formula_type, multiplier, percentage, flat_amount, 
    min_quantity, order_index, active, description, is_default, show_in_public, color_code
) VALUES (
    'discount2',
    'Precio Final',
    'multiplier',
    1.75,
    0.0,
    0.0,
    12,
    1,
    true,
    'Precio para compras de 12 prendas o más. Equivale a precio mayorista con 30% de descuento',
    false,
    true,
    '#F59E0B'
);

-- Comentarios sobre el uso:
-- FormulaType opciones:
--   'multiplier': precio = costo * multiplier
--   'percentage_markup': precio = costo + (costo * percentage / 100)
--   'flat_amount': precio = costo + flat_amount

-- OrderIndex: menor número = mayor prioridad cuando múltiples tiers cumplen condiciones
-- El sistema evaluará los tiers ordenados por order_index ascendente
-- y aplicará el primero que cumpla la condición de min_quantity

-- IsDefault: solo un tier debería tener is_default = true
-- Este se aplica cuando ningún otro tier cumple las condiciones

-- ShowInPublic: controla si el precio se muestra en listados de productos públicos
-- Útil para ocultar el precio minorista y mostrar solo precios mayoristas
