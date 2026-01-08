-- Migration: Añadir índice único para evitar duplicados de talles por (size_type_id, value)
-- Esto permite que los seeders usen ON CONFLICT (size_type_id, value) DO NOTHING sin error.

CREATE UNIQUE INDEX IF NOT EXISTS idx_size_values_type_value ON size_values (size_type_id, value);
