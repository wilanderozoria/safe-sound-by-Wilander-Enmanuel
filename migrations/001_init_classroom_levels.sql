-- 1. Crear tabla de niveles de aula
CREATE TABLE IF NOT EXISTS classroom_levels (
  room_id TEXT PRIMARY KEY,
  level FLOAT NOT NULL,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activar Row Level Security (RLS)
ALTER TABLE classroom_levels ENABLE ROW LEVEL SECURITY;

-- 3. Política: Permitir lectura pública (para el Monitor)
CREATE POLICY "Allow public read access"
ON classroom_levels FOR SELECT
USING (true);

-- 4. Política: Permitir actualización pública (para los Teléfonos)
CREATE POLICY "Allow public upsert access"
ON classroom_levels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON classroom_levels FOR UPDATE
USING (true);

-- 5. Activar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE classroom_levels;
