const express = require('express')
const {
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  listarClientesActivosParaOpciones,
  listarProyectosParaOpciones,
  listarTareas,
  obtenerTareaPorId,
} = require('../controllers/tareasController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// CRUD de tareas disponible solo para administradores autenticados.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/', listarTareas)
router.get('/opciones/proyectos', listarProyectosParaOpciones)
router.get('/opciones/clientes', listarClientesActivosParaOpciones)
router.get('/:id', obtenerTareaPorId)
router.post('/', crearTarea)
router.put('/:id', actualizarTarea)
router.delete('/:id', eliminarTarea)

module.exports = router
