-- Create colors table

CREATE TABLE IF NOT EXISTS colors (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  key varchar(100) NOT NULL UNIQUE,
  name varchar(255),
  hex varchar(20),
  active boolean DEFAULT true
);

-- Seed some common colors (if not exists)
INSERT INTO colors (key, name, hex, active) VALUES
  ('negro','Negro','#000000',true),
  ('blanco','Blanco','#FFFFFF',true),
  ('rojo','Rojo','#FF0000',true)
ON CONFLICT (key) DO NOTHING;
