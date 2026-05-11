const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          mensaje: 'Usuario no autenticado',
        })
      }

      const permitido = rolesPermitidos.some((rol) => {
        return rol === req.usuario.nombre_rol || Number(rol) === Number(req.usuario.id_rol)
      })

      if (!permitido) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para realizar esta accion',
        })
      }

      return next()
    } catch (error) {
      return res.status(500).json({
        mensaje: 'Error interno al validar permisos',
      })
    }
  }
}

module.exports = roleMiddleware
