-- Crear tabla de temporadas
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    code VARCHAR(20) NOT NULL UNIQUE, -- ej: SS25, AW25
    name VARCHAR(100) NOT NULL, -- ej: "Primavera/Verano 2025"
    year INT NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Crear índices para seasons
CREATE INDEX IF NOT EXISTS idx_seasons_code ON seasons(code);
CREATE INDEX IF NOT EXISTS idx_seasons_deleted_at ON seasons(deleted_at);

-- Agregar campos de tags a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Agregar nueva columna season_id (FK a seasons)
ALTER TABLE products ADD COLUMN IF NOT EXISTS season_id INT;
ALTER TABLE products ADD CONSTRAINT fk_products_season FOREIGN KEY (season_id) REFERENCES seasons(id);
CREATE INDEX IF NOT EXISTS idx_products_season_id ON products(season_id);

-- Crear índices para los nuevos campos booleanos (para consultas rápidas)
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_offer ON products(is_offer) WHERE is_offer = true;
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON products(is_trending) WHERE is_trending = true;

-- Insertar temporadas comunes
INSERT INTO seasons (code, name, year, active) VALUES
    ('SS25', 'Primavera/Verano 2025', 2025, true),
    ('AW25', 'Otoño/Invierno 2025', 2025, true),
    ('SS26', 'Primavera/Verano 2026', 2026, true),
    ('AW26', 'Otoño/Invierno 2026', 2026, false)
ON CONFLICT (code) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE seasons IS 'Tabla de temporadas configurables para productos';
COMMENT ON COLUMN products.is_new_arrival IS 'Producto marcado como nuevo ingreso';
COMMENT ON COLUMN products.is_featured IS 'Producto destacado para la página principal';
COMMENT ON COLUMN products.is_offer IS 'Producto en oferta especial';
COMMENT ON COLUMN products.is_trending IS 'Producto tendencia del momento';
COMMENT ON COLUMN products.season_id IS 'Referencia a la temporada del producto';

-- Migrar datos existentes del campo season (texto) a la tabla seasons
-- Esto es opcional, dependiendo de si ya tienes datos
DO $$
DECLARE
    season_text VARCHAR(20);
    season_record RECORD;
BEGIN
    -- Iterar sobre valores únicos en products.season que no sean NULL o vacíos
    FOR season_text IN 
        SELECT DISTINCT season 
        FROM products 
        WHERE season IS NOT NULL 
        AND season != '' 
        AND season_id IS NULL
    LOOP
        -- Intentar encontrar una temporada existente que coincida
        SELECT * INTO season_record 
        FROM seasons 
        WHERE LOWER(code) = LOWER(season_text) 
           OR LOWER(name) LIKE '%' || LOWER(season_text) || '%'
        LIMIT 1;
        
        IF FOUND THEN
            -- Actualizar productos con esa temporada
            UPDATE products 
            SET season_id = season_record.id 
            WHERE season = season_text 
            AND season_id IS NULL;
        END IF;
    END LOOP;
END $$;
