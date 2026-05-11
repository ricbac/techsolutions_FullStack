import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ rolesPermitidos = [] }) {
  const { token, usuario, cargandoSesion } = useAuth()

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-slate-200">
        Verificando sesion...
      </div>
    )
  }

  if (!token || !usuario) {
    return <Navigate to="/login" replace />
  }

  const rolValido =
    rolesPermitidos.length === 0 ||
    rolesPermitidos.includes(usuario.nombre_rol) ||
    rolesPermitidos.includes(usuario.id_rol)

  if (!rolValido) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
