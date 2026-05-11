import {
  BarChart3,
  Bell,
  CheckSquare,
  FolderKanban,
  LogOut,
  Menu,
  FileText,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const opcionesMenu = [
  { nombre: 'Inicio', ruta: '/admin/dashboard', icono: BarChart3 },
  { nombre: 'Clientes', ruta: '/admin/clientes', icono: Users },
  { nombre: 'Grupos', ruta: '/admin/grupos', icono: UsersRound },
  { nombre: 'Proyectos', ruta: '/admin/proyectos', icono: FolderKanban },
  { nombre: 'Tareas', ruta: '/admin/tareas', icono: CheckSquare },
  { nombre: 'Reportes', ruta: '/admin/reportes', icono: FileText },
  { nombre: 'Notificaciones', ruta: '/admin/notificaciones', icono: Bell, badge: true },
  { nombre: 'Perfil', ruta: '/admin/perfil', icono: UserRound },
]

function AdminLayout() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 lg:flex">
        <div className="shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
            TechSolutions
          </p>
          <h1 className="mt-2 text-xl font-bold text-white">Panel Admin</h1>
        </div>

        <nav className="scrollbar-sutil mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 pb-4">
          {opcionesMenu.map(({ nombre, ruta, icono: Icono, badge }) => (
            ruta ? (
              <NavLink
                key={nombre}
                to={ruta}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/10 text-white ring-1 ring-sky-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <Icono className="h-5 w-5 text-sky-400" />
                <span className="flex-1">{nombre}</span>
                {badge && noLeidas > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {noLeidas}
                  </span>
                )}
              </NavLink>
            ) : (
              <button
                key={nombre}
                type="button"
                className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-500"
              >
                <Icono className="h-5 w-5 text-slate-600" />
                {nombre}
              </button>
            )
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-800 pt-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-white">{usuario?.nombre}</p>
            <p className="mt-1 text-xs text-slate-400">{usuario?.correo}</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-800 p-2 text-slate-300 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400 lg:hidden">
                  TechSolutions
                </p>
                <p className="text-sm text-slate-400">Modo administrador</p>
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900 lg:hidden"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
