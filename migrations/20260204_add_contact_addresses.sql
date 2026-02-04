-- Agregar tabla para múltiples direcciones de contacto
CREATE TABLE IF NOT EXISTS contact_addresses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    business_hours VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Crear índice para orden de visualización
CREATE INDEX IF NOT EXISTS idx_contact_addresses_display_order ON contact_addresses(display_order);

-- Crear índice para soft deletes
CREATE INDEX IF NOT EXISTS idx_contact_addresses_deleted_at ON contact_addresses(deleted_at);
