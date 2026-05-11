import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, FolderKanban, Loader2 } from 'lucide-react'
import api from '../../services/api'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  return texto ? texto.replaceAll('_', ' ') : 'Sin dato'
}

function ProyectosClientePage() {
  const [proyectos, setProyectos] = useState([])
  const [detalle, setDetalle] = useState({})
  const [proyectoAbierto, setProyectoAbierto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        setCargando(true)
        setError('')
        const { data } = await api.get('/cliente/proyectos')
        setProyectos(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudieron cargar tus proyectos.')
      } finally {
        setCargando(false)
      }
    }

    cargarProyectos()
  }, [])

  const alternarDetalle = async (idProyecto) => {
    if (proyectoAbierto === idProyecto) {
      setProyectoAbierto(null)
      return
    }

    try {
      setError('')
      if (!detalle[idProyecto]) {
        const { data } = await api.get(`/cliente/proyectos/${idProyecto}`)
        setDetalle((prevState) => ({ ...prevState, [idProyecto]: data }))
      }
      setProyectoAbierto(idProyecto)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cargar el detalle del proyecto.')
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
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Mis Proyectos</h2>
        <p className="mt-2 text-sm text-slate-600">
          Consulta el avance y las tareas asociadas a tus proyectos.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {proyectos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 font-semibold text-slate-950">Sin proyectos asignados</p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando tengas proyectos asignados apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proyectos.map((proyecto) => (
            <article key={proyecto.id_proyecto} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{proyecto.nombre}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {proyecto.descripcion || 'Sin descripcion'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alternarDetalle(proyecto.id_proyecto)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {proyectoAbierto === proyecto.id_proyecto ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Detalle
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Dato label="Estado" value={formatearTexto(proyecto.estado)} />
                <Dato label="Prioridad" value={proyecto.prioridad} />
                <Dato label="Inicio" value={formatearFecha(proyecto.fecha_inicio)} />
                <Dato label="Fin" value={formatearFecha(proyecto.fecha_fin)} />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Progreso</span>
                  <span className="font-bold text-slate-950">{Number(proyecto.progreso || 0)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-600"
                    style={{ width: `${Math.min(Number(proyecto.progreso || 0), 100)}%` }}
                  />
                </div>
              </div>

              {proyectoAbierto === proyecto.id_proyecto && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-950">Mis tareas en este proyecto</h4>
                  {detalle[proyecto.id_proyecto]?.tareas?.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {detalle[proyecto.id_proyecto].tareas.map((tarea) => (
                        <div key={tarea.id_tarea} className="rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm">
                          <p className="font-semibold text-slate-950">{tarea.titulo}</p>
                          <p className="mt-1 text-slate-500">
                            {formatearTexto(tarea.estado)} · {tarea.prioridad}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No tienes tareas asignadas en este proyecto.
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
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

export default ProyectosClientePage
