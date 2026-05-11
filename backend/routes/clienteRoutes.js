const express = require('express')
const {
  completarTareaCliente,
  listarProyectosCliente,
  listarTareasCliente,
  obtenerDashboardCliente,
  obtenerProyectoClientePorId,
} = require('../controllers/clienteController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// Todas las rutas del portal cliente requieren JWT y rol Cliente.
router.use(authMiddleware)
router.use(roleMiddleware('Cliente'))

router.get('/dashboard', obtenerDashboardCliente)
router.get('/proyectos', listarProyectosCliente)
router.get('/proyectos/:id', obtenerProyectoClientePorId)
router.get('/tareas', listarTareasCliente)
router.put('/tareas/:id/completar', completarTareaCliente)

module.exports = router
