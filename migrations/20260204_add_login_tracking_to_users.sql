-- Agregar campos para tracking de login y actividad de usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;

-- Índice para búsquedas eficientes de vendedoras online
CREATE INDEX IF NOT EXISTS idx_users_online_seller ON users(role, is_online, active) WHERE role = 'vendedor';
