-- Tabla de horarios laborales de la tienda
CREATE TABLE IF NOT EXISTS working_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes, ..., 6=Sábado
    is_working_day BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week)
);

-- Tabla de días feriados/no laborables
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Insertar horarios laborales por defecto (Lunes a Viernes de 9:00 a 18:00)
INSERT INTO working_hours (day_of_week, is_working_day, open_time, close_time) VALUES
(0, false, NULL, NULL),  -- Domingo
(1, true, '09:00:00', '18:00:00'),  -- Lunes
(2, true, '09:00:00', '18:00:00'),  -- Martes
(3, true, '09:00:00', '18:00:00'),  -- Miércoles
(4, true, '09:00:00', '18:00:00'),  -- Jueves
(5, true, '09:00:00', '18:00:00'),  -- Viernes
(6, false, NULL, NULL)   -- Sábado
ON CONFLICT (day_of_week) DO NOTHING;

-- Comentarios
COMMENT ON TABLE working_hours IS 'Horarios laborales de la tienda por día de la semana';
COMMENT ON TABLE holidays IS 'Días feriados y no laborables';
COMMENT ON COLUMN working_hours.day_of_week IS '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';
