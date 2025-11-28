-- Seed location_stocks for a few variants (adjust ids/quantities as needed)
-- This migration inserts location stock rows using product_variants to set product_id.

-- For variant id 102
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'deposito', 10, 0 FROM product_variants pv WHERE pv.id = 102;
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'mendoza', 5, 0 FROM product_variants pv WHERE pv.id = 102;

-- For variant id 26
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'deposito', 8, 0 FROM product_variants pv WHERE pv.id = 26;
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'salta', 3, 0 FROM product_variants pv WHERE pv.id = 26;

-- For variant id 111
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'deposito', 12, 0 FROM product_variants pv WHERE pv.id = 111;
INSERT INTO location_stocks (created_at, updated_at, product_id, variant_id, location, stock, reserved)
SELECT now(), now(), pv.product_id, pv.id, 'mendoza', 6, 0 FROM product_variants pv WHERE pv.id = 111;

-- NOTE: If your project uses a migrations runner, apply this migration the normal way.
-- If you prefer, run the included Go seeder tool `cmd/seed_locations.go` which uses the same DB config as the app.
