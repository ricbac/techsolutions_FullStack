const express = require('express')
const {
  actualizarGrupo,
  crearGrupo,
  eliminarGrupo,
  listarClientesParaOpciones,
  listarGrupos,
  obtenerGrupoPorId,
} = require('../controllers/gruposController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// CRUD de grupos disponible solo para administradores autenticados.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/', listarGrupos)
router.get('/opciones/clientes', listarClientesParaOpciones)
router.get('/:id', obtenerGrupoPorId)
router.post('/', crearGrupo)
router.put('/:id', actualizarGrupo)
router.delete('/:id', eliminarGrupo)

module.exports = router
