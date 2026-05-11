const express = require('express')
const {
  actualizarProyecto,
  crearProyecto,
  eliminarProyecto,
  listarClientesActivosParaOpciones,
  listarGruposActivosParaOpciones,
  listarProyectos,
  obtenerProyectoPorId,
} = require('../controllers/proyectosController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// CRUD de proyectos disponible solo para administradores autenticados.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/', listarProyectos)
router.get('/opciones/clientes', listarClientesActivosParaOpciones)
router.get('/opciones/grupos', listarGruposActivosParaOpciones)
router.get('/:id', obtenerProyectoPorId)
router.post('/', crearProyecto)
router.put('/:id', actualizarProyecto)
router.delete('/:id', eliminarProyecto)

module.exports = router
