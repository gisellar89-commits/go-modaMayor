-- Create suppliers, size_types and size_values tables

CREATE TABLE IF NOT EXISTS suppliers (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  name varchar(255) NOT NULL UNIQUE,
  code varchar(100) UNIQUE,
  contact text,
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS size_types (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  key varchar(100) NOT NULL UNIQUE,
  name varchar(255),
  description text,
  is_singleton boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS size_values (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  size_type_id bigint REFERENCES size_types(id) ON DELETE CASCADE,
  value varchar(100),
  ordinal int
);

-- Seed common size types and some sample values
INSERT INTO size_types (key, name, description, is_singleton)
VALUES
  ('unico', 'Talle único', 'Producto sin talles', true),
  ('numerico', 'Talles numéricos', 'Talles 34,36,38...'),
  ('letras', 'Talles con letras', 'S, M, L, XL'),
  ('jeans', 'Talle jeans', 'Talle jeans (34,36...)'),
  ('especiales', 'Talles especiales', 'Talles especiales')
ON CONFLICT (key) DO NOTHING;

-- Insert some sample size_values for numeric and letters if not already present
WITH st AS (
  SELECT id FROM size_types WHERE key = 'numerico' LIMIT 1
)
INSERT INTO size_values (size_type_id, value, ordinal)
SELECT st.id, v.val, v.ord FROM st, (VALUES ('34',1),('36',2),('38',3),('40',4)) AS v(val,ord)
ON CONFLICT DO NOTHING;

WITH st2 AS (
  SELECT id FROM size_types WHERE key = 'letras' LIMIT 1
)
INSERT INTO size_values (size_type_id, value, ordinal)
SELECT st2.id, v.val, v.ord FROM st2, (VALUES ('XS',1),('S',2),('M',3),('L',4),('XL',5)) AS v(val,ord)
ON CONFLICT DO NOTHING;
