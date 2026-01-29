-- Crear tabla de remitos internos
CREATE TABLE IF NOT EXISTS remitos_internos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    cart_id INT REFERENCES carts(id),
    order_id INT REFERENCES orders(id),
    ubicacion_origen VARCHAR(50) NOT NULL,
    ubicacion_destino VARCHAR(50) DEFAULT 'deposito',
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_envio TIMESTAMP,
    fecha_recepcion TIMESTAMP,
    recibido_por_user_id INT REFERENCES users(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Crear tabla de items del remito interno
CREATE TABLE IF NOT EXISTS remito_interno_items (
    id SERIAL PRIMARY KEY,
    remito_interno_id INT REFERENCES remitos_internos(id) ON DELETE CASCADE,
    cart_item_id INT REFERENCES cart_items(id),
    product_id INT REFERENCES products(id),
    variant_id INT REFERENCES product_variants(id),
    cantidad INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_remitos_internos_cart_id ON remitos_internos(cart_id);
CREATE INDEX IF NOT EXISTS idx_remitos_internos_order_id ON remitos_internos(order_id);
CREATE INDEX IF NOT EXISTS idx_remitos_internos_estado ON remitos_internos(estado);
CREATE INDEX IF NOT EXISTS idx_remito_interno_items_remito_id ON remito_interno_items(remito_interno_id);

-- Comentarios
COMMENT ON TABLE remitos_internos IS 'Remitos internos para traslado de stock entre ubicaciones';
COMMENT ON COLUMN remitos_internos.estado IS 'Estados: pendiente, en_transito, recibido, cancelado';
COMMENT ON COLUMN remitos_internos.ubicacion_origen IS 'Ubicación de donde sale el stock (mendoza, salta, deposito)';
COMMENT ON COLUMN remitos_internos.ubicacion_destino IS 'Ubicación a donde llega el stock (generalmente deposito)';
