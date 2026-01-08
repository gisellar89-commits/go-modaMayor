-- Crear tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    location VARCHAR(50) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL DEFAULT 0,
    new_stock INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    reference VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    notes TEXT
);

-- Crear índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_location ON stock_movements(location);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_deleted_at ON stock_movements(deleted_at);

-- Comentarios para documentación
COMMENT ON TABLE stock_movements IS 'Historial de movimientos de inventario';
COMMENT ON COLUMN stock_movements.movement_type IS 'Tipo de movimiento: adjustment, sale, return, transfer, initial';
COMMENT ON COLUMN stock_movements.quantity IS 'Cantidad del movimiento (positivo o negativo)';
COMMENT ON COLUMN stock_movements.previous_stock IS 'Stock anterior al movimiento';
COMMENT ON COLUMN stock_movements.new_stock IS 'Stock resultante después del movimiento';
COMMENT ON COLUMN stock_movements.reference IS 'Referencia a orden, transferencia, etc.';
