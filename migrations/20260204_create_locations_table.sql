-- Crear tabla de ubicaciones de stock
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Crear índices
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_active ON locations(active);
CREATE INDEX idx_locations_display_order ON locations(display_order);

-- Insertar ubicaciones por defecto
INSERT INTO locations (code, name, description, active, display_order) VALUES
    ('deposito', 'Depósito Central', 'Ubicación principal de almacenamiento', true, 1),
    ('mendoza', 'Local Mendoza', 'Sucursal ubicada en calle Mendoza', true, 2),
    ('salta', 'Local Salta', 'Sucursal ubicada en calle Salta', true, 3)
ON CONFLICT (code) DO NOTHING;
