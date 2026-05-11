const pool = require('../config/db')

const obtenerResumenAdmin = async (req, res) => {
  try {
    const resumenQuery = await pool.query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM tb_usuarios u
          INNER JOIN tb_roles r ON r.id_rol = u.id_rol
          WHERE r.nombre_rol = 'Cliente'
        )::INT AS "totalClientes",
        (SELECT COUNT(*) FROM tb_proyectos)::INT AS "totalProyectos",
        (SELECT COUNT(*) FROM tb_tareas)::INT AS "totalTareas",
        (
          SELECT COUNT(*)
          FROM tb_tareas
          WHERE estado = 'completada'
        )::INT AS "tareasCompletadas",
        (
          SELECT COUNT(*)
          FROM tb_tareas
          WHERE estado = 'pendiente'
        )::INT AS "tareasPendientes",
        (
          SELECT COUNT(*)
          FROM tb_tareas
          WHERE fecha_limite < CURRENT_DATE
            AND estado <> 'completada'
        )::INT AS "tareasVencidas"
    `)

    return res.json(resumenQuery.rows[0])
  } catch (error) {
    console.error('Error al obtener resumen admin:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener resumen del dashboard',
    })
  }
}

const obtenerProyectosPorEstado = async (req, res) => {
  try {
    const proyectosQuery = await pool.query(`
      SELECT estado, COUNT(*)::INT AS total
      FROM tb_proyectos
      GROUP BY estado
      ORDER BY estado ASC
    `)

    return res.json(proyectosQuery.rows)
  } catch (error) {
    console.error('Error al obtener proyectos por estado:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener proyectos por estado',
    })
  }
}

const obtenerTareasPorEstado = async (req, res) => {
  try {
    const tareasQuery = await pool.query(`
      SELECT estado, COUNT(*)::INT AS total
      FROM tb_tareas
      GROUP BY estado
      ORDER BY estado ASC
    `)

    return res.json(tareasQuery.rows)
  } catch (error) {
    console.error('Error al obtener tareas por estado:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener tareas por estado',
    })
  }
}

const obtenerActividadReciente = async (req, res) => {
  try {
    const actividadQuery = await pool.query(`
      SELECT
        h.id_historial,
        h.id_usuario,
        u.nombre AS nombre_usuario,
        u.correo AS correo_usuario,
        h.id_proyecto,
        h.id_tarea,
        h.accion,
        h.descripcion,
        h.entidad,
        h.id_entidad,
        h.fecha_creacion
      FROM tb_historial h
      LEFT JOIN tb_usuarios u ON u.id_usuario = h.id_usuario
      ORDER BY h.fecha_creacion DESC
      LIMIT 10
    `)

    return res.json(actividadQuery.rows)
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener actividad reciente',
    })
  }
}

module.exports = {
  obtenerResumenAdmin,
  obtenerProyectosPorEstado,
  obtenerTareasPorEstado,
  obtenerActividadReciente,
}
