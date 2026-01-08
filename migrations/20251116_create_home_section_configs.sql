-- Tabla para configuración de secciones del home
CREATE TABLE IF NOT EXISTS home_section_configs (
    id SERIAL PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    limit_products INT DEFAULT 12,
    show_mode VARCHAR(20) DEFAULT 'both', -- 'manual', 'auto', 'both'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para optimizar consultas por orden
CREATE INDEX idx_home_section_configs_order ON home_section_configs(display_order);

-- Insertar configuraciones por defecto
INSERT INTO home_section_configs (section_key, title, enabled, display_order, limit_products, show_mode) VALUES
    ('new_arrivals', 'Nuevos Ingresos', true, 1, 12, 'both'),
    ('featured', 'Destacados', true, 2, 12, 'both'),
    ('offers', 'En Oferta', true, 3, 12, 'both'),
    ('trending', 'Tendencias', true, 4, 12, 'both'),
    ('bestsellers', 'Más Vendidos', true, 5, 12, 'auto')
ON CONFLICT (section_key) DO NOTHING;
