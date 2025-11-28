-- Migration: añadir índice único para evitar duplicados de stock por (location, product, variant nullable)
-- Usamos COALESCE para tratar NULL en variant_id como 0

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_product_variant ON location_stocks (location, product_id, COALESCE(variant_id, 0));
