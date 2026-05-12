const pool = require('../config/db')

const obtenerReporteGeneral = async (req, res) => {
  try {
    const resumenQuery = await pool.query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM tb_usuarios u
          INNER JOIN tb_roles r ON r.id_rol = u.id_rol
          WHERE r.nombre_rol = 'Cliente'
        )::INT AS total_clientes,
        (SELECT COUNT(*) FROM tb_grupos)::INT AS total_grupos,
        (SELECT COUNT(*) FROM tb_proyectos)::INT AS total_proyectos,
        (SELECT COUNT(*) FROM tb_tareas)::INT AS total_tareas,
        (SELECT COUNT(*) FROM tb_tareas WHERE estado = 'completada')::INT AS tareas_completadas,
        (SELECT COUNT(*) FROM tb_tareas WHERE estado = 'pendiente')::INT AS tareas_pendientes,
        (
          SELECT COUNT(*)
          FROM tb_tareas
          WHERE fecha_limite < CURRENT_DATE
            AND estado <> 'completada'
        )::INT AS tareas_vencidas
    `)

    const proyectosEstadoQuery = await pool.query(`
      SELECT estado, COUNT(*)::INT AS total
      FROM tb_proyectos
      GROUP BY estado
      ORDER BY estado ASC
    `)

    const tareasEstadoQuery = await pool.query(`
      SELECT estado, COUNT(*)::INT AS total
      FROM tb_tareas
      GROUP BY estado
      ORDER BY estado ASC
    `)

    const productividadQuery = await pool.query(`
      SELECT
        COALESCE(
          ROUND(
            COUNT(*) FILTER (WHERE estado = 'completada') * 100.0 / NULLIF(COUNT(*), 0),
            2
          ),
          0
        ) AS productividad_general
      FROM tb_tareas
    `)

    return res.json({
      ...resumenQuery.rows[0],
      proyectos_por_estado: proyectosEstadoQuery.rows,
      tareas_por_estado: tareasEstadoQuery.rows,
      productividad_general: productividadQuery.rows[0].productividad_general,
    })
  } catch (error) {
    console.error('Error al obtener reporte general:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte general',
    })
  }
}

const obtenerReporteProyecto = async (req, res) => {
  try {
    const { id } = req.params

    const proyectoQuery = await pool.query(
      `
        SELECT
          id_proyecto,
          nombre,
          descripcion,
          estado,
          prioridad,
          progreso,
          fecha_inicio,
          fecha_fin,
          fecha_creacion
        FROM tb_proyectos
        WHERE id_proyecto = $1
        LIMIT 1
      `,
      [id],
    )

    if (proyectoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Proyecto no encontrado' })
    }

    const clientesQuery = await pool.query(
      `
        WITH directos AS (
          SELECT
            u.id_usuario,
            u.nombre,
            u.correo,
            u.empresa,
            TRUE AS es_individual,
            FALSE AS es_grupo
          FROM tb_proyecto_clientes pc
          INNER JOIN tb_usuarios u ON u.id_usuario = pc.id_cliente
          WHERE pc.id_proyecto = $1
        ),
        por_grupo AS (
          SELECT
            u.id_usuario,
            u.nombre,
            u.correo,
            u.empresa,
            FALSE AS es_individual,
            TRUE AS es_grupo
          FROM tb_proyecto_grupos pg
          INNER JOIN tb_grupo_clientes gc ON gc.id_grupo = pg.id_grupo
          INNER JOIN tb_usuarios u ON u.id_usuario = gc.id_usuario
          WHERE pg.id_proyecto = $1
        ),
        unidos AS (
          SELECT * FROM directos
          UNION ALL
          SELECT * FROM por_grupo
        )
        SELECT
          id_usuario,
          nombre,
          correo,
          empresa,
          CASE
            WHEN BOOL_OR(es_individual) AND BOOL_OR(es_grupo) THEN 'individual_grupo'
            WHEN BOOL_OR(es_individual) THEN 'individual'
            ELSE 'grupo'
          END AS origen
        FROM unidos
        GROUP BY id_usuario, nombre, correo, empresa
        ORDER BY nombre ASC
      `,
      [id],
    )

    const clientesDirectosQuery = await pool.query(
      `
        SELECT u.id_usuario, u.nombre, u.correo, u.empresa
        FROM tb_proyecto_clientes pc
        INNER JOIN tb_usuarios u ON u.id_usuario = pc.id_cliente
        WHERE pc.id_proyecto = $1
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    const gruposQuery = await pool.query(
      `
        SELECT
          g.id_grupo,
          g.nombre,
          g.descripcion,
          g.estado,
          COUNT(gc.id_usuario)::INT AS integrantes_count
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_grupos g ON g.id_grupo = pg.id_grupo
        LEFT JOIN tb_grupo_clientes gc ON gc.id_grupo = g.id_grupo
        WHERE pg.id_proyecto = $1
        GROUP BY g.id_grupo
        ORDER BY g.nombre ASC
      `,
      [id],
    )

    const tareasQuery = await pool.query(
      `
        SELECT
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          u.nombre AS cliente_asignado,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada
        FROM tb_tareas t
        LEFT JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
        WHERE t.id_proyecto = $1
        ORDER BY t.fecha_creacion DESC
      `,
      [id],
    )

    const metricasQuery = await pool.query(
      `
        SELECT
          (
            SELECT COUNT(DISTINCT id_usuario)
            FROM (
              SELECT id_cliente AS id_usuario
              FROM tb_proyecto_clientes
              WHERE id_proyecto = $1
              UNION
              SELECT gc.id_usuario
              FROM tb_proyecto_grupos pg
              INNER JOIN tb_grupo_clientes gc ON gc.id_grupo = pg.id_grupo
              WHERE pg.id_proyecto = $1
            ) relacionados
          )::INT AS total_clientes,
          (SELECT COUNT(DISTINCT id_grupo) FROM tb_proyecto_grupos WHERE id_proyecto = $1)::INT AS total_grupos,
          COUNT(t.id_tarea)::INT AS total_tareas,
          COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END)::INT AS tareas_pendientes,
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS tareas_completadas,
          COUNT(CASE WHEN t.fecha_limite < CURRENT_DATE AND t.estado <> 'completada' THEN 1 END)::INT AS tareas_vencidas
        FROM tb_tareas t
        WHERE t.id_proyecto = $1
      `,
      [id],
    )

    const progresoQuery = await pool.query(
      `
        SELECT
          u.id_usuario,
          u.nombre,
          u.correo,
          u.empresa,
          COUNT(t.id_tarea)::INT AS total_tareas,
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS tareas_completadas,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0),
              2
            ),
            0
          ) AS progreso
        FROM (
          SELECT id_cliente AS id_usuario
          FROM tb_proyecto_clientes
          WHERE id_proyecto = $1
          UNION
          SELECT gc.id_usuario
          FROM tb_proyecto_grupos pg
          INNER JOIN tb_grupo_clientes gc ON gc.id_grupo = pg.id_grupo
          WHERE pg.id_proyecto = $1
        ) relacionados
        INNER JOIN tb_usuarios u ON u.id_usuario = relacionados.id_usuario
        LEFT JOIN tb_tareas t
          ON t.id_proyecto = $1
          AND t.asignado_a = u.id_usuario
        GROUP BY u.id_usuario
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    return res.json({
      proyecto: proyectoQuery.rows[0],
      clientes: clientesQuery.rows,
      clientes_directos: clientesDirectosQuery.rows,
      clientes_relacionados: clientesQuery.rows,
      grupos: gruposQuery.rows,
      tareas: tareasQuery.rows,
      metricas: metricasQuery.rows[0],
      progreso_individual: progresoQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener reporte de proyecto:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte de proyecto',
    })
  }
}

const obtenerOpcionesClientes = async (req, res) => {
  try {
    const clientesQuery = await pool.query(`
      SELECT u.id_usuario, u.nombre, u.correo, u.empresa
      FROM tb_usuarios u
      INNER JOIN tb_roles r ON r.id_rol = u.id_rol
      WHERE r.nombre_rol = 'Cliente'
        AND u.estado = 'activo'
      ORDER BY u.nombre ASC
    `)

    return res.json(clientesQuery.rows)
  } catch (error) {
    console.error('Error al obtener opciones de clientes:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener opciones de clientes',
    })
  }
}

const obtenerOpcionesGrupos = async (req, res) => {
  try {
    const gruposQuery = await pool.query(`
      SELECT
        g.id_grupo,
        g.nombre,
        g.descripcion,
        COUNT(gc.id_usuario)::INT AS integrantes_count
      FROM tb_grupos g
      LEFT JOIN tb_grupo_clientes gc ON gc.id_grupo = g.id_grupo
      WHERE g.estado = 'activo'
      GROUP BY g.id_grupo
      ORDER BY g.nombre ASC
    `)

    return res.json(gruposQuery.rows)
  } catch (error) {
    console.error('Error al obtener opciones de grupos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener opciones de grupos',
    })
  }
}

const obtenerReporteCliente = async (req, res) => {
  try {
    const { id } = req.params

    const clienteQuery = await pool.query(
      `
        SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.empresa, u.estado, u.fecha_creacion
        FROM tb_usuarios u
        INNER JOIN tb_roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1
          AND r.nombre_rol = 'Cliente'
        LIMIT 1
      `,
      [id],
    )

    if (clienteQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' })
    }

    const proyectosQuery = await pool.query(
      `
        SELECT DISTINCT
          p.id_proyecto,
          p.nombre,
          p.descripcion,
          p.estado,
          p.prioridad,
          p.progreso,
          p.fecha_inicio,
          p.fecha_fin,
          p.fecha_creacion
        FROM tb_proyectos p
        LEFT JOIN tb_proyecto_clientes pc ON pc.id_proyecto = p.id_proyecto
        LEFT JOIN tb_proyecto_grupos pg ON pg.id_proyecto = p.id_proyecto
        LEFT JOIN tb_grupo_clientes gc ON gc.id_grupo = pg.id_grupo
        WHERE pc.id_cliente = $1
           OR gc.id_usuario = $1
        ORDER BY p.fecha_creacion DESC
      `,
      [id],
    )

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
          p.nombre AS proyecto
        FROM tb_tareas t
        INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
        WHERE t.asignado_a = $1
        ORDER BY t.fecha_creacion DESC
      `,
      [id],
    )

    const metricasQuery = await pool.query(
      `
        SELECT
          COUNT(*)::INT AS total_tareas,
          COUNT(CASE WHEN estado = 'completada' THEN 1 END)::INT AS tareas_completadas,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END)::INT AS tareas_pendientes,
          COUNT(CASE WHEN fecha_limite < CURRENT_DATE AND estado <> 'completada' THEN 1 END)::INT AS tareas_vencidas,
          COALESCE(ROUND(COUNT(CASE WHEN estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2), 0) AS productividad,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN estado = 'completada' AND (fecha_completada IS NULL OR fecha_limite IS NULL OR fecha_completada::DATE <= fecha_limite) THEN 1 END) * 100.0
              / NULLIF(COUNT(CASE WHEN estado = 'completada' THEN 1 END), 0),
              2
            ),
            0
          ) AS puntualidad
        FROM tb_tareas
        WHERE asignado_a = $1
      `,
      [id],
    )

    const tareasEstadoQuery = await pool.query(
      `
        SELECT estado, COUNT(*)::INT AS total
        FROM tb_tareas
        WHERE asignado_a = $1
        GROUP BY estado
        ORDER BY estado ASC
      `,
      [id],
    )

    const tareasPrioridadQuery = await pool.query(
      `
        SELECT prioridad, COUNT(*)::INT AS total
        FROM tb_tareas
        WHERE asignado_a = $1
        GROUP BY prioridad
        ORDER BY prioridad ASC
      `,
      [id],
    )

    return res.json({
      datos_cliente: clienteQuery.rows[0],
      proyectos_asignados: proyectosQuery.rows,
      tareas_asignadas: tareasQuery.rows,
      ...metricasQuery.rows[0],
      tareas_por_estado: tareasEstadoQuery.rows,
      tareas_por_prioridad: tareasPrioridadQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener reporte de cliente:', error)
    console.error(error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte de cliente',
      error: error.message,
      detalle: error.detail || null,
      codigo: error.code || null,
    })
  }
}

const obtenerReporteGrupo = async (req, res) => {
  try {
    const { id } = req.params

    const grupoQuery = await pool.query(
      `
        SELECT id_grupo, nombre, descripcion, estado, fecha_creacion
        FROM tb_grupos
        WHERE id_grupo = $1
        LIMIT 1
      `,
      [id],
    )

    if (grupoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Grupo no encontrado' })
    }

    const integrantesQuery = await pool.query(
      `
        SELECT u.id_usuario, u.nombre, u.correo, u.empresa, u.estado
        FROM tb_grupo_clientes gc
        INNER JOIN tb_usuarios u ON u.id_usuario = gc.id_usuario
        WHERE gc.id_grupo = $1
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    const proyectosQuery = await pool.query(
      `
        SELECT p.id_proyecto, p.nombre, p.estado, p.prioridad, p.progreso, p.fecha_inicio, p.fecha_fin
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_proyectos p ON p.id_proyecto = pg.id_proyecto
        WHERE pg.id_grupo = $1
        ORDER BY p.fecha_creacion DESC
      `,
      [id],
    )

    const tareasQuery = await pool.query(
      `
        SELECT
          t.id_tarea,
          t.titulo,
          t.estado,
          t.prioridad,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada,
          p.nombre AS proyecto,
          u.nombre AS cliente
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_tareas t ON t.id_proyecto = pg.id_proyecto
        INNER JOIN tb_grupo_clientes gc
          ON gc.id_grupo = pg.id_grupo
          AND gc.id_usuario = t.asignado_a
        INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
        INNER JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
        WHERE pg.id_grupo = $1
        ORDER BY t.fecha_creacion DESC
      `,
      [id],
    )

    const progresoQuery = await pool.query(
      `
        SELECT
          COALESCE(ROUND(COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0), 2), 0) AS progreso_grupal
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_tareas t ON t.id_proyecto = pg.id_proyecto
        INNER JOIN tb_grupo_clientes gc
          ON gc.id_grupo = pg.id_grupo
          AND gc.id_usuario = t.asignado_a
        WHERE pg.id_grupo = $1
      `,
      [id],
    )

    const comparativaQuery = await pool.query(
      `
        SELECT
          u.nombre AS cliente,
          COUNT(t.id_tarea)::INT AS total_tareas,
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS completadas,
          COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END)::INT AS pendientes,
          COUNT(CASE WHEN t.fecha_limite < CURRENT_DATE AND t.estado <> 'completada' THEN 1 END)::INT AS vencidas,
          COALESCE(ROUND(COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0), 2), 0) AS productividad
        FROM tb_grupo_clientes gc
        INNER JOIN tb_usuarios u ON u.id_usuario = gc.id_usuario
        LEFT JOIN tb_proyecto_grupos pg ON pg.id_grupo = gc.id_grupo
        LEFT JOIN tb_tareas t
          ON t.id_proyecto = pg.id_proyecto
          AND t.asignado_a = u.id_usuario
        WHERE gc.id_grupo = $1
        GROUP BY u.id_usuario
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    return res.json({
      datos_grupo: grupoQuery.rows[0],
      integrantes: integrantesQuery.rows,
      proyectos_relacionados: proyectosQuery.rows,
      tareas_del_grupo: tareasQuery.rows,
      progreso_grupal: progresoQuery.rows[0].progreso_grupal,
      comparativa_integrantes: comparativaQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener reporte de grupo:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte de grupo',
    })
  }
}

const obtenerReporteTareasVencidas = async (req, res) => {
  try {
    const tareasQuery = await pool.query(`
      SELECT
        t.id_tarea,
        t.titulo AS tarea,
        p.nombre AS proyecto,
        COALESCE(u.nombre, 'Sin asignar') AS cliente,
        t.prioridad,
        t.fecha_limite,
        (CURRENT_DATE - t.fecha_limite)::INT AS dias_atraso
      FROM tb_tareas t
      INNER JOIN tb_proyectos p ON p.id_proyecto = t.id_proyecto
      LEFT JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
      WHERE t.fecha_limite < CURRENT_DATE
        AND t.estado <> 'completada'
      ORDER BY t.fecha_limite ASC
    `)

    return res.json(tareasQuery.rows)
  } catch (error) {
    console.error('Error al obtener reporte de tareas vencidas:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte de tareas vencidas',
    })
  }
}

const obtenerReporteProductividad = async (req, res) => {
  try {
    const { desde, hasta } = req.query
    const filtros = []
    const valores = []

    if (desde) {
      valores.push(desde)
      filtros.push(`t.fecha_creacion::DATE >= $${valores.length}`)
    }

    if (hasta) {
      valores.push(hasta)
      filtros.push(`t.fecha_creacion::DATE <= $${valores.length}`)
    }

    const whereTareas = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : ''
    const andTareas = filtros.length > 0 ? `AND ${filtros.join(' AND ')}` : ''

    const resumenQuery = await pool.query(
      `
        SELECT
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS total_completadas,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0),
              2
            ),
            0
          ) AS productividad_general
        FROM tb_tareas t
        ${whereTareas}
      `,
      valores,
    )

    const clientesQuery = await pool.query(
      `
        SELECT
          u.nombre AS cliente,
          COUNT(t.id_tarea)::INT AS total_tareas,
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS completadas,
          COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END)::INT AS pendientes,
          COUNT(CASE WHEN t.fecha_limite < CURRENT_DATE AND t.estado <> 'completada' THEN 1 END)::INT AS vencidas,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0),
              2
            ),
            0
          ) AS productividad
        FROM tb_usuarios u
        INNER JOIN tb_roles r ON r.id_rol = u.id_rol
        LEFT JOIN tb_tareas t
          ON t.asignado_a = u.id_usuario
          ${andTareas}
        WHERE r.nombre_rol = 'Cliente'
        GROUP BY u.id_usuario
        ORDER BY productividad DESC, u.nombre ASC
      `,
      valores,
    )

    const proyectosQuery = await pool.query(
      `
        SELECT
          p.nombre AS proyecto,
          COUNT(t.id_tarea)::INT AS total_tareas,
          COUNT(CASE WHEN t.estado = 'completada' THEN 1 END)::INT AS completadas,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id_tarea), 0),
              2
            ),
            0
          ) AS productividad
        FROM tb_proyectos p
        LEFT JOIN tb_tareas t
          ON t.id_proyecto = p.id_proyecto
          ${andTareas}
        GROUP BY p.id_proyecto
        ORDER BY productividad DESC, p.nombre ASC
      `,
      valores,
    )

    return res.json({
      resumen: resumenQuery.rows[0],
      productividad_por_cliente: clientesQuery.rows,
      productividad_por_proyecto: proyectosQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener reporte de productividad:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener reporte de productividad',
    })
  }
}

module.exports = {
  obtenerReporteGeneral,
  obtenerReporteProyecto,
  obtenerReporteCliente,
  obtenerReporteGrupo,
  obtenerReporteTareasVencidas,
  obtenerReporteProductividad,
  obtenerOpcionesClientes,
  obtenerOpcionesGrupos,
}
