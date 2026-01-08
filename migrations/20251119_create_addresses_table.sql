-- Crear tabla de direcciones de usuarios
CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    user_id BIGINT NOT NULL,
    label VARCHAR(50),
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    street VARCHAR(255) NOT NULL,
    floor VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Argentina',
    reference VARCHAR(500),
    is_default BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índice para búsquedas por usuario
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- Crear índice para búsquedas de dirección por defecto
CREATE INDEX idx_addresses_is_default ON addresses(is_default) WHERE is_default = true;
