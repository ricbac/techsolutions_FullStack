const pool = require('../config/db')
const { crearNotificacionesTareasVencidas } = require('../utils/notificaciones')

const listarNotificaciones = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario

    await crearNotificacionesTareasVencidas(pool, idUsuario)

    const notificacionesQuery = await pool.query(
      `
        SELECT
          id_notificacion,
          id_usuario,
          id_proyecto,
          id_tarea,
          titulo,
          mensaje,
          tipo,
          leida,
          fecha_creacion
        FROM tb_notificaciones
        WHERE id_usuario = $1
        ORDER BY fecha_creacion DESC
      `,
      [idUsuario],
    )

    return res.json(notificacionesQuery.rows)
  } catch (error) {
    console.error('Error al listar notificaciones:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar notificaciones',
    })
  }
}

const contarNoLeidas = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario

    await crearNotificacionesTareasVencidas(pool, idUsuario)

    const conteoQuery = await pool.query(
      `
        SELECT COUNT(*)::INT AS total
        FROM tb_notificaciones
        WHERE id_usuario = $1
          AND leida = FALSE
      `,
      [idUsuario],
    )

    return res.json({ total: conteoQuery.rows[0].total })
  } catch (error) {
    console.error('Error al contar notificaciones:', error)

    return res.status(500).json({
      mensaje: 'Error interno al contar notificaciones',
    })
  }
}

const marcarComoLeida = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario
    const { id } = req.params

    const notificacionQuery = await pool.query(
      `
        UPDATE tb_notificaciones
        SET leida = TRUE
        WHERE id_notificacion = $1
          AND id_usuario = $2
        RETURNING *
      `,
      [id, idUsuario],
    )

    if (notificacionQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Notificacion no encontrada' })
    }

    return res.json({
      mensaje: 'Notificacion marcada como leida',
      notificacion: notificacionQuery.rows[0],
    })
  } catch (error) {
    console.error('Error al marcar notificacion:', error)

    return res.status(500).json({
      mensaje: 'Error interno al marcar notificacion',
    })
  }
}

const marcarTodasComoLeidas = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario

    await pool.query(
      `
        UPDATE tb_notificaciones
        SET leida = TRUE
        WHERE id_usuario = $1
          AND leida = FALSE
      `,
      [idUsuario],
    )

    return res.json({ mensaje: 'Notificaciones marcadas como leidas' })
  } catch (error) {
    console.error('Error al marcar todas:', error)

    return res.status(500).json({
      mensaje: 'Error interno al marcar notificaciones',
    })
  }
}

const eliminarNotificacion = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario
    const { id } = req.params

    const notificacionQuery = await pool.query(
      `
        DELETE FROM tb_notificaciones
        WHERE id_notificacion = $1
          AND id_usuario = $2
        RETURNING id_notificacion
      `,
      [id, idUsuario],
    )

    if (notificacionQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Notificacion no encontrada' })
    }

    return res.json({ mensaje: 'Notificacion eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar notificacion:', error)

    return res.status(500).json({
      mensaje: 'Error interno al eliminar notificacion',
    })
  }
}

module.exports = {
  listarNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
}
