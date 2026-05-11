const express = require('express')
const {
  listarNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
} = require('../controllers/notificacionesController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// Todas las notificaciones pertenecen al usuario autenticado.
router.use(authMiddleware)

router.get('/', listarNotificaciones)
router.get('/no-leidas/count', contarNoLeidas)
router.put('/leer-todas', marcarTodasComoLeidas)
router.put('/:id/leer', marcarComoLeida)
router.delete('/:id', eliminarNotificacion)

module.exports = router
