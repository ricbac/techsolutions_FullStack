import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, FolderKanban, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const resumenInicial = {
  totalProyectosAsignados: 0,
  totalTareas: 0,
  tareasPendientes: 0,
  tareasCompletadas: 0,
  tareasVencidas: 0,
}

function DashboardCliente() {
  const { usuario } = useAuth()
  const [resumen, setResumen] = useState(resumenInicial)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setCargando(true)
        setError('')
        const { data } = await api.get('/cliente/dashboard')
        setResumen(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar tu dashboard.')
      } finally {
        setCargando(false)
      }
    }

    cargarDashboard()
  }, [])

  const cards = [
    {
      titulo: 'Proyectos asignados',
      valor: resumen.totalProyectosAsignados,
      icono: FolderKanban,
      color: 'text-sky-700 bg-sky-50',
    },
    {
      titulo: 'Tareas pendientes',
      valor: resumen.tareasPendientes,
      icono: ClipboardList,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      titulo: 'Tareas completadas',
      valor: resumen.tareasCompletadas,
      icono: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      titulo: 'Tareas vencidas',
      valor: resumen.tareasVencidas,
      icono: AlertTriangle,
      color: 'text-red-700 bg-red-50',
    },
  ]

  if (cargando) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-700" />
          <p className="mt-4 text-sm font-medium text-slate-500">Cargando inicio...</p>
        </div>
      </div>
    )
  }

  return (
    <section>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          Inicio
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Bienvenido, {usuario?.nombre}
        </h2>
        <p className="mt-2 text-slate-600">Rol activo: {usuario?.nombre_rol}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ titulo, valor, icono: Icono, color }) => (
          <article key={titulo} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-lg p-3 ${color}`}>
              <Icono className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{titulo}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{valor}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardCliente
