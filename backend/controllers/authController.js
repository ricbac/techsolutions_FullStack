const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const { enviarCorreoRecuperacion } = require('../utils/emailService')

const generarToken = (usuario) => {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.nombre_rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )
}

const login = async (req, res) => {
  try {
    const { correo, password } = req.body

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: 'Correo y password son obligatorios',
      })
    }

    const usuarioQuery = await pool.query(
      `
        SELECT
          u.id_usuario,
          u.id_rol,
          r.nombre_rol,
          u.nombre,
          u.correo,
          u.password_hash,
          u.empresa,
          u.telefono,
          u.estado,
          u.ultimo_acceso,
          u.fecha_creacion
        FROM tb_usuarios u
        INNER JOIN tb_roles r ON r.id_rol = u.id_rol
        WHERE u.correo = $1
        LIMIT 1
      `,
      [correo],
    )

    if (usuarioQuery.rows.length === 0) {
      return res.status(401).json({
        mensaje: 'Credenciales invalidas',
      })
    }

    const usuario = usuarioQuery.rows[0]

    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        mensaje: 'El usuario no esta activo',
      })
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'Credenciales invalidas',
      })
    }

    await pool.query(
      'UPDATE tb_usuarios SET ultimo_acceso = NOW(), fecha_actualizacion = NOW() WHERE id_usuario = $1',
      [usuario.id_usuario],
    )

    const token = generarToken(usuario)

    delete usuario.password_hash
    usuario.ultimo_acceso = new Date().toISOString()

    return res.json({
      mensaje: 'Inicio de sesion exitoso',
      token,
      usuario,
    })
  } catch (error) {
    console.error('Error en login:', error)

    return res.status(500).json({
      mensaje: 'Error interno al iniciar sesion',
    })
  }
}

const obtenerPerfil = async (req, res) => {
  try {
    const perfilQuery = await pool.query(
      `
        SELECT
          u.id_usuario,
          u.id_rol,
          r.nombre_rol,
          u.nombre,
          u.correo,
          u.empresa,
          u.telefono,
          u.estado,
          u.ultimo_acceso,
          u.fecha_creacion,
          u.fecha_actualizacion
        FROM tb_usuarios u
        INNER JOIN tb_roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1
        LIMIT 1
      `,
      [req.usuario.id_usuario],
    )

    if (perfilQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      })
    }

    return res.json({
      usuario: perfilQuery.rows[0],
    })
  } catch (error) {
    console.error('Error al obtener perfil:', error)

    return res.status(500).json({
      mensaje: 'Error interno al obtener perfil',
    })
  }
}

const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, empresa } = req.body

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre es obligatorio',
      })
    }

    const perfilQuery = await pool.query(
      `
        UPDATE tb_usuarios
        SET
          nombre = $1,
          telefono = $2,
          empresa = $3,
          fecha_actualizacion = NOW()
        WHERE id_usuario = $4
        RETURNING
          id_usuario,
          id_rol,
          nombre,
          correo,
          telefono,
          empresa,
          estado,
          ultimo_acceso
      `,
      [nombre, telefono || null, empresa || null, req.usuario.id_usuario],
    )

    if (perfilQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      })
    }

    const rolQuery = await pool.query(
      'SELECT nombre_rol FROM tb_roles WHERE id_rol = $1 LIMIT 1',
      [perfilQuery.rows[0].id_rol],
    )

    return res.json({
      mensaje: 'Perfil actualizado correctamente',
      usuario: {
        ...perfilQuery.rows[0],
        nombre_rol: rolQuery.rows[0]?.nombre_rol,
      },
    })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)

    return res.status(500).json({
      mensaje: 'Error interno al actualizar perfil',
    })
  }
}

const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({
        mensaje: 'Password actual y nueva password son obligatorios',
      })
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({
        mensaje: 'La nueva password debe tener al menos 8 caracteres',
      })
    }

    const usuarioQuery = await pool.query(
      'SELECT id_usuario, password_hash FROM tb_usuarios WHERE id_usuario = $1 LIMIT 1',
      [req.usuario.id_usuario],
    )

    if (usuarioQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      })
    }

    const passwordValido = await bcrypt.compare(passwordActual, usuarioQuery.rows[0].password_hash)

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'La password actual no es correcta',
      })
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10)

    await pool.query(
      'UPDATE tb_usuarios SET password_hash = $1, fecha_actualizacion = NOW() WHERE id_usuario = $2',
      [nuevoHash, req.usuario.id_usuario],
    )

    return res.json({
      mensaje: 'Password actualizada correctamente',
    })
  } catch (error) {
    console.error('Error al cambiar password:', error)

    return res.status(500).json({
      mensaje: 'Error interno al cambiar password',
    })
  }
}

const recuperarPassword = async (req, res) => {
  const mensajeGenerico = 'Si el correo existe, se enviaron instrucciones de recuperación.'

  try {
    const { correo } = req.body

    if (!correo) {
      return res.status(400).json({
        mensaje: 'El correo es obligatorio',
      })
    }

    const usuarioQuery = await pool.query(
      `
        SELECT id_usuario, nombre, correo
        FROM tb_usuarios
        WHERE correo = $1
          AND estado = 'activo'
        LIMIT 1
      `,
      [correo],
    )

    if (usuarioQuery.rows.length === 0) {
      return res.json({ mensaje: mensajeGenerico })
    }

    const usuario = usuarioQuery.rows[0]
    const token = crypto.randomBytes(32).toString('hex')
    const fechaExpiracion = new Date(Date.now() + 30 * 60 * 1000)

    await pool.query(
      `
        INSERT INTO tb_password_resets (id_usuario, token, fecha_expiracion)
        VALUES ($1, $2, $3)
      `,
      [usuario.id_usuario, token, fechaExpiracion],
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const enlace = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`

    try {
      await enviarCorreoRecuperacion({
        correo: usuario.correo,
        nombre: usuario.nombre,
        enlace,
      })
    } catch (errorCorreo) {
      console.error('No se pudo enviar correo de recuperacion:', errorCorreo.message)
    }

    return res.json({ mensaje: mensajeGenerico })
  } catch (error) {
    console.error('Error al solicitar recuperacion de password:', error)

    return res.status(500).json({
      mensaje: 'Error interno al solicitar recuperacion de password',
    })
  }
}

const resetPassword = async (req, res) => {
  const db = await pool.connect()

  try {
    const { token, nuevaPassword } = req.body

    if (!token || !nuevaPassword) {
      return res.status(400).json({
        mensaje: 'Token y nueva password son obligatorios',
      })
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({
        mensaje: 'La nueva password debe tener al menos 8 caracteres',
      })
    }

    await db.query('BEGIN')

    const resetQuery = await db.query(
      `
        SELECT id_reset, id_usuario, usado, fecha_expiracion
        FROM tb_password_resets
        WHERE token = $1
        LIMIT 1
      `,
      [token],
    )

    if (resetQuery.rows.length === 0) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: 'El enlace de recuperacion no es valido' })
    }

    const reset = resetQuery.rows[0]

    if (reset.usado) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: 'El enlace de recuperacion ya fue utilizado' })
    }

    if (new Date(reset.fecha_expiracion).getTime() < Date.now()) {
      await db.query('ROLLBACK')
      return res.status(400).json({ mensaje: 'El enlace de recuperacion ha expirado' })
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 10)

    await db.query(
      `
        UPDATE tb_usuarios
        SET password_hash = $1, fecha_actualizacion = NOW()
        WHERE id_usuario = $2
      `,
      [passwordHash, reset.id_usuario],
    )

    await db.query(
      'UPDATE tb_password_resets SET usado = TRUE WHERE id_reset = $1',
      [reset.id_reset],
    )

    await db.query('COMMIT')

    return res.json({ mensaje: 'Password actualizada correctamente' })
  } catch (error) {
    await db.query('ROLLBACK')
    console.error('Error al restablecer password:', error)

    return res.status(500).json({
      mensaje: 'Error interno al restablecer password',
    })
  } finally {
    db.release()
  }
}

module.exports = {
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  recuperarPassword,
  resetPassword,
}
