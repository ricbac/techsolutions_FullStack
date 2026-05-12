const express = require('express')
const {
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  recuperarPassword,
  resetPassword,
} = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/login', login)
router.post('/recuperar-password', recuperarPassword)
router.post('/reset-password', resetPassword)
router.get('/perfil', authMiddleware, obtenerPerfil)
router.put('/perfil', authMiddleware, actualizarPerfil)
router.put('/cambiar-password', authMiddleware, cambiarPassword)

module.exports = router
