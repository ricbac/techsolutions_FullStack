const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        mensaje: 'Token de autorizacion requerido',
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        mensaje: 'Token de autorizacion requerido',
      })
    }

    const usuario = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = usuario

    return next()
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token invalido o expirado',
    })
  }
}

module.exports = authMiddleware
