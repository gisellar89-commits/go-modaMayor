-- Add variant information to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_size VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_color VARCHAR(50);

-- Add index for variant_id
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
