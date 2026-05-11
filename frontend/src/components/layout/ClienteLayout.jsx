import { BarChart3, Bell, CheckSquare, FolderKanban, LogOut, Menu, UserRound } from 'lucide-react'
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
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

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
    setSidebarAbierto(false)
    navigate('/login', { replace: true })
  }

  const cerrarSidebar = () => setSidebarAbierto(false)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {sidebarAbierto && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={cerrarSidebar}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm sm:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-2xl transition-transform duration-200 sm:hidden ${
        sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            TechSolutions
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">Portal Cliente</h1>
        </div>

        <nav className="scrollbar-sutil mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">
          {opcionesCliente.map(({ nombre, ruta, icono: Icono, badge }) => (
            <NavLink
              key={ruta}
              to={ruta}
              onClick={cerrarSidebar}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-100'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icono className="h-5 w-5 text-sky-700" />
              <span className="flex-1">{nombre}</span>
              {badge && noLeidas > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200 pt-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{usuario?.nombre}</p>
            <p className="mt-1 text-xs text-slate-500">{usuario?.correo}</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarAbierto(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 sm:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                TechSolutions
              </p>
              <h1 className="text-lg font-bold text-slate-950">Portal Cliente</h1>
            </div>
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

      <nav className="hidden border-b border-slate-200 bg-white sm:block">
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
