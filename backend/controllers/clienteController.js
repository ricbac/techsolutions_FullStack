const pool = require('../config/db')
const { notificarAdministradores } = require('../utils/notificaciones')

const actualizarProgresoProyecto = async (db, idProyecto) => {
  await db.query(
    `
      UPDATE tb_proyectos
      SET
        progreso = COALESCE((
          SELECT ROUND(
            COUNT(*) FILTER (WHERE estado = 'completada') * 100.0 / NULLIF(COUNT(*), 0),
            2
          )
          FROM tb_tareas
          WHERE id_proyecto = $1
        ), 0),
        fecha_actualizacion = NOW()
      WHERE id_proyecto = $1
    `,
    [idProyecto],
  )
}

const obtenerDashboardCliente = async (req, res) => {
  try {
    const idCliente = req.usuario.id_usuario

    const dashboardQuery = await pool.query(
      `
        SELECT
          (
            SELECT COUNT(DISTINCT pc.id_proyecto)
            FROM tb_proyecto_clientes pc
            WHERE pc.id_cliente = $1
          )::INT AS "totalProyectosAsignados",
          (
            SELECT COUNT(*)
            FROM tb_tareas t
            WHERE t.asignado_a = $1
          )::INT AS "totalTareas",
          (
            SELECT COUNT(*)
            FROM tb_tareas t
            WHERE t.asignado_a = $1
              AND t.estado = 'pendiente'
          )::INT AS "tareasPendientes",
          (
            SELECT COUNT(*)
            FROM tb_tareas t
            WHERE t.asignado_a = $1
              AND t.estado = 'completada'
          )::INT AS "tareasCompletadas",
          (
            SELECT COUNT(*)
            FROM tb_tareas t
            WHERE t.asignado_a = $1
              AND t.fecha_limite < CURRENT_DATE
              AND t.estado <> 'completada'
          )::INT AS "tareasVencidas"
      `,
      [idCliente],
    )

    return res.json(dashboardQuery.rows[0])
  } catch (error) {
    console.error('Error al obtener dashboard cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener dashboard del cliente',
    })
  }
}

const listarProyectosCliente = async (req, res) => {
  try {
    const idCliente = req.usuario.id_usuario

    const proyectosQuery = await pool.query(
      `
        SELECT
          p.id_proyecto,
          p.nombre,
          p.descripcion,
          p.estado,
          p.prioridad,
          p.progreso,
          p.fecha_inicio,
          p.fecha_fin
        FROM tb_proyecto_clientes pc
        INNER JOIN tb_proyectos p ON p.id_proyecto = pc.id_proyecto
        WHERE pc.id_cliente = $1
        ORDER BY p.fecha_creacion DESC
      `,
      [idCliente],
    )

    return res.json(proyectosQuery.rows)
  } catch (error) {
    console.error('Error al listar proyectos cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar proyectos del cliente',
    })
  }
}

const obtenerProyectoClientePorId = async (req, res) => {
  try {
    const idCliente = req.usuario.id_usuario
    const { id } = req.params

    const proyectoQuery = await pool.query(
      `
        SELECT
          p.id_proyecto,
          p.nombre,
          p.descripcion,
          p.estado,
          p.prioridad,
          p.progreso,
          p.fecha_inicio,
          p.fecha_fin,
          p.fecha_creacion,
          p.fecha_actualizacion
        FROM tb_proyecto_clientes pc
        INNER JOIN tb_proyectos p ON p.id_proyecto = pc.id_proyecto
        WHERE pc.id_cliente = $1
          AND p.id_proyecto = $2
        LIMIT 1
      `,
      [idCliente, id],
    )

    if (proyectoQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Proyecto no encontrado para este cliente',
      })
    }

    const tareasQuery = await pool.query(
      `
        SELECT
          id_tarea,
          titulo,
          descripcion,
          estado,
          prioridad,
          fecha_inicio,
          fecha_limite,
          fecha_completada
        FROM tb_tareas
        WHERE id_proyecto = $1
          AND asignado_a = $2
        ORDER BY fecha_creacion DESC
      `,
      [id, idCliente],
    )

    return res.json({
      ...proyectoQuery.rows[0],
      tareas: tareasQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener proyecto cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener proyecto del cliente',
    })
  }
}

const listarTareasCliente = async (req, res) => {
  try {
    const idCliente = req.usuario.id_usuario
    const { estado, prioridad, proyecto } = req.query
    const filtros = ['t.asignado_a = $1']
    const valores = [idCliente]

    if (estado) {
      valores.push(estado)
      filtros.push(`t.estado = $${valores.length}`)
    }

    if (prioridad) {
      valores.push(prioridad)
      filtros.push(`t.prioridad = $${valores.length}`)
    }

    if (proyecto) {
      valores.push(proyecto)
      filtros.push(`t.id_proyecto = $${valores.length}`)
    }

    const tareasQuery = await pool.query(
      `
        SELECT
          t.id_tarea,
          t.id_proyecto,
          p.nombre AS proyecto,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada
        FROM tb_tareas t
        INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
        WHERE ${filtros.join(' AND ')}
        ORDER BY t.fecha_creacion DESC
      `,
      valores,
    )

    return res.json(tareasQuery.rows)
  } catch (error) {
    console.error('Error al listar tareas cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar tareas del cliente',
    })
  }
}

const completarTareaCliente = async (req, res) => {
  const db = await pool.connect()

  try {
    const idCliente = req.usuario.id_usuario
    const { id } = req.params

    await db.query('BEGIN')

    const tareaQuery = await db.query(
      `
        UPDATE tb_tareas
        SET
          estado = 'completada',
          fecha_completada = COALESCE(fecha_completada, NOW()),
          fecha_actualizacion = NOW()
        WHERE id_tarea = $1
          AND asignado_a = $2
        RETURNING *
      `,
      [id, idCliente],
    )

    if (tareaQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(404).json({
        mensaje: 'Tarea no encontrada para este cliente',
      })
    }

    await actualizarProgresoProyecto(db, tareaQuery.rows[0].id_proyecto)
    await notificarAdministradores(db, {
      id_proyecto: tareaQuery.rows[0].id_proyecto,
      id_tarea: tareaQuery.rows[0].id_tarea,
      titulo: 'Tarea completada',
      mensaje: `El cliente completo la tarea "${tareaQuery.rows[0].titulo}".`,
      tipo: 'success',
    })
    await db.query('COMMIT')

    return res.json({
      mensaje: 'Tarea marcada como completada',
      tarea: tareaQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al completar tarea cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al completar tarea',
    })
  } finally {
    db.release()
  }
}

module.exports = {
  obtenerDashboardCliente,
  listarProyectosCliente,
  obtenerProyectoClientePorId,
  listarTareasCliente,
  completarTareaCliente,
}
