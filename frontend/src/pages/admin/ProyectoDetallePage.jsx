import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Users, UsersRound, ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const filtrosIniciales = {
  estado: '',
  prioridad: '',
  cliente: '',
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  return texto ? texto.replaceAll('_', ' ') : 'Sin dato'
}

function obtenerTiempoOrden(tarea) {
  const fechaBase = tarea.fecha_creacion || tarea.fecha_inicio || tarea.fecha_limite
  return fechaBase ? new Date(fechaBase).getTime() : 0
}

function estadoClase(estado) {
  const clases = {
    pendiente: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
    en_progreso: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    completada: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    cancelada: 'bg-red-500/10 text-red-300 ring-red-500/20',
    planificacion: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    en_revision: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
    completado: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  }
  return clases[estado] || clases.pendiente
}

function ProyectoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState(filtrosIniciales)

  useEffect(() => {
    const cargarProyecto = async () => {
      try {
        setCargando(true)
        setError('')
        const { data } = await api.get(`/proyectos/${id}`)
        setProyecto(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el proyecto.')
      } finally {
        setCargando(false)
      }
    }

    cargarProyecto()
  }, [id])

  const tareasFiltradas = useMemo(() => {
    if (!proyecto) return []

    return proyecto.tareas.filter((tarea) => {
      const coincideEstado = !filtros.estado || tarea.estado === filtros.estado
      const coincidePrioridad = !filtros.prioridad || tarea.prioridad === filtros.prioridad
      const coincideCliente = !filtros.cliente || String(tarea.asignado_a) === filtros.cliente
      return coincideEstado && coincidePrioridad && coincideCliente
    }).sort((a, b) => obtenerTiempoOrden(a) - obtenerTiempoOrden(b))
  }, [proyecto, filtros])

  const actualizarFiltro = (event) => {
    const { name, value } = event.target
    setFiltros((prevState) => ({ ...prevState, [name]: value }))
  }

  if (cargando) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
        {error}
      </div>
    )
  }

  if (!proyecto) return null

  const clientesDirectos = proyecto.clientes_directos || proyecto.clientes || []
  const gruposAsignados = proyecto.grupos_asignados || []
  const clientesRelacionados = proyecto.clientes_relacionados || clientesDirectos
  const progresoIndividual = proyecto.progreso_individual_clientes || []
  const metricas = proyecto.metricas || {}
  const kpis = [
    { titulo: 'Clientes', valor: metricas.total_clientes || 0, icono: Users },
    { titulo: 'Grupos', valor: metricas.total_grupos || 0, icono: UsersRound },
    { titulo: 'Tareas', valor: metricas.total_tareas || 0, icono: ClipboardList },
    { titulo: 'Completadas', valor: metricas.tareas_completadas || 0, icono: CheckCircle2 },
    { titulo: 'Pendientes', valor: metricas.tareas_pendientes || 0, icono: Clock },
    { titulo: 'Vencidas', valor: metricas.tareas_vencidas || 0, icono: AlertTriangle },
  ]

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate('/admin/proyectos')}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <header className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
              Detalle de proyecto
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">{proyecto.nombre}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              {proyecto.descripcion || 'Sin descripcion'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{formatearTexto(proyecto.estado)}</Badge>
            <Badge>{proyecto.prioridad}</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Dato label="Fecha inicio" value={formatearFecha(proyecto.fecha_inicio)} />
          <Dato label="Fecha fin" value={formatearFecha(proyecto.fecha_fin)} />
          <div className="rounded-lg bg-slate-950 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Progreso</span>
              <span className="font-bold text-white">{Number(proyecto.progreso || 0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-sky-400"
                style={{ width: `${Math.min(Number(proyecto.progreso || 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map(({ titulo, valor, icono: Icono }) => (
          <article key={titulo} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <Icono className="h-5 w-5 text-sky-400" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
            <p className="mt-1 text-2xl font-bold text-white">{valor}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel titulo="Clientes individuales">
          {clientesDirectos.length === 0 ? (
            <EmptyText texto="Sin clientes individuales asignados." />
          ) : (
            <div className="grid gap-3">
              {clientesDirectos.map((cliente) => (
                <Item key={cliente.id_usuario} titulo={cliente.nombre} subtitulo={cliente.empresa || cliente.correo} />
              ))}
            </div>
          )}
        </Panel>

        <Panel titulo="Grupos asignados">
          {gruposAsignados.length === 0 ? (
            <EmptyText texto="Sin grupos asignados." />
          ) : (
            <div className="grid gap-3">
              {gruposAsignados.map((grupo) => (
                <Item
                  key={grupo.id_grupo}
                  titulo={grupo.nombre}
                  subtitulo={`${grupo.integrantes_count} integrantes - ${grupo.estado}`}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel titulo="Clientes relacionados totales" className="mt-6">
        {clientesRelacionados.length === 0 ? (
          <EmptyText texto="Sin clientes relacionados." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clientesRelacionados.map((cliente) => (
              <Item
                key={cliente.id_usuario}
                titulo={cliente.nombre}
                subtitulo={`${cliente.empresa || cliente.correo} - ${formatearTexto(cliente.origen)}`}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel titulo="Progreso individual" className="mt-6">
        {progresoIndividual.length === 0 ? (
          <EmptyText texto="Sin progreso individual disponible." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progresoIndividual.map((cliente) => (
              <article key={cliente.id_usuario} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">{cliente.nombre}</p>
                <p className="mt-1 text-xs text-slate-500">{cliente.empresa || cliente.correo}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {cliente.tareas_completadas}/{cliente.total_tareas} tareas
                  </span>
                  <span className="font-bold text-slate-200">{Number(cliente.progreso)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-emerald-400"
                    style={{ width: `${Math.min(Number(cliente.progreso), 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel titulo="Tareas del proyecto" className="mt-6">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <SelectFiltro name="estado" value={filtros.estado} onChange={actualizarFiltro}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </SelectFiltro>
          <SelectFiltro name="prioridad" value={filtros.prioridad} onChange={actualizarFiltro}>
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </SelectFiltro>
          <SelectFiltro name="cliente" value={filtros.cliente} onChange={actualizarFiltro}>
            <option value="">Todos los clientes</option>
            {clientesRelacionados.map((cliente) => (
              <option key={cliente.id_usuario} value={cliente.id_usuario}>
                {cliente.nombre}
              </option>
            ))}
          </SelectFiltro>
        </div>

        {tareasFiltradas.length === 0 ? (
          <EmptyText texto="Sin tareas con los filtros seleccionados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Tarea</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Prioridad</th>
                  <th className="px-3 py-3">Inicio</th>
                  <th className="px-3 py-3">Limite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tareasFiltradas.map((tarea) => (
                  <tr key={tarea.id_tarea}>
                    <td className="px-3 py-3 font-semibold text-white">{tarea.titulo}</td>
                    <td className="px-3 py-3 text-slate-300">{tarea.cliente_asignado || 'Sin asignar'}</td>
                    <td className="px-3 py-3"><Badge className={estadoClase(tarea.estado)}>{formatearTexto(tarea.estado)}</Badge></td>
                    <td className="px-3 py-3 text-slate-300">{tarea.prioridad}</td>
                    <td className="px-3 py-3 text-slate-300">{formatearFecha(tarea.fecha_inicio)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatearFecha(tarea.fecha_limite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel titulo="Gantt dinamico" className="mt-6">
        <Gantt tareas={tareasFiltradas} />
      </Panel>
    </section>
  )
}

function Gantt({ tareas }) {
  const tareasConFechas = tareas
    .filter((tarea) => tarea.fecha_inicio && tarea.fecha_limite)
    .sort((a, b) => obtenerTiempoOrden(a) - obtenerTiempoOrden(b))

  if (tareasConFechas.length === 0) {
    return <EmptyText texto="No hay tareas con fechas suficientes para el Gantt." />
  }

  const fechas = tareasConFechas.flatMap((tarea) => [
    new Date(tarea.fecha_inicio).getTime(),
    new Date(tarea.fecha_limite).getTime(),
  ])
  const inicio = Math.min(...fechas)
  const fin = Math.max(...fechas)
  const duracion = Math.max(fin - inicio, 86400000)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="mb-3 grid grid-cols-[220px_1fr] gap-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Tarea</span>
          <div className="flex justify-between">
            <span>{formatearFecha(inicio)}</span>
            <span>{formatearFecha(fin)}</span>
          </div>
        </div>

        <div className="grid gap-3">
          {tareasConFechas.map((tarea) => {
            const taskStart = new Date(tarea.fecha_inicio).getTime()
            const taskEnd = new Date(tarea.fecha_limite).getTime()
            const left = ((taskStart - inicio) / duracion) * 100
            const width = Math.max(((taskEnd - taskStart) / duracion) * 100, 4)
            const completada = tarea.estado === 'completada'
            const progreso = completada ? 100 : tarea.estado === 'en_progreso' ? 50 : 15

            return (
              <div key={tarea.id_tarea} className="grid grid-cols-[220px_1fr] items-center gap-4">
                <div>
                  <p className="truncate text-sm font-semibold text-white">{tarea.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {formatearFecha(tarea.fecha_inicio)} - {formatearFecha(tarea.fecha_limite)}
                  </p>
                </div>
                <div className="relative h-10 rounded-lg bg-slate-950">
                  <div
                    className={`absolute top-2 h-6 rounded-lg ring-1 ${estadoClase(tarea.estado)}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <div
                      className="h-full rounded-lg bg-current opacity-30"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Panel({ titulo, className = '', children }) {
  return (
    <section className={`rounded-lg border border-slate-800 bg-slate-900 p-5 ${className}`}>
      <h2 className="mb-4 text-lg font-bold text-white">{titulo}</h2>
      {children}
    </section>
  )
}

function Badge({ className = 'bg-slate-500/10 text-slate-300 ring-slate-500/20', children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${className}`}>
      {children}
    </span>
  )
}

function Dato({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-200">{value}</p>
    </div>
  )
}

function Item({ titulo, subtitulo }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <p className="font-semibold text-white">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
    </div>
  )
}

function EmptyText({ texto }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-8 text-center text-sm text-slate-500">
      {texto}
    </div>
  )
}

function SelectFiltro({ name, value, onChange, children }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
    >
      {children}
    </select>
  )
}

export default ProyectoDetallePage
