-- Registrar todas las migraciones existentes como aplicadas
-- Generado: 2026-02-01
-- Ejecutar en producción ANTES de hacer el deploy del nuevo código

-- Este SQL registra las migraciones que ya fueron ejecutadas manualmente
-- para que el nuevo sistema automático no intente ejecutarlas de nuevo

INSERT INTO migration_records (name) VALUES ('20250115_add_base_cost_to_order_items.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20250120_create_remitos_internos.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251018_add_unique_index_location_stocks.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251026_add_topbar_table.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251103_add_cartitem_stock_flags.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251107_add_reserved_stock_and_cartitem_location.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251107_seed_location_stocks.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251109_add_product_fields.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251109_create_suppliers_size_tables.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251110_create_colors.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251110_seed_common_colors.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251111_add_unique_index_size_values.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251111_seed_size_types_and_values.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251112_create_stock_movements.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251114_add_product_code.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251115_create_price_tiers.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251116_add_tags_and_seasons.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251116_add_tags_and_seasons_table.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251116_create_home_section_configs.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251119_add_phone_to_users.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251119_create_addresses_table.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251119_create_contact_settings_table.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251119_create_faqs_table.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251220_add_deleted_at_home_section_configs.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251223_seed_pricing_config.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251224_add_cart_id_to_orders.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251224_add_price_to_variants.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251224_remove_price_from_variants.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20251226_add_cart_expiration_fields.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20260110_add_variant_info_to_order_items.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20260126_add_pending_reason_to_cart_items.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('20260130_seed_admin_user.sql') ON CONFLICT (name) DO NOTHING;
INSERT INTO migration_records (name) VALUES ('fix_cart_estados.sql') ON CONFLICT (name) DO NOTHING;

-- Verificar que se registraron correctamente
SELECT COUNT(*) as total_migraciones FROM migration_records;

-- Ver las últimas 10 registradas
SELECT name, to_timestamp(applied_at) as fecha_aplicacion 
FROM migration_records 
ORDER BY applied_at DESC 
LIMIT 10;
