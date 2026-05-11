-- ============================================================
-- TechSolutions v2.0
-- Patch incremental para notificaciones reales
-- ============================================================

-- Asegura columnas esperadas sin perder datos existentes.
ALTER TABLE tb_notificaciones
  ADD COLUMN IF NOT EXISTS id_usuario BIGINT REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS id_proyecto BIGINT REFERENCES tb_proyectos(id_proyecto) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_tarea BIGINT REFERENCES tb_tareas(id_tarea) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(150),
  ADD COLUMN IF NOT EXISTS mensaje TEXT,
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS leida BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Normaliza tipos antiguos antes de aplicar la nueva restriccion.
UPDATE tb_notificaciones
SET tipo = CASE
  WHEN tipo IN ('success', 'warning', 'danger', 'info') THEN tipo
  WHEN tipo IN ('alerta', 'tarea', 'proyecto', 'sistema') THEN 'info'
  ELSE 'info'
END;

-- Reemplaza cualquier CHECK anterior de tipo por el catalogo nuevo.
ALTER TABLE tb_notificaciones
  DROP CONSTRAINT IF EXISTS chk_notificaciones_tipo;

ALTER TABLE tb_notificaciones
  ADD CONSTRAINT chk_notificaciones_tipo
  CHECK (tipo IN ('info', 'success', 'warning', 'danger'));

-- Indices utiles para bandeja y conteo de no leidas.
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha
  ON tb_notificaciones (id_usuario, fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida
  ON tb_notificaciones (id_usuario, leida);
