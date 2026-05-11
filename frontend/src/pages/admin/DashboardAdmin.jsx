import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Loader2,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import EmptyState from '../../components/dashboard/EmptyState'
import KpiCard from '../../components/dashboard/KpiCard'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const coloresEstados = ['#38bdf8', '#22c55e', '#f59e0b', '#f43f5e', '#a78bfa']

const resumenInicial = {
  totalClientes: 0,
  totalProyectos: 0,
  totalTareas: 0,
  tareasCompletadas: 0,
  tareasPendientes: 0,
  tareasVencidas: 0,
}

function formatearEstado(estado) {
  return estado.replaceAll('_', ' ')
}

function DashboardAdmin() {
  const { usuario } = useAuth()
  const [resumen, setResumen] = useState(resumenInicial)
  const [proyectosEstados, setProyectosEstados] = useState([])
  const [tareasEstados, setTareasEstados] = useState([])
  const [actividadReciente, setActividadReciente] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setCargando(true)
        setError('')

        const [resumenResp, proyectosResp, tareasResp, actividadResp] =
          await Promise.all([
            api.get('/dashboard/admin/resumen'),
            api.get('/dashboard/admin/proyectos-estados'),
            api.get('/dashboard/admin/tareas-estados'),
            api.get('/dashboard/admin/actividad-reciente'),
          ])

        setResumen(resumenResp.data)
        setProyectosEstados(proyectosResp.data)
        setTareasEstados(tareasResp.data)
        setActividadReciente(actividadResp.data)
      } catch (err) {
        setError(
          err.response?.data?.mensaje ||
            'No se pudieron cargar los datos de inicio.',
        )
      } finally {
        setCargando(false)
      }
    }

    cargarDashboard()
  }, [])

  const kpis = [
    { titulo: 'Total clientes', valor: resumen.totalClientes, icono: Users },
    {
      titulo: 'Total proyectos',
      valor: resumen.totalProyectos,
      icono: FolderKanban,
      tono: 'emerald',
    },
    {
      titulo: 'Total tareas',
      valor: resumen.totalTareas,
      icono: ClipboardList,
      tono: 'amber',
    },
    {
      titulo: 'Tareas completadas',
      valor: resumen.tareasCompletadas,
      icono: CheckCircle2,
      tono: 'emerald',
    },
    {
      titulo: 'Tareas pendientes',
      valor: resumen.tareasPendientes,
      icono: ClipboardList,
      tono: 'sky',
    },
    {
      titulo: 'Tareas vencidas',
      valor: resumen.tareasVencidas,
      icono: AlertTriangle,
      tono: 'rose',
    },
  ]

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-400" />
          <p className="mt-4 text-sm font-medium text-slate-300">
            Cargando inicio...
          </p>
        </div>
      </div>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
          Inicio
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">
          Bienvenido, {usuario?.nombre}
        </h2>
        <p className="mt-2 text-slate-400">Rol activo: {usuario?.nombre_rol}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.titulo} {...kpi} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white">Proyectos por estado</h3>
            <p className="mt-1 text-sm text-slate-400">
              Conteo actualizado de proyectos activos.
            </p>
          </div>

          {proyectosEstados.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={proyectosEstados}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="estado"
                    tickFormatter={formatearEstado}
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    labelFormatter={formatearEstado}
                  />
                  <Bar dataKey="total" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white">Tareas por estado</h3>
            <p className="mt-1 text-sm text-slate-400">
              Distribucion general de tareas registradas.
            </p>
          </div>

          {tareasEstados.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tareasEstados}
                    dataKey="total"
                    nameKey="estado"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {tareasEstados.map((entry, index) => (
                      <Cell
                        key={entry.estado}
                        fill={coloresEstados[index % coloresEstados.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value, name) => [value, formatearEstado(name)]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-slate-300">
                        {formatearEstado(value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <article className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-white">Actividad reciente</h3>
          <p className="mt-1 text-sm text-slate-400">
            Ultimos movimientos registrados en el historial.
          </p>
        </div>

        {actividadReciente.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-800">
            {actividadReciente.map((actividad) => (
              <div
                key={actividad.id_historial}
                className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-100">{actividad.accion}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {actividad.descripcion || 'Sin descripcion'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {actividad.nombre_usuario || 'Usuario no disponible'}
                  </p>
                </div>
                <time className="text-sm text-slate-500">
                  {new Date(actividad.fecha_creacion).toLocaleDateString('es-GT')}
                </time>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default DashboardAdmin
