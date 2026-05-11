const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const clienteRoutes = require('./routes/clienteRoutes')
const clientesRoutes = require('./routes/clientesRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const gruposRoutes = require('./routes/gruposRoutes')
const proyectosRoutes = require('./routes/proyectosRoutes')
const reportesRoutes = require('./routes/reportesRoutes')
const tareasRoutes = require('./routes/tareasRoutes')
const notificacionesRoutes = require('./routes/notificacionesRoutes')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 4000
const ORIGENES_PERMITIDOS = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origen no permitido por CORS'))
  },
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/cliente', clienteRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/grupos', gruposRoutes)
app.use('/api/proyectos', proyectosRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/tareas', tareasRoutes)
app.use('/api/notificaciones', notificacionesRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API de TechSolutions v2.0 funcionando',
  })
})

app.listen(PORT, () => {
  console.log(`Servidor backend ejecutandose en http://localhost:${PORT}`)
})
