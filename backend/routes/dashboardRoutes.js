const express = require('express')
const {
  obtenerActividadReciente,
  obtenerProyectosPorEstado,
  obtenerResumenAdmin,
  obtenerTareasPorEstado,
} = require('../controllers/dashboardController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// Todas las rutas del dashboard administrador requieren JWT y rol Administrador.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/admin/resumen', obtenerResumenAdmin)
router.get('/admin/proyectos-estados', obtenerProyectosPorEstado)
router.get('/admin/tareas-estados', obtenerTareasPorEstado)
router.get('/admin/actividad-reciente', obtenerActividadReciente)

module.exports = router
