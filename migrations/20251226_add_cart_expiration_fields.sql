-- Add expiration tracking fields to carts table
-- reserved_at: timestamp when cart transitioned to 'listo_para_pago' and stock was reserved
-- expires_at: timestamp when the reservation expires (24 hours after reserved_at)

ALTER TABLE carts ADD COLUMN IF NOT EXISTS reserved_at timestamp;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS expires_at timestamp;

-- Create index for efficient querying of expired carts
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at) WHERE expires_at IS NOT NULL AND estado = 'listo_para_pago';
