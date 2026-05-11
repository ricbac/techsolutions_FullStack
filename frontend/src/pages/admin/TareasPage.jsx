import { useEffect, useState } from 'react'
import { CheckSquare, Loader2, Plus } from 'lucide-react'
import EmptyState from '../../components/dashboard/EmptyState'
import TareaModal, { formularioInicialTarea } from '../../components/tareas/TareaModal'
import TareasFiltros, {
  filtrosInicialesTareas,
} from '../../components/tareas/TareasFiltros'
import TareasTable from '../../components/tareas/TareasTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../services/api'

function fechaInput(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toISOString().slice(0, 10)
}

function TareasPage() {
  const [tareas, setTareas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [clientes, setClientes] = useState([])
  const [filtros, setFiltros] = useState(filtrosInicialesTareas)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [tareaEditando, setTareaEditando] = useState(null)
  const [tareaEliminando, setTareaEliminando] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicialTarea)
  const [errores, setErrores] = useState({})

  const cargarOpciones = async () => {
    const [proyectosResp, clientesResp] = await Promise.all([
      api.get('/tareas/opciones/proyectos'),
      api.get('/tareas/opciones/clientes'),
    ])

    setProyectos(proyectosResp.data)
    setClientes(clientesResp.data)
  }

  const cargarTareas = async (filtrosActuales = filtros) => {
    const params = Object.fromEntries(
      Object.entries(filtrosActuales).filter(([, value]) => Boolean(value)),
    )
    const { data } = await api.get('/tareas', { params })
    setTareas(data)
  }

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')
      await Promise.all([cargarOpciones(), cargarTareas()])
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar las tareas.')
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

  const abrirCrear = () => {
    setModoModal('crear')
    setTareaEditando(null)
    setFormulario(formularioInicialTarea)
    setErrores({})
    setModalAbierto(true)
  }

  const abrirEditar = async (tarea) => {
    try {
      setError('')
      const { data } = await api.get(`/tareas/${tarea.id_tarea}`)

      setModoModal('editar')
      setTareaEditando(data)
      setFormulario({
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        id_proyecto: data.id_proyecto || '',
        id_usuario_asignado: data.id_usuario_asignado || '',
        estado: data.estado || 'pendiente',
        prioridad: data.prioridad || 'media',
        fecha_inicio: fechaInput(data.fecha_inicio),
        fecha_limite: fechaInput(data.fecha_limite),
      })
      setErrores({})
      setModalAbierto(true)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo obtener la tarea.')
    }
  }

  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setTareaEditando(null)
    setFormulario(formularioInicialTarea)
    setErrores({})
  }

  const actualizarFormulario = (event) => {
    const { name, value } = event.target
    setFormulario((prevState) => ({ ...prevState, [name]: value }))
    setErrores((prevState) => ({ ...prevState, [name]: '' }))
  }

  const actualizarFiltro = (event) => {
    const { name, value } = event.target
    setFiltros((prevState) => ({ ...prevState, [name]: value }))
  }

  const limpiarFiltros = () => {
    setFiltros(filtrosInicialesTareas)
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.titulo.trim()) nuevosErrores.titulo = 'El titulo es obligatorio'
    if (!formulario.id_proyecto) nuevosErrores.id_proyecto = 'El proyecto es obligatorio'
    if (!formulario.id_usuario_asignado) {
      nuevosErrores.id_usuario_asignado = 'El cliente asignado es obligatorio'
    }
    if (
      formulario.fecha_inicio &&
      formulario.fecha_limite &&
      formulario.fecha_limite < formulario.fecha_inicio
    ) {
      nuevosErrores.fecha_limite =
        'La fecha limite debe ser mayor o igual a la fecha inicio'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const payloadTarea = () => ({
    titulo: formulario.titulo,
    descripcion: formulario.descripcion,
    id_proyecto: Number(formulario.id_proyecto),
    id_usuario_asignado: Number(formulario.id_usuario_asignado),
    estado: formulario.estado,
    prioridad: formulario.prioridad,
    fecha_inicio: formulario.fecha_inicio || null,
    fecha_limite: formulario.fecha_limite || null,
  })

  const guardarTarea = async (event) => {
    event.preventDefault()

    if (!validarFormulario()) return

    try {
      setGuardando(true)
      setErrores({})
      setExito('')

      if (modoModal === 'crear') {
        await api.post('/tareas', payloadTarea())
        setExito('Tarea creada correctamente.')
      } else {
        await api.put(`/tareas/${tareaEditando.id_tarea}`, payloadTarea())
        setExito('Tarea actualizada correctamente.')
      }

      cerrarModal()
      await cargarTareas()
    } catch (err) {
      setErrores({
        general:
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          'No se pudo guardar la tarea.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!tareaEliminando) return

    try {
      setEliminando(true)
      setError('')
      setExito('')
      await api.delete(`/tareas/${tareaEliminando.id_tarea}`)
      setTareaEliminando(null)
      setExito('Tarea eliminada correctamente.')
      await cargarTareas()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar la tarea.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Administracion
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">Tareas</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Gestiona actividades, responsables, prioridades y fechas por proyecto.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      {exito && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
          {exito}
        </div>
      )}

      <div className="mb-6">
        <TareasFiltros
          filtros={filtros}
          proyectos={proyectos}
          clientes={clientes}
          onChange={actualizarFiltro}
          onLimpiar={limpiarFiltros}
        />
      </div>

      {cargando ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-400" />
            <p className="mt-4 text-sm font-medium text-slate-300">
              Cargando tareas...
            </p>
          </div>
        </div>
      ) : tareas.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <EmptyState mensaje="Sin tareas registradas" />
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <CheckSquare className="h-4 w-4" />
              Crear primera tarea
            </button>
          </div>
        </div>
      ) : (
        <TareasTable
          tareas={tareas}
          onEditar={abrirEditar}
          onEliminar={setTareaEliminando}
        />
      )}

      <TareaModal
        abierto={modalAbierto}
        modo={modoModal}
        formulario={formulario}
        proyectos={proyectos}
        clientes={clientes}
        errores={errores}
        cargando={guardando}
        onChange={actualizarFormulario}
        onSubmit={guardarTarea}
        onCerrar={cerrarModal}
      />

      <ConfirmDialog
        abierto={Boolean(tareaEliminando)}
        titulo="Eliminar tarea"
        mensaje={`Esta accion eliminara ${tareaEliminando?.titulo || 'esta tarea'} y no se puede deshacer.`}
        textoConfirmar="Eliminar tarea"
        cargando={eliminando}
        onCerrar={() => !eliminando && setTareaEliminando(null)}
        onConfirmar={confirmarEliminar}
      />
    </section>
  )
}

export default TareasPage
