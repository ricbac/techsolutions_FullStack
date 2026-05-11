const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { notificarAdministradores } = require('../utils/notificaciones')

const CAMPOS_CLIENTE = `
  u.id_usuario,
  u.nombre,
  u.correo,
  u.telefono,
  u.empresa,
  u.estado,
  u.fecha_creacion,
  u.ultimo_acceso
`

const listarClientes = async (req, res) => {
  try {
    const clientesQuery = await pool.query(`
      SELECT ${CAMPOS_CLIENTE}
      FROM tb_usuarios u
      INNER JOIN tb_roles r ON r.id_rol = u.id_rol
      WHERE r.nombre_rol = 'Cliente'
      ORDER BY u.fecha_creacion DESC
    `)

    return res.json(clientesQuery.rows)
  } catch (error) {
    console.error('Error al listar clientes:', error)

    return res.status(500).json({
      mensaje: 'Error interno al listar clientes',
    })
  }
}

const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params

    const clienteQuery = await pool.query(
      `
        SELECT ${CAMPOS_CLIENTE}
        FROM tb_usuarios u
        INNER JOIN tb_roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1
          AND r.nombre_rol = 'Cliente'
        LIMIT 1
      `,
      [id],
    )

    if (clienteQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado',
      })
    }

    return res.json(clienteQuery.rows[0])
  } catch (error) {
    console.error('Error al obtener cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener cliente',
    })
  }
}

const crearCliente = async (req, res) => {
  try {
    const { nombre, correo, password, telefono, empresa } = req.body

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        mensaje: 'Nombre, correo y password son obligatorios',
      })
    }

    const rolQuery = await pool.query(
      'SELECT id_rol FROM tb_roles WHERE nombre_rol = $1 LIMIT 1',
      ['Cliente'],
    )

    if (rolQuery.rows.length === 0) {
      return res.status(500).json({
        mensaje: 'El rol Cliente no existe en la base de datos',
      })
    }

    const correoQuery = await pool.query(
      'SELECT id_usuario FROM tb_usuarios WHERE correo = $1 LIMIT 1',
      [correo],
    )

    if (correoQuery.rows.length > 0) {
      return res.status(409).json({
        mensaje: 'Ya existe un usuario con ese correo',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const clienteQuery = await pool.query(
      `
        INSERT INTO tb_usuarios (
          id_rol,
          nombre,
          correo,
          password_hash,
          telefono,
          empresa,
          estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'activo')
        RETURNING
          id_usuario,
          nombre,
          correo,
          telefono,
          empresa,
          estado,
          fecha_creacion,
          ultimo_acceso
      `,
      [rolQuery.rows[0].id_rol, nombre, correo, passwordHash, telefono || null, empresa || null],
    )

    await notificarAdministradores(pool, {
      titulo: 'Cliente creado',
      mensaje: `Se creo el cliente ${nombre}.`,
      tipo: 'success',
    })

    return res.status(201).json({
      mensaje: 'Cliente creado correctamente',
      cliente: clienteQuery.rows[0],
    })
  } catch (error) {
    console.error('Error al crear cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al crear cliente',
    })
  }
}

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, telefono, empresa, estado } = req.body

    if (!nombre || !estado) {
      return res.status(400).json({
        mensaje: 'Nombre y estado son obligatorios',
      })
    }

    if (!['activo', 'inactivo', 'bloqueado'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado invalido',
      })
    }

    const clienteQuery = await pool.query(
      `
        UPDATE tb_usuarios u
        SET
          nombre = $1,
          telefono = $2,
          empresa = $3,
          estado = $4,
          fecha_actualizacion = NOW()
        FROM tb_roles r
        WHERE u.id_rol = r.id_rol
          AND u.id_usuario = $5
          AND r.nombre_rol = 'Cliente'
        RETURNING
          u.id_usuario,
          u.nombre,
          u.correo,
          u.telefono,
          u.empresa,
          u.estado,
          u.fecha_creacion,
          u.ultimo_acceso
      `,
      [nombre, telefono || null, empresa || null, estado, id],
    )

    if (clienteQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado o el usuario no pertenece al rol Cliente',
      })
    }

    return res.json({
      mensaje: 'Cliente actualizado correctamente',
      cliente: clienteQuery.rows[0],
    })
  } catch (error) {
    console.error('Error al actualizar cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al actualizar cliente',
    })
  }
}

const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params

    // El DELETE se limita al rol Cliente para evitar eliminar administradores.
    const clienteQuery = await pool.query(
      `
        DELETE FROM tb_usuarios u
        USING tb_roles r
        WHERE u.id_rol = r.id_rol
          AND u.id_usuario = $1
          AND r.nombre_rol = 'Cliente'
        RETURNING u.id_usuario
      `,
      [id],
    )

    if (clienteQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado o no se puede eliminar un administrador',
      })
    }

    return res.json({
      mensaje: 'Cliente eliminado correctamente',
    })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)

    return res.status(500).json({
      mensaje: 'Error interno al eliminar cliente',
    })
  }
}

module.exports = {
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
}
