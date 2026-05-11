-- ============================================================
-- TechSolutions v2.0
-- Esquema inicial para Supabase PostgreSQL
-- ============================================================

-- ============================================================
-- 1. Eliminacion segura de tablas
-- Se eliminan primero las tablas dependientes para respetar
-- las relaciones entre claves foraneas.
-- ============================================================

DROP TABLE IF EXISTS tb_historial CASCADE;
DROP TABLE IF EXISTS tb_notificaciones CASCADE;
DROP TABLE IF EXISTS tb_tareas CASCADE;
DROP TABLE IF EXISTS tb_proyecto_clientes CASCADE;
DROP TABLE IF EXISTS tb_proyectos CASCADE;
DROP TABLE IF EXISTS tb_usuarios CASCADE;
DROP TABLE IF EXISTS tb_roles CASCADE;

-- ============================================================
-- 2. Catalogo de roles del sistema
-- Roles esperados: Administrador y Cliente.
-- ============================================================

CREATE TABLE tb_roles (
  id_rol BIGSERIAL PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Usuarios
-- La columna password_hash almacena un hash bcrypt, nunca texto plano.
-- ============================================================

CREATE TABLE tb_usuarios (
  id_usuario BIGSERIAL PRIMARY KEY,
  id_rol BIGINT NOT NULL REFERENCES tb_roles(id_rol) ON DELETE RESTRICT,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  empresa VARCHAR(120),
  telefono VARCHAR(30),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  ultimo_acceso TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_usuarios_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

-- ============================================================
-- 4. Proyectos
-- Creados por un usuario administrador. Si el creador se elimina,
-- el proyecto se conserva con la referencia en NULL.
-- ============================================================

CREATE TABLE tb_proyectos (
  id_proyecto BIGSERIAL PRIMARY KEY,
  creado_por BIGINT REFERENCES tb_usuarios(id_usuario) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
  progreso NUMERIC(5,2) NOT NULL DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_proyectos_estado CHECK (estado IN ('pendiente', 'en_progreso', 'pausado', 'finalizado', 'cancelado')),
  CONSTRAINT chk_proyectos_prioridad CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  CONSTRAINT chk_proyectos_progreso CHECK (progreso >= 0 AND progreso <= 100),
  CONSTRAINT chk_proyectos_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

-- ============================================================
-- 5. Relacion entre proyectos y clientes
-- Permite asignar uno o varios clientes a un proyecto.
-- ============================================================

CREATE TABLE tb_proyecto_clientes (
  id_proyecto_cliente BIGSERIAL PRIMARY KEY,
  id_proyecto BIGINT NOT NULL REFERENCES tb_proyectos(id_proyecto) ON DELETE CASCADE,
  id_cliente BIGINT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_proyecto_cliente UNIQUE (id_proyecto, id_cliente)
);

-- ============================================================
-- 6. Tareas
-- Las tareas pertenecen a un proyecto y pueden asignarse a un usuario.
-- Si el proyecto se elimina, sus tareas se eliminan tambien.
-- ============================================================

CREATE TABLE tb_tareas (
  id_tarea BIGSERIAL PRIMARY KEY,
  id_proyecto BIGINT NOT NULL REFERENCES tb_proyectos(id_proyecto) ON DELETE CASCADE,
  asignado_a BIGINT REFERENCES tb_usuarios(id_usuario) ON DELETE SET NULL,
  creado_por BIGINT REFERENCES tb_usuarios(id_usuario) ON DELETE SET NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
  fecha_inicio DATE,
  fecha_limite DATE,
  fecha_completada TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tareas_estado CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  CONSTRAINT chk_tareas_prioridad CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  CONSTRAINT chk_tareas_fechas CHECK (fecha_limite IS NULL OR fecha_inicio IS NULL OR fecha_limite >= fecha_inicio)
);

-- ============================================================
-- 7. Notificaciones
-- Las notificaciones se eliminan con el usuario destinatario.
-- Las referencias a proyecto y tarea se conservan como NULL si se borran.
-- ============================================================

CREATE TABLE tb_notificaciones (
  id_notificacion BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL REFERENCES tb_usuarios(id_usuario) ON DELETE CASCADE,
  id_proyecto BIGINT REFERENCES tb_proyectos(id_proyecto) ON DELETE SET NULL,
  id_tarea BIGINT REFERENCES tb_tareas(id_tarea) ON DELETE SET NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'info',
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notificaciones_tipo CHECK (tipo IN ('info', 'alerta', 'tarea', 'proyecto', 'sistema'))
);

-- ============================================================
-- 8. Historial
-- Mantiene trazabilidad de acciones. Usa SET NULL para conservar
-- eventos aunque se eliminen usuarios, proyectos o tareas.
-- ============================================================

CREATE TABLE tb_historial (
  id_historial BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT REFERENCES tb_usuarios(id_usuario) ON DELETE SET NULL,
  id_proyecto BIGINT REFERENCES tb_proyectos(id_proyecto) ON DELETE SET NULL,
  id_tarea BIGINT REFERENCES tb_tareas(id_tarea) ON DELETE SET NULL,
  accion VARCHAR(80) NOT NULL,
  descripcion TEXT,
  entidad VARCHAR(50),
  id_entidad BIGINT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. Indices utiles
-- Optimizan busquedas frecuentes por correo, proyecto, usuario
-- asignado, estado y notificaciones pendientes.
-- ============================================================

CREATE INDEX idx_usuarios_correo ON tb_usuarios (correo);
CREATE INDEX idx_usuarios_rol ON tb_usuarios (id_rol);
CREATE INDEX idx_proyectos_estado ON tb_proyectos (estado);
CREATE INDEX idx_proyectos_creado_por ON tb_proyectos (creado_por);
CREATE INDEX idx_proyecto_clientes_proyecto ON tb_proyecto_clientes (id_proyecto);
CREATE INDEX idx_proyecto_clientes_cliente ON tb_proyecto_clientes (id_cliente);
CREATE INDEX idx_tareas_proyecto ON tb_tareas (id_proyecto);
CREATE INDEX idx_tareas_asignado_a ON tb_tareas (asignado_a);
CREATE INDEX idx_tareas_estado ON tb_tareas (estado);
CREATE INDEX idx_notificaciones_usuario ON tb_notificaciones (id_usuario);
CREATE INDEX idx_notificaciones_leida ON tb_notificaciones (leida);
CREATE INDEX idx_historial_usuario ON tb_historial (id_usuario);
CREATE INDEX idx_historial_proyecto ON tb_historial (id_proyecto);

-- ============================================================
-- 10. Datos iniciales
-- Usuario administrador temporal:
-- correo: admin@techsolutions.com
-- password temporal: Admin12345
-- La contrasena se guarda como hash bcrypt.
-- ============================================================

INSERT INTO tb_roles (nombre_rol, descripcion)
VALUES
  ('Administrador', 'Rol con acceso completo al sistema'),
  ('Cliente', 'Rol para clientes con acceso a sus proyectos y tareas');

INSERT INTO tb_usuarios (id_rol, nombre, correo, password_hash, estado)
VALUES (
  (SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Administrador'),
  'Administrador Inicial',
  'admin@techsolutions.com',
  '$2b$10$P.NGDc0O6J2NZYF05mVuAu04SnFTY4ACS75q74YIa81tkN7pU6uCe',
  'activo'
);
