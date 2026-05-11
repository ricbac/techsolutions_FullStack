const pool = require('../config/db')
const { notificarAdministradores } = require('../utils/notificaciones')

const normalizarIds = (ids = []) => {
  if (!Array.isArray(ids)) return null
  return [...new Set(ids.map((id) => Number(id)).filter(Boolean))]
}

const validarClientes = async (db, clientes) => {
  const clientesNormalizados = normalizarIds(clientes)

  if (!clientesNormalizados) {
    return { valido: false, mensaje: 'El campo clientes debe ser un arreglo de ids' }
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

  return { valido: true, clientes: clientesNormalizados }
}

const insertarClientesGrupo = async (db, idGrupo, clientes) => {
  for (const idUsuario of clientes) {
    await db.query(
      `
        INSERT INTO tb_grupo_clientes (id_grupo, id_usuario)
        VALUES ($1, $2)
      `,
      [idGrupo, idUsuario],
    )
  }
}

const listarGrupos = async (req, res) => {
  try {
    const gruposQuery = await pool.query(`
      SELECT
        g.id_grupo,
        g.nombre,
        g.descripcion,
        g.estado,
        g.fecha_creacion,
        COUNT(gc.id_usuario)::INT AS total_integrantes
      FROM tb_grupos g
      LEFT JOIN tb_grupo_clientes gc ON gc.id_grupo = g.id_grupo
      GROUP BY g.id_grupo
      ORDER BY g.fecha_creacion DESC
    `)

    return res.json(gruposQuery.rows)
  } catch (error) {
    console.error('Error al listar grupos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar grupos',
    })
  }
}

const obtenerGrupoPorId = async (req, res) => {
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

    const clientesQuery = await pool.query(
      `
        SELECT
          u.id_usuario,
          u.nombre,
          u.correo,
          u.empresa,
          gc.fecha_asignacion
        FROM tb_grupo_clientes gc
        INNER JOIN tb_usuarios u ON u.id_usuario = gc.id_usuario
        WHERE gc.id_grupo = $1
        ORDER BY u.nombre ASC
      `,
      [id],
    )

    const proyectosQuery = await pool.query(
      `
        SELECT
          p.id_proyecto,
          p.nombre,
          p.estado,
          pg.fecha_asignacion
        FROM tb_proyecto_grupos pg
        INNER JOIN tb_proyectos p ON p.id_proyecto = pg.id_proyecto
        WHERE pg.id_grupo = $1
        ORDER BY p.nombre ASC
      `,
      [id],
    )

    return res.json({
      ...grupoQuery.rows[0],
      clientes: clientesQuery.rows,
      proyectos: proyectosQuery.rows,
    })
  } catch (error) {
    console.error('Error al obtener grupo:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener grupo',
    })
  }
}

const crearGrupo = async (req, res) => {
  const db = await pool.connect()

  try {
    const { nombre, descripcion, estado = 'activo', clientes = [] } = req.body

    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' })
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado invalido' })
    }

    await db.query('BEGIN')

    const clientesValidados = await validarClientes(db, clientes)
    if (!clientesValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: clientesValidados.mensaje })
    }

    const grupoQuery = await db.query(
      `
        INSERT INTO tb_grupos (nombre, descripcion, estado)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [nombre, descripcion || null, estado],
    )

    await insertarClientesGrupo(db, grupoQuery.rows[0].id_grupo, clientesValidados.clientes)
    await notificarAdministradores(db, {
      titulo: 'Grupo creado',
      mensaje: `Se creo el grupo ${grupoQuery.rows[0].nombre}.`,
      tipo: 'success',
    })
    await db.query('COMMIT')

    return res.status(201).json({
      mensaje: 'Grupo creado correctamente',
      grupo: grupoQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al crear grupo:', error)

    return res.status(500).json({
      mensaje: 'Error interno al crear grupo',
    })
  } finally {
    db.release()
  }
}

const actualizarGrupo = async (req, res) => {
  const db = await pool.connect()

  try {
    const { id } = req.params
    const { nombre, descripcion, estado = 'activo', clientes = [] } = req.body

    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' })
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado invalido' })
    }

    await db.query('BEGIN')

    const clientesValidados = await validarClientes(db, clientes)
    if (!clientesValidados.valido) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: clientesValidados.mensaje })
    }

    const grupoQuery = await db.query(
      `
        UPDATE tb_grupos
        SET nombre = $1, descripcion = $2, estado = $3
        WHERE id_grupo = $4
        RETURNING *
      `,
      [nombre, descripcion || null, estado, id],
    )

    if (grupoQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Grupo no encontrado' })
    }

    await db.query('DELETE FROM tb_grupo_clientes WHERE id_grupo = $1', [id])
    await insertarClientesGrupo(db, id, clientesValidados.clientes)
    await db.query('COMMIT')

    return res.json({
      mensaje: 'Grupo actualizado correctamente',
      grupo: grupoQuery.rows[0],
    })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al actualizar grupo:', error)

    return res.status(500).json({
      mensaje: 'Error interno al actualizar grupo',
    })
  } finally {
    db.release()
  }
}

const eliminarGrupo = async (req, res) => {
  try {
    const { id } = req.params

    const grupoQuery = await pool.query(
      'DELETE FROM tb_grupos WHERE id_grupo = $1 RETURNING id_grupo',
      [id],
    )

    if (grupoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Grupo no encontrado' })
    }

    return res.json({ mensaje: 'Grupo eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar grupo:', error)

    return res.status(500).json({
      mensaje: 'Error interno al eliminar grupo',
    })
  }
}

const listarClientesParaOpciones = async (req, res) => {
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
    console.error('Error al listar clientes para grupos:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar clientes',
    })
  }
}

module.exports = {
  listarGrupos,
  obtenerGrupoPorId,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
  listarClientesParaOpciones,
}
