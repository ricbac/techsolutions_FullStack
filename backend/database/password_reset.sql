-- ============================================================
-- TechSolutions
-- Patch incremental para recuperacion de password
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_password_resets (
  id_reset BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token
  ON tb_password_resets (token);

CREATE INDEX IF NOT EXISTS idx_password_resets_usuario
  ON tb_password_resets (id_usuario);
