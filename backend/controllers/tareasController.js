const pool = require('../config/db')
const { crearNotificacion, notificarAdministradores } = require('../utils/notificaciones')

const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'completada', 'cancelada']
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente']

const normalizarFecha = (fecha) => {
  return fecha || null
}

const normalizarEstadoTarea = (estado = 'pendiente') => {
  // La base de datos usa "completada"; se acepta "completado" como alias.
  return estado === 'completado' ? 'completada' : estado
}

const validarDatosTarea = ({
  titulo,
  estado = 'pendiente',
  prioridad = 'media',
  fecha_inicio,
  fecha_limite,
  id_proyecto,
  id_usuario_asignado,
}) => {
  const estadoNormalizado = normalizarEstadoTarea(estado)

  if (!titulo) return 'El titulo de la tarea es obligatorio'
  if (!id_proyecto) return 'El proyecto es obligatorio'
  if (!id_usuario_asignado) return 'El cliente asignado es obligatorio'
  if (!ESTADOS_TAREA.includes(estadoNormalizado)) return 'Estado de tarea invalido'
  if (!PRIORIDADES.includes(prioridad)) return 'Prioridad de tarea invalida'

  if (fecha_inicio && fecha_limite && fecha_limite < fecha_inicio) {
    return 'La fecha limite debe ser mayor o igual a la fecha de inicio'
  }

  return null
}

const validarProyectoExistente = async (db, idProyecto) => {
  const proyectoQuery = await db.query(
    'SELECT id_proyecto FROM tb_proyectos WHERE id_proyecto = $1 LIMIT 1',
    [idProyecto],
  )

  return proyectoQuery.rows.length > 0
}

const validarClienteExistente = async (db, idUsuario) => {
  const clienteQuery = await db.query(
    `
      SELECT u.id_usuario
      FROM tb_usuarios u
      INNER JOIN tb_roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = $1
        AND r.nombre_rol = 'Cliente'
        AND u.estado = 'activo'
      LIMIT 1
    `,
    [idUsuario],
  )

  return clienteQuery.rows.length > 0
}

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

const listarTareas = async (req, res) => {
  try {
    const { proyecto, cliente, estado, prioridad } = req.query
    const filtros = []
    const valores = []

    if (proyecto) {
      valores.push(proyecto)
      filtros.push(`t.id_proyecto = $${valores.length}`)
    }

    if (cliente) {
      valores.push(cliente)
      filtros.push(`t.asignado_a = $${valores.length}`)
    }

    if (estado) {
      valores.push(normalizarEstadoTarea(estado))
      filtros.push(`t.estado = $${valores.length}`)
    }

    if (prioridad) {
      valores.push(prioridad)
      filtros.push(`t.prioridad = $${valores.length}`)
    }

    const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : ''

    const tareasQuery = await pool.query(
      `
        SELECT
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada,
          p.id_proyecto,
          p.nombre AS proyecto,
          u.id_usuario AS id_cliente_asignado,
          u.nombre AS cliente_asignado,
          u.correo AS cliente_correo
        FROM tb_tareas t
        INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
        LEFT JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
        ${where}
        ORDER BY t.fecha_creacion DESC
      `,
      valores,
    )

    return res.json(tareasQuery.rows)
  } catch (error) {
    console.error('Error al listar tareas:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar tareas',
    })
  }
}

const obtenerTareaPorId = async (req, res) => {
  try {
    const { id } = req.params

    const tareaQuery = await pool.query(
      `
        SELECT
          t.id_tarea,
          t.id_proyecto,
          p.nombre AS proyecto,
          t.asignado_a AS id_usuario_asignado,
          u.nombre AS cliente_asignado,
          u.correo AS cliente_correo,
          t.creado_por,
          creador.nombre AS creado_por_nombre,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada,
          t.fecha_creacion,
          t.fecha_actualizacion
        FROM tb_tareas t
        INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
        LEFT JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
        LEFT JOIN tb_usuarios creador ON creador.id_usuario = t.creado_por
        WHERE t.id_tarea = $1
        LIMIT 1
      `,
      [id],
    )

    if (tareaQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Tarea no encontrada',
      })
    }

    return res.json(tareaQuery.rows[0])
  } catch (error) {
    console.error('Error al obtener tarea:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener tarea',
    })
  }
}

const crearTarea = async (req, res) => {
  const db = await pool.connect()

  try {
    const {
      titulo,
      descripcion,
      estado = 'pendiente',
      prioridad = 'media',
      fecha_inicio,
      fecha_limite,
      id_proyecto,
      id_usuario_asignado,
    } = req.body
    const asignado_a = id_usuario_asignado || req.body.asignado_a
    const estadoNormalizado = normalizarEstadoTarea(estado)
    const fechaCompletada = estadoNormalizado === 'completada' ? new Date() : null

    const errorValidacion = validarDatosTarea({
      titulo,
      estado: estadoNormalizado,
      prioridad,
      fecha_inicio,
      fecha_limite,
      id_proyecto,
      id_usuario_asignado: asignado_a,
    })

    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion })
    }

    await db.query('BEGIN')

    const proyectoExiste = await validarProyectoExistente(db, id_proyecto)
    if (!proyectoExiste) {
      await db.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Proyecto no encontrado' })
    }

    const clienteExiste = await validarClienteExistente(db, asignado_a)
    if (!clienteExiste) {
      await db.query('ROLLBACK')
      return res.status(400).json({
        mensaje: 'El cliente asignado no existe, no esta activo o no tiene rol Cliente',
      })
    }

    const tareaQuery = await db.query(
      `
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
          fecha_completada
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        id_proyecto,
        asignado_a,
        req.usuario.id_usuario,
        titulo,
        descripcion || null,
        estadoNormalizado,
        prioridad,
        normalizarFecha(fecha_inicio),
        normalizarFecha(fecha_limite),
        fechaCompletada,
      ],
    )

    await actualizarProgresoProyecto(db, id_proyecto)
    await crearNotificacion(db, {
      id_usuario: asignado_a,
      id_proyecto,
      id_tarea: tareaQuery.rows[0].id_tarea,
      titulo: 'Nueva tarea asignada',
      mensaje: `Se te asigno la tarea "${titulo}".`,
      tipo: 'info',
    })
    if (estadoNormalizado === 'completada') {
      await notificarAdministradores(db, {
        id_proyecto,
        id_tarea: tareaQuery.rows[0].id_tarea,
        titulo: 'Tarea completada',
        mensaje: `La tarea "${titulo}" fue marcada como completada.`,
        tipo: 'success',
      })
    }
    await db.query('COMMIT')

    return res.status(201).json({
      mensaje: 'Tarea creada correctamente',
      tarea: tareaQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error(error)
    console.error('Error al crear tarea:', error)

    return res.status(500).json({
      mensaje: 'Error interno al crear tarea',
      error: error.message,
      detalle: error.detail || null,
      codigo: error.code || null,
    })
  } finally {
    db.release()
  }
}

const actualizarTarea = async (req, res) => {
  const db = await pool.connect()

  try {
    const { id } = req.params
    const {
      titulo,
      descripcion,
      estado = 'pendiente',
      prioridad = 'media',
      fecha_inicio,
      fecha_limite,
      id_usuario_asignado,
    } = req.body
    const asignado_a = id_usuario_asignado || req.body.asignado_a
    const estadoNormalizado = normalizarEstadoTarea(estado)
    const fechaCompletada =
      estadoNormalizado === 'completada'
        ? new Date()
        : null

    await db.query('BEGIN')

    const tareaActualQuery = await db.query(
      'SELECT id_tarea, id_proyecto, estado FROM tb_tareas WHERE id_tarea = $1 LIMIT 1',
      [id],
    )

    if (tareaActualQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Tarea no encontrada' })
    }

    const idProyecto = tareaActualQuery.rows[0].id_proyecto
    const errorValidacion = validarDatosTarea({
      titulo,
      estado: estadoNormalizado,
      prioridad,
      fecha_inicio,
      fecha_limite,
      id_proyecto: idProyecto,
      id_usuario_asignado: asignado_a,
    })

    if (errorValidacion) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: errorValidacion })
    }

    const clienteExiste = await validarClienteExistente(db, asignado_a)
    if (!clienteExiste) {
      await db.query('ROLLBACK')
      return res.status(400).json({
        mensaje: 'El cliente asignado no existe, no esta activo o no tiene rol Cliente',
      })
    }

    const tareaQuery = await db.query(
      `
        UPDATE tb_tareas
        SET
          asignado_a = $1,
          titulo = $2,
          descripcion = $3,
          estado = $4,
          prioridad = $5,
          fecha_inicio = $6,
          fecha_limite = $7,
          fecha_completada = $8,
          fecha_actualizacion = NOW()
        WHERE id_tarea = $9
        RETURNING *
      `,
      [
        asignado_a,
        titulo,
        descripcion || null,
        estadoNormalizado,
        prioridad,
        normalizarFecha(fecha_inicio),
        normalizarFecha(fecha_limite),
        fechaCompletada,
        id,
      ],
    )

    await actualizarProgresoProyecto(db, idProyecto)
    if (tareaActualQuery.rows[0].estado !== 'completada' && estadoNormalizado === 'completada') {
      await notificarAdministradores(db, {
        id_proyecto: idProyecto,
        id_tarea: tareaQuery.rows[0].id_tarea,
        titulo: 'Tarea completada',
        mensaje: `La tarea "${tareaQuery.rows[0].titulo}" fue marcada como completada.`,
        tipo: 'success',
      })
    }
    await db.query('COMMIT')

    return res.json({
      mensaje: 'Tarea actualizada correctamente',
      tarea: tareaQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error(error)
    console.error('Error al actualizar tarea:', error)

    return res.status(500).json({
      mensaje: 'Error interno al actualizar tarea',
      error: error.message,
      detalle: error.detail || null,
      codigo: error.code || null,
    })
  } finally {
    db.release()
  }
}

const eliminarTarea = async (req, res) => {
  const db = await pool.connect()

  try {
    const { id } = req.params

    await db.query('BEGIN')

    const tareaQuery = await db.query(
      'DELETE FROM tb_tareas WHERE id_tarea = $1 RETURNING id_proyecto',
      [id],
    )

    if (tareaQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Tarea no encontrada' })
    }

    await actualizarProgresoProyecto(db, tareaQuery.rows[0].id_proyecto)
    await db.query('COMMIT')

    return res.json({
      mensaje: 'Tarea eliminada correctamente',
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al eliminar tarea:', error)

    return res.status(500).json({
      mensaje: 'Error interno al eliminar tarea',
    })
  } finally {
    db.release()
  }
}

const listarProyectosParaOpciones = async (req, res) => {
  try {
    const proyectosQuery = await pool.query(`
      SELECT id_proyecto, nombre, estado, prioridad
      FROM tb_proyectos
      ORDER BY nombre ASC
    `)

    return res.json(proyectosQuery.rows)
  } catch (error) {
    console.error('Error al listar proyectos para tareas:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar proyectos',
    })
  }
}

const listarClientesActivosParaOpciones = async (req, res) => {
  try {
    const clientesQuery = await pool.query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.correo,
        u.empresa
      FROM tb_usuarios u
      INNER JOIN tb_roles r ON r.id_rol = u.id_rol
      WHERE r.nombre_rol = 'Cliente'
        AND u.estado = 'activo'
      ORDER BY u.nombre ASC
    `)

    return res.json(clientesQuery.rows)
  } catch (error) {
    console.error('Error al listar clientes para tareas:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar clientes',
    })
  }
}

module.exports = {
  listarTareas,
  obtenerTareaPorId,
  crearTarea,
  actualizarTarea,
  eliminarTarea,
  listarProyectosParaOpciones,
  listarClientesActivosParaOpciones,
}
