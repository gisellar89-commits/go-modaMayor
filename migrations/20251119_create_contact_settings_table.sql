-- Crear tabla de configuración de contacto
CREATE TABLE IF NOT EXISTS contact_settings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    whatsapp_number VARCHAR(20),
    whatsapp_message TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT
);

-- Crear índice para soft deletes
CREATE INDEX idx_contact_settings_deleted_at ON contact_settings(deleted_at);

-- Insertar valores por defecto
INSERT INTO contact_settings (whatsapp_number, whatsapp_message, created_at, updated_at)
VALUES ('5491123456789', '¡Hola! Tengo una consulta sobre Moda x Mayor', NOW(), NOW());
