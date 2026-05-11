const express = require('express')
const {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerClientePorId,
} = require('../controllers/clientesController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const router = express.Router()

// CRUD de clientes disponible solo para administradores autenticados.
router.use(authMiddleware)
router.use(roleMiddleware('Administrador'))

router.get('/', listarClientes)
router.get('/:id', obtenerClientePorId)
router.post('/', crearCliente)
router.put('/:id', actualizarCliente)
router.delete('/:id', eliminarCliente)

module.exports = router
