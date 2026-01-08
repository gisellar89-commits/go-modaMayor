-- Agregar columna cart_id a orders para relacionar órdenes con carritos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id BIGINT;

-- Agregar índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_orders_cart_id ON orders(cart_id);

-- Agregar foreign key constraint
ALTER TABLE orders ADD CONSTRAINT fk_orders_cart_id FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL;
