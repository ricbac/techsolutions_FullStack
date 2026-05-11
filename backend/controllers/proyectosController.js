const pool = require('../config/db')
const {
  notificarAdministradores,
  notificarClientesProyecto,
} = require('../utils/notificaciones')

const ESTADOS_PROYECTO = [
  'planificacion',
  'en_progreso',
  'en_revision',
  'completado',
  'cancelado',
]
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente']

const normalizarFecha = (fecha) => {
  return fecha || null
}

const normalizarClientes = (clientes = []) => {
  if (!Array.isArray(clientes)) return null
  return [...new Set(clientes.map((id) => Number(id)).filter(Boolean))]
}

const normalizarGrupos = (grupos = []) => {
  if (!Array.isArray(grupos)) return null
  return [...new Set(grupos.map((id) => Number(id)).filter(Boolean))]
}

const validarDatosProyecto = ({ nombre, estado, prioridad, progreso }) => {
  if (!nombre) return 'El nombre del proyecto es obligatorio'
  if (estado && !ESTADOS_PROYECTO.includes(estado)) return 'Estado de proyecto invalido'
  if (prioridad && !PRIORIDADES.includes(prioridad)) return 'Prioridad de proyecto invalida'

  const progresoNumero = Number(progreso ?? 0)
  if (Number.isNaN(progresoNumero) || progresoNumero < 0 || progresoNumero > 100) {
    return 'El progreso debe estar entre 0 y 100'
  }

  return null
}

const validarClientesAsignados = async (db, clientes) => {
  const clientesNormalizados = normalizarClientes(clientes)

  if (!clientesNormalizados) {
    return {
      valido: false,
      mensaje: 'El campo clientes debe ser un arreglo de ids',
    }
  }

  if (clientesNormalizados.length === 0) {
    return { valido: true, clientes: [] }
  }

  const clientesQuery = await db.query(
    `
      SELECT u.id_usuario
      FROM tb_usuarios u
      INNER JOIN tb_roles r ON r.id_rol = u.id_rol
      WHERE r.nombre_rol = 'Cliente'
        AND u.id_usuario = ANY($1::BIGINT[])
    `,
    [clientesNormalizados],
  )

  if (clientesQuery.rows.length !== clientesNormalizados.length) {
    return {
      valido: false,
      mensaje: 'Uno o mas clientes no existen o no tienen rol Cliente',
    }
  }

  return {
    valido: true,
    clientes: clientesNormalizados,
  }
}

const validarGruposAsignados = async (db, grupos) => {
  const gruposNormalizados = normalizarGrupos(grupos)

  if (!gruposNormalizados) {
    return {
      valido: false,
      mensaje: 'El campo grupos debe ser un arreglo de ids',
    }
  }

  if (gruposNormalizados.length === 0) {
    return { valido: true, grupos: [] }
  }

  const gruposQuery = await db.query(
    `
      SELECT id_grupo
      FROM tb_grupos
      WHERE estado = 'activo'
        AND id_grupo = ANY($1::BIGINT[])
    `,
    [gruposNormalizados],
  )

  if (gruposQuery.rows.length !== gruposNormalizados.length) {
    return {
      valido: false,
      mensaje: 'Uno o mas grupos no existen o no estan activos',
    }
  }

  return {
    valido: true,
    grupos: gruposNormalizados,
  }
}

const insertarClientesProyecto = async (db, idProyecto, clientes) => {
  for (const idCliente of clientes) {
    await db.query(
      `
        INSERT INTO tb_proyecto_clientes (id_proyecto, id_cliente)
        VALUES ($1, $2)
      `,
      [idProyecto, idCliente],
    )
  }
}

const insertarGruposProyecto = async (db, idProyecto, grupos) => {
  for (const idGrupo of grupos) {
    await db.query(
      `
        INSERT INTO tb_proyecto_grupos (id_proyecto, id_grupo)
        VALUES ($1, $2)
      `,
      [idProyecto, idGrupo],
    )
  }
}

const listarProyectos = async (req, res) => {
  try {
    const proyectosQuery = await pool.query(`
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
        p.fecha_actualizacion,
        u.nombre AS creado_por_nombre,
        COUNT(DISTINCT pc.id_cliente)::INT AS clientes_asignados,
        COUNT(DISTINCT pg.id_grupo)::INT AS grupos_asignados,
        COUNT(DISTINCT t.id_tarea)::INT AS total_tareas,
        COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN t.id_tarea END)::INT AS tareas_completadas
      FROM tb_proyectos p
      LEFT JOIN tb_usuarios u ON u.id_usuario = p.creado_por
      LEFT JOIN tb_proyecto_clientes pc ON pc.id_proyecto = p.id_proyecto
      LEFT JOIN tb_proyecto_grupos pg ON pg.id_proyecto = p.id_proyecto
      LEFT JOIN tb_tareas t ON t.id_proyecto = p.id_proyecto
      GROUP BY p.id_proyecto, u.nombre
      ORDER BY p.fecha_creacion DESC
    `)

    return res.json(proyectosQuery.rows)
  } catch (error) {
    console.error('Error al listar proyectos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar proyectos',
    })
  }
}

const obtenerProyectoPorId = async (req, res) => {
  try {
    const { id } = req.params

    const proyectoQuery = await pool.query(
      `
        SELECT
          p.id_proyecto,
          p.creado_por,
          p.nombre,
          p.descripcion,
          p.estado,
          p.prioridad,
          p.progreso,
          p.fecha_inicio,
          p.fecha_fin,
          p.fecha_creacion,
          p.fecha_actualizacion,
          u.nombre AS creado_por_nombre
        FROM tb_proyectos p
        LEFT JOIN tb_usuarios u ON u.id_usuario = p.creado_por
        WHERE p.id_proyecto = $1
        LIMIT 1
      `,
      [id],
    )

    if (proyectoQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Proyecto no encontrado',
      })
    }

    const clientesQuery = await pool.query(
      `
        SELECT
          u.id_usuario,
          u.nombre,
          u.correo,
          u.empresa
        FROM tb_proyecto_clientes pc
        INNER JOIN tb_usuarios u ON u.id_usuario = pc.id_cliente
        WHERE pc.id_proyecto = $1
        ORDER BY u.nombre ASC
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
          t.asignado_a,
          u.nombre AS cliente_asignado,
          t.fecha_inicio,
          t.fecha_limite,
          t.fecha_completada,
          t.fecha_creacion
        FROM tb_tareas t
        LEFT JOIN tb_usuarios u ON u.id_usuario = t.asignado_a
        WHERE t.id_proyecto = $1
        ORDER BY t.fecha_creacion DESC
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

    const progresoClientesQuery = await pool.query(
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
        FROM tb_proyecto_clientes pc
        INNER JOIN tb_usuarios u ON u.id_usuario = pc.id_cliente
        LEFT JOIN tb_tareas t
          ON t.id_proyecto = pc.id_proyecto
          AND t.asignado_a = u.id_usuario
        WHERE pc.id_proyecto = $1
        GROUP BY u.id_usuario
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    const metricasQuery = await pool.query(
      `
        SELECT
          (SELECT COUNT(DISTINCT id_cliente) FROM tb_proyecto_clientes WHERE id_proyecto = $1)::INT AS total_clientes,
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

    return res.json({
      ...proyectoQuery.rows[0],
      clientes: clientesQuery.rows,
      grupos_asignados: gruposQuery.rows,
      progreso_individual_clientes: progresoClientesQuery.rows,
      metricas: metricasQuery.rows[0],
      tareas: tareasQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener proyecto:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener proyecto',
    })
  }
}

const crearProyecto = async (req, res) => {
  const db = await pool.connect()

  try {
    const {
      nombre,
      descripcion,
      estado = 'planificacion',
      prioridad = 'media',
      progreso = 0,
      fecha_inicio,
      fecha_fin,
      clientes = [],
      grupos = [],
    } = req.body

    const errorValidacion = validarDatosProyecto({ nombre, estado, prioridad, progreso })
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion })
    }

    await db.query('BEGIN')

    const clientesValidados = await validarClientesAsignados(db, clientes)
    if (!clientesValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: clientesValidados.mensaje })
    }

    const gruposValidados = await validarGruposAsignados(db, grupos)
    if (!gruposValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: gruposValidados.mensaje })
    }

    const proyectoQuery = await db.query(
      `
        INSERT INTO tb_proyectos (
          creado_por,
          nombre,
          descripcion,
          estado,
          prioridad,
          progreso,
          fecha_inicio,
          fecha_fin
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        req.usuario.id_usuario,
        nombre,
        descripcion || null,
        estado,
        prioridad,
        Number(progreso),
        normalizarFecha(fecha_inicio),
        normalizarFecha(fecha_fin),
      ],
    )

    await insertarClientesProyecto(db, proyectoQuery.rows[0].id_proyecto, clientesValidados.clientes)
    await insertarGruposProyecto(db, proyectoQuery.rows[0].id_proyecto, gruposValidados.grupos)
    await notificarAdministradores(db, {
      id_proyecto: proyectoQuery.rows[0].id_proyecto,
      titulo: 'Proyecto creado',
      mensaje: `Se creo el proyecto ${proyectoQuery.rows[0].nombre}.`,
      tipo: 'success',
    })

    await db.query('COMMIT')

    return res.status(201).json({
      mensaje: 'Proyecto creado correctamente',
      proyecto: proyectoQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al crear proyecto:', error)

    return res.status(500).json({
      mensaje: 'Error interno al crear proyecto',
    })
  } finally {
    db.release()
  }
}

const actualizarProyecto = async (req, res) => {
  const db = await pool.connect()

  try {
    const { id } = req.params
    const {
      nombre,
      descripcion,
      estado = 'planificacion',
      prioridad = 'media',
      progreso = 0,
      fecha_inicio,
      fecha_fin,
      clientes = [],
      grupos = [],
    } = req.body

    const errorValidacion = validarDatosProyecto({ nombre, estado, prioridad, progreso })
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion })
    }

    await db.query('BEGIN')

    const clientesValidados = await validarClientesAsignados(db, clientes)
    if (!clientesValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: clientesValidados.mensaje })
    }

    const gruposValidados = await validarGruposAsignados(db, grupos)
    if (!gruposValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: gruposValidados.mensaje })
    }

    const proyectoQuery = await db.query(
      `
        UPDATE tb_proyectos
        SET
          nombre = $1,
          descripcion = $2,
          estado = $3,
          prioridad = $4,
          progreso = $5,
          fecha_inicio = $6,
          fecha_fin = $7,
          fecha_actualizacion = NOW()
        WHERE id_proyecto = $8
        RETURNING *
      `,
      [
        nombre,
        descripcion || null,
        estado,
        prioridad,
        Number(progreso),
        normalizarFecha(fecha_inicio),
        normalizarFecha(fecha_fin),
        id,
      ],
    )

    if (proyectoQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(404).json({
        mensaje: 'Proyecto no encontrado',
      })
    }

    await db.query('DELETE FROM tb_proyecto_clientes WHERE id_proyecto = $1', [id])
    await db.query('DELETE FROM tb_proyecto_grupos WHERE id_proyecto = $1', [id])
    await insertarClientesProyecto(db, id, clientesValidados.clientes)
    await insertarGruposProyecto(db, id, gruposValidados.grupos)
    await notificarClientesProyecto(db, id, {
      titulo: 'Proyecto actualizado',
      mensaje: `El proyecto ${proyectoQuery.rows[0].nombre} fue actualizado.`,
      tipo: 'info',
    })

    await db.query('COMMIT')

    return res.json({
      mensaje: 'Proyecto actualizado correctamente',
      proyecto: proyectoQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al actualizar proyecto:', error)

    return res.status(500).json({
      mensaje: 'Error interno al actualizar proyecto',
    })
  } finally {
    db.release()
  }
}

const eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params

    const proyectoQuery = await pool.query(
      `
        DELETE FROM tb_proyectos
        WHERE id_proyecto = $1
        RETURNING id_proyecto
      `,
      [id],
    )

    if (proyectoQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Proyecto no encontrado',
      })
    }

    return res.json({
      mensaje: 'Proyecto eliminado correctamente',
    })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)

    return res.status(500).json({
      mensaje: 'Error interno al eliminar proyecto',
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
    console.error('Error al listar clientes activos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar clientes activos',
    })
  }
}

const listarGruposActivosParaOpciones = async (req, res) => {
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
    console.error('Error al listar grupos activos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar grupos activos',
    })
  }
}

module.exports = {
  listarProyectos,
  obtenerProyectoPorId,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  listarClientesActivosParaOpciones,
  listarGruposActivosParaOpciones,
}
