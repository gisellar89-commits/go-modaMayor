-- Crea un usuario admin por defecto si no existe
INSERT INTO users (name, email, phone, password, role, active, created_at, updated_at)
VALUES (
  'Admin',
  'admin@tudominio.com',
  '1234567890',
  '$2b$12$QiKLPcXRTQxo2l8naROgC.yVuGm9qBjLK7wzXM75VRiqB.AlWR2sS',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
