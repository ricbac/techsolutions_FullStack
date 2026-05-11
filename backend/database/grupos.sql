-- ============================================================
-- TechSolutions v2.0
-- Modulo de grupos/equipos de clientes
-- Ejecutar despues de backend/database/schema.sql
-- ============================================================

-- ============================================================
-- 1. Tabla principal de grupos
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_grupos (
  id_grupo BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_grupos_estado CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================
-- 2. Clientes asignados a grupos
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_grupo_clientes (
  id BIGSERIAL PRIMARY KEY,
  id_grupo BIGINT NOT NULL REFERENCES tb_grupos(id_grupo) ON DELETE CASCADE,
  id_usuario BIGINT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_grupo_cliente UNIQUE (id_grupo, id_usuario)
);

-- ============================================================
-- 3. Grupos asignados a proyectos
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_proyecto_grupos (
  id BIGSERIAL PRIMARY KEY,
  id_proyecto BIGINT NOT NULL REFERENCES tb_proyectos(id_proyecto) ON DELETE CASCADE,
  id_grupo BIGINT NOT NULL REFERENCES tb_grupos(id_grupo) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_proyecto_grupo UNIQUE (id_proyecto, id_grupo)
);

-- ============================================================
-- 4. Indices utiles
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_grupos_estado ON tb_grupos (estado);
CREATE INDEX IF NOT EXISTS idx_grupo_clientes_grupo ON tb_grupo_clientes (id_grupo);
CREATE INDEX IF NOT EXISTS idx_grupo_clientes_usuario ON tb_grupo_clientes (id_usuario);
CREATE INDEX IF NOT EXISTS idx_proyecto_grupos_proyecto ON tb_proyecto_grupos (id_proyecto);
CREATE INDEX IF NOT EXISTS idx_proyecto_grupos_grupo ON tb_proyecto_grupos (id_grupo);
