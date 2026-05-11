const express = require('express')
const {
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/login', login)
router.get('/perfil', authMiddleware, obtenerPerfil)
router.put('/perfil', authMiddleware, actualizarPerfil)
router.put('/cambiar-password', authMiddleware, cambiarPassword)

module.exports = router
