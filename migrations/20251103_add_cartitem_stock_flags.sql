-- Add flags to cart_items to support stock verification flow
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS requires_stock_check boolean NOT NULL DEFAULT false;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS stock_confirmed boolean NOT NULL DEFAULT false;
