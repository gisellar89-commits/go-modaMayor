-- Crear tabla de preguntas frecuentes
CREATE TABLE IF NOT EXISTS faqs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    category VARCHAR(100)
);

-- Índice para búsquedas por estado activo
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(active);

-- Índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("order");

-- Índice para categoría
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
