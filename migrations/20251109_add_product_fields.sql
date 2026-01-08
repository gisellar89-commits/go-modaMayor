-- Add new columns to products and product_variants to support supplier, season, year, sizing and images

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_id bigint REFERENCES suppliers(id),
  ADD COLUMN IF NOT EXISTS season varchar(20),
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS size_type_id bigint REFERENCES size_types(id),
  ADD COLUMN IF NOT EXISTS total_stock integer,
  ADD COLUMN IF NOT EXISTS image_model varchar(1024),
  ADD COLUMN IF NOT EXISTS image_hanger varchar(1024);

-- Add optional size_value_id to product_variants to normalize sizes; keep existing `size` text for compatibility
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS size_value_id bigint REFERENCES size_values(id);

-- Ensure location_stocks table can continue using variant_id NULL for product-level stock
-- No destructive changes here.
