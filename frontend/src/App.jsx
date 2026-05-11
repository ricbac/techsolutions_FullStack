import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import ClienteLayout from './components/layout/ClienteLayout'
import { useAuth } from './context/AuthContext'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import ClientesPage from './pages/admin/ClientesPage'
import GruposPage from './pages/admin/GruposPage'
import NotificacionesAdminPage from './pages/admin/NotificacionesAdminPage'
import PerfilAdminPage from './pages/admin/PerfilAdminPage'
import ProyectoDetallePage from './pages/admin/ProyectoDetallePage'
import ProyectosPage from './pages/admin/ProyectosPage'
import ReportesPage from './pages/admin/ReportesPage'
import TareasPage from './pages/admin/TareasPage'
import DashboardCliente from './pages/cliente/DashboardCliente'
import NotificacionesClientePage from './pages/cliente/NotificacionesClientePage'
import PerfilClientePage from './pages/cliente/PerfilClientePage'
import ProyectosClientePage from './pages/cliente/ProyectosClientePage'
import TareasClientePage from './pages/cliente/TareasClientePage'
import LoginPage from './pages/LoginPage'

function RutaInicial() {
  const { usuario, autenticado, cargandoSesion } = useAuth()

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-slate-200">
        Cargando sesion...
      </div>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />

  if (usuario?.nombre_rol === 'Administrador') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (usuario?.nombre_rol === 'Cliente') {
    return <Navigate to="/cliente/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RutaInicial />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute rolesPermitidos={['Administrador']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/clientes" element={<ClientesPage />} />
          <Route path="/admin/grupos" element={<GruposPage />} />
          <Route path="/admin/proyectos" element={<ProyectosPage />} />
          <Route path="/admin/proyectos/:id" element={<ProyectoDetallePage />} />
          <Route path="/admin/tareas" element={<TareasPage />} />
          <Route path="/admin/reportes" element={<ReportesPage />} />
          <Route path="/admin/notificaciones" element={<NotificacionesAdminPage />} />
          <Route path="/admin/perfil" element={<PerfilAdminPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rolesPermitidos={['Cliente']} />}>
        <Route element={<ClienteLayout />}>
          <Route path="/cliente/dashboard" element={<DashboardCliente />} />
          <Route path="/cliente/proyectos" element={<ProyectosClientePage />} />
          <Route path="/cliente/tareas" element={<TareasClientePage />} />
          <Route path="/cliente/notificaciones" element={<NotificacionesClientePage />} />
          <Route path="/cliente/perfil" element={<PerfilClientePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
