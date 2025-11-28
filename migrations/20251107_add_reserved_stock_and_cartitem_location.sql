-- Add reserved column to location_stocks and location + reserved_quantity to cart_items
ALTER TABLE location_stocks ADD COLUMN IF NOT EXISTS reserved integer DEFAULT 0;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS location varchar(255);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS reserved_quantity integer DEFAULT 0;
