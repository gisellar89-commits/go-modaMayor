-- Agregar columna deleted_at para soft deletes en home_section_configs
ALTER TABLE home_section_configs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Crear índice para optimizar queries que excluyen eliminados
CREATE INDEX IF NOT EXISTS idx_home_section_configs_deleted_at ON home_section_configs(deleted_at);
