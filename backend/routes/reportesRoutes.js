const express = require('express')
const {
  obtenerReporteGeneral,
  obtenerReporteProyecto,
  obtenerReporteCliente,
  obtenerReporteGrupo,
  obtenerReporteTareasVencidas,
  obtenerReporteProductividad,
  obtenerOpcionesClientes,
  obtenerOpcionesGrupos,
} = require('../controllers/reportesController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// Reportes disponibles solo para administradores autenticados.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/general', obtenerReporteGeneral)
router.get('/opciones/clientes', obtenerOpcionesClientes)
router.get('/opciones/grupos', obtenerOpcionesGrupos)
router.get('/tareas-vencidas', obtenerReporteTareasVencidas)
router.get('/productividad', obtenerReporteProductividad)
router.get('/cliente/:id', obtenerReporteCliente)
router.get('/grupo/:id', obtenerReporteGrupo)
router.get('/proyecto/:id', obtenerReporteProyecto)

module.exports = router
