-- Migration: Agrega campo pending_reason a cart_items para diferenciar motivo de pendiente
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS pending_reason VARCHAR(32) DEFAULT 'user_request';
-- Opciones: 'user_request', 'out_of_stock_during_process'
