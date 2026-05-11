import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'
import api from '../../services/api'

const filtrosIniciales = {
  proyecto: '',
  estado: '',
  prioridad: '',
}

const estados = ['pendiente', 'en_progreso', 'completada', 'cancelada']
const prioridades = ['baja', 'media', 'alta', 'urgente']

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  return texto ? texto.replaceAll('_', ' ') : 'Sin dato'
}

function TareasClientePage() {
  const [tareas, setTareas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const cargarProyectos = async () => {
    const { data } = await api.get('/cliente/proyectos')
    setProyectos(data)
  }

  const cargarTareas = async (filtrosActuales = filtros) => {
    const params = Object.fromEntries(
      Object.entries(filtrosActuales).filter(([, value]) => Boolean(value)),
    )
    const { data } = await api.get('/cliente/tareas', { params })
    setTareas(data)
  }

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')
      await Promise.all([cargarProyectos(), cargarTareas()])
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar tus tareas.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (cargando) return

    const timeout = setTimeout(async () => {
      try {
        setError('')
        await cargarTareas(filtros)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudieron aplicar los filtros.')
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [filtros])

  const actualizarFiltro = (event) => {
    const { name, value } = event.target
    setFiltros((prevState) => ({ ...prevState, [name]: value }))
  }

  const completarTarea = async (tarea) => {
    try {
      setProcesando(tarea.id_tarea)
      setError('')
      setExito('')
      await api.put(`/cliente/tareas/${tarea.id_tarea}/completar`)
      setExito('Tarea marcada como completada.')
      await cargarTareas()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo completar la tarea.')
    } finally {
      setProcesando(null)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
      </div>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          Portal Cliente
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Mis Tareas</h2>
        <p className="mt-2 text-sm text-slate-600">
          Revisa tus tareas asignadas y marca como completadas las finalizadas.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {exito && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {exito}
        </div>
      )}

      <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <SelectFiltro label="Proyecto" name="proyecto" value={filtros.proyecto} onChange={actualizarFiltro}>
          <option value="">Todos</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
              {proyecto.nombre}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro label="Estado" name="estado" value={filtros.estado} onChange={actualizarFiltro}>
          <option value="">Todos</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>{formatearTexto(estado)}</option>
          ))}
        </SelectFiltro>
        <SelectFiltro label="Prioridad" name="prioridad" value={filtros.prioridad} onChange={actualizarFiltro}>
          <option value="">Todas</option>
          {prioridades.map((prioridad) => (
            <option key={prioridad} value={prioridad}>{prioridad}</option>
          ))}
        </SelectFiltro>
      </div>

      {tareas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 font-semibold text-slate-950">Sin tareas asignadas</p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando tengas tareas asignadas apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tareas.map((tarea) => (
            <article key={tarea.id_tarea} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">{tarea.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-500">{tarea.proyecto}</p>
                  {tarea.descripcion && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{tarea.descripcion}</p>
                  )}
                </div>
                {tarea.estado !== 'completada' && (
                  <button
                    type="button"
                    onClick={() => completarTarea(tarea)}
                    disabled={procesando === tarea.id_tarea}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {procesando === tarea.id_tarea ? 'Procesando...' : 'Marcar completada'}
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Dato label="Estado" value={formatearTexto(tarea.estado)} />
                <Dato label="Prioridad" value={tarea.prioridad} />
                <Dato label="Inicio" value={formatearFecha(tarea.fecha_inicio)} />
                <Dato label="Limite" value={formatearFecha(tarea.fecha_limite)} />
              </div>

              {tarea.fecha_completada && (
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  Completada el {formatearFecha(tarea.fecha_completada)}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function SelectFiltro({ label, name, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      >
        {children}
      </select>
    </label>
  )
}

function Dato({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-800">{value}</p>
    </div>
  )
}

export default TareasClientePage
