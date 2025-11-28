-- Crear tabla de temporadas
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    year INTEGER,
    active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_seasons_deleted_at ON seasons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(active);

-- Agregar campos de tags al producto
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Agregar FK a seasons (opcional, mantener temporalmente el campo season antiguo)
ALTER TABLE products ADD COLUMN IF NOT EXISTS season_id INTEGER REFERENCES seasons(id);
CREATE INDEX IF NOT EXISTS idx_products_season_id ON products(season_id);

-- Insertar temporadas comunes
INSERT INTO seasons (name, code, year, active) VALUES 
    ('Primavera/Verano 2025', 'PV2025', 2025, true),
    ('Otoño/Invierno 2025', 'OI2025', 2025, true),
    ('Primavera/Verano 2026', 'PV2026', 2026, true),
    ('Otoño/Invierno 2026', 'OI2026', 2026, false)
ON CONFLICT (name) DO NOTHING;

-- Comentarios
COMMENT ON COLUMN products.is_new_arrival IS 'Marcar producto como nuevo ingreso';
COMMENT ON COLUMN products.is_featured IS 'Marcar producto como destacado';
COMMENT ON COLUMN products.is_offer IS 'Marcar producto como en oferta';
COMMENT ON COLUMN products.is_trending IS 'Marcar producto como tendencia';
