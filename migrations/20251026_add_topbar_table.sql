-- Migration: add topbar table
CREATE TABLE IF NOT EXISTS topbars (
  id SERIAL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  center_text text,
  social_links json
);
