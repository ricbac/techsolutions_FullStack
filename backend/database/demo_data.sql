-- ============================================================
-- TechSolutions
-- Datos demo para presentacion del sistema
-- ============================================================
-- Password temporal para clientes demo: Cliente123
-- Hash bcrypt usado:
-- $2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Limpieza de datos demo
-- No elimina roles ni el administrador admin@techsolutions.com.
-- ============================================================

DELETE FROM tb_historial;
DELETE FROM tb_notificaciones;
DELETE FROM tb_tareas;
DELETE FROM tb_proyecto_grupos;
DELETE FROM tb_proyecto_clientes;
DELETE FROM tb_grupo_clientes;
DELETE FROM tb_grupos;
DELETE FROM tb_proyectos;

DELETE FROM tb_usuarios u
USING tb_roles r
WHERE u.id_rol = r.id_rol
  AND r.nombre_rol = 'Cliente';

-- ============================================================
-- 2. Clientes demo
-- ============================================================

INSERT INTO tb_usuarios (
  id_rol,
  nombre,
  correo,
  password_hash,
  telefono,
  empresa,
  estado
)
VALUES
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Ana Martínez', 'ana.martinez@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1001', 'Comercial Aurora', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Carlos López', 'carlos.lopez@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1002', 'Logistica Central', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'María González', 'maria.gonzalez@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1003', 'Retail Nova', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'José Ramírez', 'jose.ramirez@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1004', 'Finanzas Prisma', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Lucía Pérez', 'lucia.perez@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1005', 'Servicios Norte', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Fernando Castillo', 'fernando.castillo@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1006', 'Industria Delta', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Sofía Morales', 'sofia.morales@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1007', 'Consultores Atlas', 'activo'),
  ((SELECT id_rol FROM tb_roles WHERE nombre_rol = 'Cliente'), 'Diego Herrera', 'diego.herrera@demo.com', '$2b$10$UK9nO9DTC0nFaSOjvfGTwON0n.XUhCaVRbZSy8C9haM8IdmNX44dS', '+502 5550-1008', 'Tecnologia Horizonte', 'activo');

-- ============================================================
-- 3. Grupos y asignacion de clientes
-- ============================================================

INSERT INTO tb_grupos (nombre, descripcion, estado)
VALUES
  ('Equipo Desarrollo Web', 'Clientes vinculados a proyectos de aplicaciones web y portales.', 'activo'),
  ('Equipo Consultoria TI', 'Clientes con procesos de analisis, estrategia y mejora tecnologica.', 'activo'),
  ('Equipo Soporte Empresarial', 'Clientes con proyectos de soporte operativo y seguimiento continuo.', 'activo');

INSERT INTO tb_grupo_clientes (id_grupo, id_usuario)
VALUES
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'carlos.lopez@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Consultoria TI'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'jose.ramirez@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Consultoria TI'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'lucia.perez@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Consultoria TI'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'sofia.morales@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Soporte Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'fernando.castillo@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Soporte Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'diego.herrera@demo.com')),
  ((SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Soporte Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'));

-- ============================================================
-- 4. Proyectos demo
-- ============================================================

INSERT INTO tb_proyectos (
  creado_por,
  nombre,
  descripcion,
  estado,
  prioridad,
  progreso,
  fecha_inicio,
  fecha_fin,
  fecha_creacion
)
VALUES
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    'Sistema CRM Empresarial',
    'Implementacion de CRM para seguimiento comercial, clientes y oportunidades.',
    'en_progreso',
    'alta',
    0,
    (CURRENT_DATE - INTERVAL '28 days')::DATE,
    (CURRENT_DATE + INTERVAL '34 days')::DATE,
    NOW() - INTERVAL '28 days'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    'Plataforma de Inventario',
    'Control de existencias, entradas, salidas y reportes operativos.',
    'planificacion',
    'media',
    0,
    (CURRENT_DATE - INTERVAL '10 days')::DATE,
    (CURRENT_DATE + INTERVAL '55 days')::DATE,
    NOW() - INTERVAL '10 days'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    'App de Gestion de Tickets',
    'Mesa de ayuda para registrar, priorizar y cerrar solicitudes empresariales.',
    'en_revision',
    'urgente',
    0,
    (CURRENT_DATE - INTERVAL '45 days')::DATE,
    (CURRENT_DATE + INTERVAL '12 days')::DATE,
    NOW() - INTERVAL '45 days'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    'Portal de Reportes Ejecutivos',
    'Portal web para visualizar indicadores ejecutivos y reportes PDF.',
    'completado',
    'baja',
    0,
    (CURRENT_DATE - INTERVAL '70 days')::DATE,
    (CURRENT_DATE - INTERVAL '6 days')::DATE,
    NOW() - INTERVAL '70 days'
  );

-- Clientes individuales por proyecto.
INSERT INTO tb_proyecto_clientes (id_proyecto, id_cliente)
VALUES
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'jose.ramirez@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'carlos.lopez@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'lucia.perez@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'diego.herrera@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'sofia.morales@demo.com')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'fernando.castillo@demo.com'));

-- Grupos por proyecto.
INSERT INTO tb_proyecto_grupos (id_proyecto, id_grupo)
VALUES
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Consultoria TI')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Soporte Empresarial')),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web'));

-- ============================================================
-- 5. Tareas demo
-- Fechas pensadas para dashboard, reportes y Gantt.
-- ============================================================

INSERT INTO tb_tareas (
  id_proyecto,
  asignado_a,
  creado_por,
  titulo,
  descripcion,
  estado,
  prioridad,
  fecha_inicio,
  fecha_limite,
  fecha_completada,
  fecha_creacion
)
VALUES
  -- Sistema CRM Empresarial
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Levantamiento de requerimientos CRM', 'Sesiones iniciales con equipo comercial.', 'completada', 'alta', (CURRENT_DATE - INTERVAL '28 days')::DATE, (CURRENT_DATE - INTERVAL '22 days')::DATE, NOW() - INTERVAL '22 days', NOW() - INTERVAL '28 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'carlos.lopez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Diseno de pipeline comercial', 'Definir etapas, reglas y responsables.', 'completada', 'media', (CURRENT_DATE - INTERVAL '21 days')::DATE, (CURRENT_DATE - INTERVAL '14 days')::DATE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '21 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Modulo de clientes', 'Pantallas de consulta y seguimiento de clientes.', 'en_progreso', 'alta', (CURRENT_DATE - INTERVAL '13 days')::DATE, (CURRENT_DATE + INTERVAL '8 days')::DATE, NULL, NOW() - INTERVAL '13 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'jose.ramirez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Integracion de actividades', 'Registrar llamadas, reuniones y notas comerciales.', 'pendiente', 'media', (CURRENT_DATE + INTERVAL '2 days')::DATE, (CURRENT_DATE + INTERVAL '14 days')::DATE, NULL, NOW() - INTERVAL '5 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Revision de permisos por rol', 'Ajustar permisos para asesores y gerentes.', 'pendiente', 'urgente', (CURRENT_DATE - INTERVAL '6 days')::DATE, (CURRENT_DATE - INTERVAL '1 day')::DATE, NULL, NOW() - INTERVAL '6 days'),

  -- Plataforma de Inventario
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'carlos.lopez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Mapa de almacenes', 'Definir bodegas, ubicaciones y responsables.', 'completada', 'media', (CURRENT_DATE - INTERVAL '10 days')::DATE, (CURRENT_DATE - INTERVAL '5 days')::DATE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Catalogo de productos', 'Estructura de categorias, SKU y unidades.', 'en_progreso', 'alta', (CURRENT_DATE - INTERVAL '4 days')::DATE, (CURRENT_DATE + INTERVAL '9 days')::DATE, NULL, NOW() - INTERVAL '4 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'lucia.perez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Flujo de entradas', 'Proceso para compras y recepcion.', 'pendiente', 'media', (CURRENT_DATE + INTERVAL '3 days')::DATE, (CURRENT_DATE + INTERVAL '18 days')::DATE, NULL, NOW() - INTERVAL '3 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'sofia.morales@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Alertas de stock bajo', 'Definir umbrales y notificaciones.', 'pendiente', 'urgente', (CURRENT_DATE - INTERVAL '8 days')::DATE, (CURRENT_DATE - INTERVAL '2 days')::DATE, NULL, NOW() - INTERVAL '8 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'jose.ramirez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Reporte de rotacion', 'Indicadores de productos con alta y baja rotacion.', 'cancelada', 'baja', (CURRENT_DATE - INTERVAL '2 days')::DATE, (CURRENT_DATE + INTERVAL '7 days')::DATE, NULL, NOW() - INTERVAL '2 days'),

  -- App de Gestion de Tickets
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'lucia.perez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Definicion de categorias de ticket', 'Clasificacion por soporte, incidentes y solicitudes.', 'completada', 'alta', (CURRENT_DATE - INTERVAL '45 days')::DATE, (CURRENT_DATE - INTERVAL '39 days')::DATE, NOW() - INTERVAL '39 days', NOW() - INTERVAL '45 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'fernando.castillo@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Bandeja de tickets', 'Vista principal para gestion operativa.', 'completada', 'urgente', (CURRENT_DATE - INTERVAL '38 days')::DATE, (CURRENT_DATE - INTERVAL '25 days')::DATE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '38 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'diego.herrera@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Reglas de prioridad SLA', 'Prioridad por impacto, urgencia y cliente.', 'en_progreso', 'urgente', (CURRENT_DATE - INTERVAL '24 days')::DATE, (CURRENT_DATE + INTERVAL '3 days')::DATE, NULL, NOW() - INTERVAL '24 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Panel de seguimiento cliente', 'Vista para que clientes revisen el avance.', 'pendiente', 'media', (CURRENT_DATE - INTERVAL '12 days')::DATE, (CURRENT_DATE - INTERVAL '3 days')::DATE, NULL, NOW() - INTERVAL '12 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'diego.herrera@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Pruebas de cierre de ticket', 'Validacion de estados y cierre operativo.', 'pendiente', 'alta', (CURRENT_DATE + INTERVAL '1 day')::DATE, (CURRENT_DATE + INTERVAL '10 days')::DATE, NULL, NOW() - INTERVAL '6 days'),

  -- Portal de Reportes Ejecutivos
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'sofia.morales@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Definicion de KPIs ejecutivos', 'Indicadores para direccion general.', 'completada', 'media', (CURRENT_DATE - INTERVAL '70 days')::DATE, (CURRENT_DATE - INTERVAL '60 days')::DATE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '70 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'fernando.castillo@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Diseno de dashboard ejecutivo', 'Visualizacion de metricas y graficas.', 'completada', 'alta', (CURRENT_DATE - INTERVAL '59 days')::DATE, (CURRENT_DATE - INTERVAL '42 days')::DATE, NOW() - INTERVAL '42 days', NOW() - INTERVAL '59 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Exportacion PDF', 'Generacion de informes para reuniones directivas.', 'completada', 'alta', (CURRENT_DATE - INTERVAL '41 days')::DATE, (CURRENT_DATE - INTERVAL '28 days')::DATE, NOW() - INTERVAL '28 days', NOW() - INTERVAL '41 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'carlos.lopez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Revision final con usuarios', 'Validacion de datos y flujo de consulta.', 'completada', 'media', (CURRENT_DATE - INTERVAL '27 days')::DATE, (CURRENT_DATE - INTERVAL '12 days')::DATE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '27 days'),
  ((SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com'), (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), 'Ajustes menores post-entrega', 'Cambios menores solicitados despues de entrega.', 'cancelada', 'baja', (CURRENT_DATE - INTERVAL '9 days')::DATE, (CURRENT_DATE - INTERVAL '6 days')::DATE, NULL, NOW() - INTERVAL '9 days');

-- ============================================================
-- 6. Actualizacion de progreso por proyecto
-- ============================================================

UPDATE tb_proyectos p
SET
  progreso = COALESCE((
    SELECT ROUND(
      COUNT(*) FILTER (WHERE t.estado = 'completada') * 100.0 / NULLIF(COUNT(*), 0),
      2
    )
    FROM tb_tareas t
    WHERE t.id_proyecto = p.id_proyecto
  ), 0),
  fecha_actualizacion = NOW();

-- ============================================================
-- 7. Notificaciones demo
-- ============================================================

INSERT INTO tb_notificaciones (
  id_usuario,
  id_proyecto,
  id_tarea,
  titulo,
  mensaje,
  tipo,
  leida,
  fecha_creacion
)
VALUES
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'ana.martinez@demo.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'),
    (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Revision de permisos por rol'),
    'Tarea vencida',
    'La tarea "Revision de permisos por rol" requiere atencion.',
    'warning',
    FALSE,
    NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'maria.gonzalez@demo.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'),
    (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Catalogo de productos'),
    'Nueva tarea asignada',
    'Se te asigno la tarea "Catalogo de productos".',
    'info',
    FALSE,
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'lucia.perez@demo.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'),
    NULL,
    'Proyecto actualizado',
    'El proyecto "App de Gestion de Tickets" fue actualizado.',
    'info',
    TRUE,
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'),
    (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Exportacion PDF'),
    'Tarea completada',
    'La tarea "Exportacion PDF" fue marcada como completada.',
    'success',
    FALSE,
    NOW() - INTERVAL '3 hours'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'),
    NULL,
    'Proyecto creado',
    'Se creo el proyecto "Sistema CRM Empresarial".',
    'success',
    TRUE,
    NOW() - INTERVAL '28 days'
  ),
  (
    (SELECT id_usuario FROM tb_usuarios WHERE correo = 'diego.herrera@demo.com'),
    (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'),
    (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Pruebas de cierre de ticket'),
    'Nueva tarea asignada',
    'Se te asigno la tarea "Pruebas de cierre de ticket".',
    'info',
    FALSE,
    NOW() - INTERVAL '6 hours'
  );

-- ============================================================
-- 8. Historial demo
-- ============================================================

INSERT INTO tb_historial (
  id_usuario,
  id_proyecto,
  id_tarea,
  accion,
  descripcion,
  entidad,
  id_entidad,
  fecha_creacion
)
VALUES
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), NULL, NULL, 'cliente_creado', 'Clientes demo cargados para presentacion.', 'cliente', NULL, NOW() - INTERVAL '30 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), NULL, NULL, 'grupo_creado', 'Grupo Equipo Desarrollo Web creado.', 'grupo', (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Desarrollo Web'), NOW() - INTERVAL '29 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), NULL, 'proyecto_creado', 'Proyecto Sistema CRM Empresarial creado.', 'proyecto', (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), NOW() - INTERVAL '28 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), NULL, 'proyecto_creado', 'Proyecto Plataforma de Inventario creado.', 'proyecto', (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Plataforma de Inventario'), NOW() - INTERVAL '10 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'sofia.morales@demo.com'), (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Portal de Reportes Ejecutivos'), (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Definicion de KPIs ejecutivos'), 'tarea_completada', 'Tarea Definicion de KPIs ejecutivos completada.', 'tarea', (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Definicion de KPIs ejecutivos'), NOW() - INTERVAL '8 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'App de Gestion de Tickets'), (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Bandeja de tickets'), 'tarea_completada', 'Tarea Bandeja de tickets completada.', 'tarea', (SELECT id_tarea FROM tb_tareas WHERE titulo = 'Bandeja de tickets'), NOW() - INTERVAL '6 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), NULL, NULL, 'grupo_creado', 'Grupo Equipo Soporte Empresarial creado.', 'grupo', (SELECT id_grupo FROM tb_grupos WHERE nombre = 'Equipo Soporte Empresarial'), NOW() - INTERVAL '4 days'),
  ((SELECT id_usuario FROM tb_usuarios WHERE correo = 'admin@techsolutions.com'), (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), NULL, 'proyecto_actualizado', 'Proyecto Sistema CRM Empresarial actualizado.', 'proyecto', (SELECT id_proyecto FROM tb_proyectos WHERE nombre = 'Sistema CRM Empresarial'), NOW() - INTERVAL '1 day');

COMMIT;

-- ============================================================
-- 9. Consultas de verificacion
-- ============================================================

SELECT COUNT(*)::INT AS total_clientes
FROM tb_usuarios u
INNER JOIN tb_roles r ON r.id_rol = u.id_rol
WHERE r.nombre_rol = 'Cliente';

SELECT COUNT(*)::INT AS total_grupos
FROM tb_grupos;

SELECT COUNT(*)::INT AS total_proyectos
FROM tb_proyectos;

SELECT COUNT(*)::INT AS total_tareas
FROM tb_tareas;

SELECT estado, COUNT(*)::INT AS total
FROM tb_tareas
GROUP BY estado
ORDER BY estado;

SELECT estado, COUNT(*)::INT AS total
FROM tb_proyectos
GROUP BY estado
ORDER BY estado;
