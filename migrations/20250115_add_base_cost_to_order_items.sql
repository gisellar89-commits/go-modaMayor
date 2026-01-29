-- Add base_cost column to order_items to track original product cost at order creation
-- This allows detecting price changes and deciding whether to recalculate tiers

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS base_cost NUMERIC(10,2) DEFAULT 0;

-- Update existing rows: infer base_cost from current price
-- This is a best-effort for existing data
-- For tier 0 (wholesale): base_cost = price / 1.0 (but we need to check pricing_config)
-- For tier 1 (discount1): base_cost = price / 2.5
-- For tier 2 (discount2): base_cost = price / 1.75

-- We'll just set it to 0 for now, and it will be populated correctly on next sync
UPDATE order_items SET base_cost = 0 WHERE base_cost IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE order_items ALTER COLUMN base_cost SET NOT NULL;
