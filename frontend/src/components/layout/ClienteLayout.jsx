import { BarChart3, Bell, CheckSquare, FolderKanban, LogOut, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const opcionesCliente = [
  { nombre: 'Inicio', ruta: '/cliente/dashboard', icono: BarChart3 },
  { nombre: 'Mis Proyectos', ruta: '/cliente/proyectos', icono: FolderKanban },
  { nombre: 'Mis Tareas', ruta: '/cliente/tareas', icono: CheckSquare },
  { nombre: 'Notificaciones', ruta: '/cliente/notificaciones', icono: Bell, badge: true },
  { nombre: 'Mi Perfil', ruta: '/cliente/perfil', icono: UserRound },
]

function ClienteLayout() {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    const cargarConteo = async () => {
      try {
        const { data } = await api.get('/notificaciones/no-leidas/count')
        setNoLeidas(data.total || 0)
      } catch {
        setNoLeidas(0)
      }
    }

    cargarConteo()
    const intervalo = setInterval(cargarConteo, 30000)
    window.addEventListener('notificaciones:actualizar', cargarConteo)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('notificaciones:actualizar', cargarConteo)
    }
  }, [])

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              TechSolutions
            </p>
            <h1 className="text-lg font-bold text-slate-950">Portal Cliente</h1>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="scrollbar-sutil mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 pb-4 sm:px-6 lg:px-8">
          {opcionesCliente.map(({ nombre, ruta, icono: Icono, badge }) => (
            <NavLink
              key={ruta}
              to={ruta}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-100'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icono className="h-4 w-4" />
              {nombre}
              {badge && noLeidas > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Sesion activa</p>
          <p className="mt-1 font-semibold text-slate-950">{usuario?.nombre}</p>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default ClienteLayout
