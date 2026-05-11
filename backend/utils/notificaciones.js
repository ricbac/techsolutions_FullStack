const pool = require('../config/db')

const TIPOS_VALIDOS = ['info', 'success', 'warning', 'danger']

const crearNotificacion = async (
  db,
  { id_usuario, titulo, mensaje, tipo = 'info', id_proyecto = null, id_tarea = null },
) => {
  if (!id_usuario || !titulo || !mensaje) return null

  const tipoNormalizado = TIPOS_VALIDOS.includes(tipo) ? tipo : 'info'

  const resultado = await db.query(
    `
      INSERT INTO tb_notificaciones (
        id_usuario,
        id_proyecto,
        id_tarea,
        titulo,
        mensaje,
        tipo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [id_usuario, id_proyecto, id_tarea, titulo, mensaje, tipoNormalizado],
  )

  return resultado.rows[0]
}

const obtenerIdsAdministradores = async (db = pool) => {
  const adminsQuery = await db.query(`
    SELECT u.id_usuario
    FROM tb_usuarios u
    INNER JOIN tb_roles r ON r.id_rol = u.id_rol
    WHERE r.nombre_rol = 'Administrador'
      AND u.estado = 'activo'
  `)

  return adminsQuery.rows.map((admin) => admin.id_usuario)
}

const notificarAdministradores = async (db, notificacion) => {
  const administradores = await obtenerIdsAdministradores(db)

  for (const idUsuario of administradores) {
    await crearNotificacion(db, {
      ...notificacion,
      id_usuario: idUsuario,
    })
  }
}

const obtenerClientesDeProyecto = async (db, idProyecto) => {
  const clientesQuery = await db.query(
    `
      SELECT DISTINCT id_usuario
      FROM (
        SELECT pc.id_cliente AS id_usuario
        FROM tb_proyecto_clientes pc
        WHERE pc.id_proyecto = $1

        UNION

        SELECT gc.id_usuario
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_grupo_clientes gc ON gc.id_grupo = pg.id_grupo
        WHERE pg.id_proyecto = $1
      ) clientes
      WHERE id_usuario IS NOT NULL
    `,
    [idProyecto],
  )

  return clientesQuery.rows.map((cliente) => cliente.id_usuario)
}

const notificarClientesProyecto = async (db, idProyecto, notificacion) => {
  const clientes = await obtenerClientesDeProyecto(db, idProyecto)

  for (const idUsuario of clientes) {
    await crearNotificacion(db, {
      ...notificacion,
      id_usuario: idUsuario,
      id_proyecto: idProyecto,
    })
  }
}

const crearNotificacionesTareasVencidas = async (db = pool, idUsuario = null) => {
  const valores = []
  const filtroUsuario = idUsuario ? 'AND t.asignado_a = $1' : ''
  if (idUsuario) valores.push(idUsuario)

  const tareasQuery = await db.query(
    `
      SELECT
        t.id_tarea,
        t.id_proyecto,
        t.asignado_a,
        t.titulo,
        t.fecha_limite,
        p.nombre AS proyecto
      FROM tb_tareas t
      INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
      WHERE t.fecha_limite < CURRENT_DATE
        AND t.estado <> 'completada'
        AND t.asignado_a IS NOT NULL
        ${filtroUsuario}
        AND NOT EXISTS (
          SELECT 1
          FROM tb_notificaciones n
          WHERE n.id_usuario = t.asignado_a
            AND n.id_tarea = t.id_tarea
            AND n.tipo = 'warning'
            AND n.titulo = 'Tarea vencida'
        )
    `,
    valores,
  )

  for (const tarea of tareasQuery.rows) {
    await crearNotificacion(db, {
      id_usuario: tarea.asignado_a,
      id_proyecto: tarea.id_proyecto,
      id_tarea: tarea.id_tarea,
      titulo: 'Tarea vencida',
      mensaje: `La tarea "${tarea.titulo}" del proyecto "${tarea.proyecto}" esta vencida desde ${tarea.fecha_limite}.`,
      tipo: 'warning',
    })
  }

  return tareasQuery.rows.length
}

module.exports = {
  crearNotificacion,
  notificarAdministradores,
  notificarClientesProyecto,
  crearNotificacionesTareasVencidas,
}
