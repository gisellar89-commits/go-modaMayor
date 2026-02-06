-- Eliminar tablas antiguas
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;

-- Crear tabla simplificada de horarios
CREATE TABLE IF NOT EXISTS store_hours (
    id SERIAL PRIMARY KEY,
    -- Lunes a Viernes
    weekday_morning_open TIME NOT NULL DEFAULT '09:00',
    weekday_morning_close TIME NOT NULL DEFAULT '13:00',
    weekday_afternoon_open TIME,  -- NULL si no hay turno tarde
    weekday_afternoon_close TIME,
    -- Sábado
    saturday_morning_open TIME,
    saturday_morning_close TIME,
    saturday_afternoon_open TIME,
    saturday_afternoon_close TIME,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de feriados simplificada
CREATE TABLE IF NOT EXISTS store_holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
-- Lunes a Viernes: 9-13 y 15-19
-- Sábado: 9-13 (sin tarde)
INSERT INTO store_hours (
    weekday_morning_open, weekday_morning_close,
    weekday_afternoon_open, weekday_afternoon_close,
    saturday_morning_open, saturday_morning_close
) VALUES (
    '09:00', '13:00',
    '15:00', '19:00',
    '09:00', '13:00'
)
ON CONFLICT DO NOTHING;
