import { useEffect, useState } from 'react'
import { FolderKanban, Loader2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../../components/dashboard/EmptyState'
import ProyectoModal, {
  formularioInicialProyecto,
} from '../../components/proyectos/ProyectoModal'
import ProyectosTable from '../../components/proyectos/ProyectosTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../services/api'

function fechaInput(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toISOString().slice(0, 10)
}

function ProyectosPage() {
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [clientesDisponibles, setClientesDisponibles] = useState([])
  const [gruposDisponibles, setGruposDisponibles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [proyectoEditando, setProyectoEditando] = useState(null)
  const [proyectoEliminando, setProyectoEliminando] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicialProyecto)
  const [errores, setErrores] = useState({})

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [proyectosResp, clientesResp, gruposResp] = await Promise.all([
        api.get('/proyectos'),
        api.get('/proyectos/opciones/clientes'),
        api.get('/proyectos/opciones/grupos'),
      ])

      setProyectos(proyectosResp.data)
      setClientesDisponibles(clientesResp.data)
      setGruposDisponibles(gruposResp.data)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar los proyectos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirCrear = () => {
    setModoModal('crear')
    setProyectoEditando(null)
    setFormulario(formularioInicialProyecto)
    setErrores({})
    setModalAbierto(true)
  }

  const abrirEditar = async (proyecto) => {
    try {
      setError('')
      const { data } = await api.get(`/proyectos/${proyecto.id_proyecto}`)

      setModoModal('editar')
      setProyectoEditando(data)
      setFormulario({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        estado: data.estado || 'planificacion',
        prioridad: data.prioridad || 'media',
        progreso: Number(data.progreso || 0),
        fecha_inicio: fechaInput(data.fecha_inicio),
        fecha_fin: fechaInput(data.fecha_fin),
        clientes: data.clientes.map((cliente) => cliente.id_usuario),
        grupos: data.grupos_asignados.map((grupo) => grupo.id_grupo),
      })
      setErrores({})
      setModalAbierto(true)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo obtener el proyecto.')
    }
  }

  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setProyectoEditando(null)
    setFormulario(formularioInicialProyecto)
    setErrores({})
  }

  const actualizarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((prevState) => ({ ...prevState, [name]: value }))
    setErrores((prevState) => ({ ...prevState, [name]: '' }))
  }

  const alternarCliente = (idCliente) => {
    setFormulario((prevState) => {
      const existe = prevState.clientes.includes(idCliente)

      return {
        ...prevState,
        clientes: existe
          ? prevState.clientes.filter((id) => id !== idCliente)
          : [...prevState.clientes, idCliente],
      }
    })
  }

  const alternarGrupo = (idGrupo) => {
    setFormulario((prevState) => {
      const existe = prevState.grupos.includes(idGrupo)

      return {
        ...prevState,
        grupos: existe
          ? prevState.grupos.filter((id) => id !== idGrupo)
          : [...prevState.grupos, idGrupo],
      }
    })
  }

  const validarFormulario = () => {
    const nuevosErrores = {}
    const progreso = Number(formulario.progreso)

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio'
    if (Number.isNaN(progreso) || progreso < 0 || progreso > 100) {
      nuevosErrores.progreso = 'El progreso debe estar entre 0 y 100'
    }
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin < formulario.fecha_inicio
    ) {
      nuevosErrores.fecha_fin = 'La fecha fin debe ser mayor o igual a la fecha inicio'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const payloadProyecto = () => ({
    nombre: formulario.nombre,
    descripcion: formulario.descripcion,
    estado: formulario.estado,
    prioridad: formulario.prioridad,
    progreso: Number(formulario.progreso || 0),
    fecha_inicio: formulario.fecha_inicio || null,
    fecha_fin: formulario.fecha_fin || null,
    clientes: formulario.clientes,
    grupos: formulario.grupos,
  })

  const guardarProyecto = async (event) => {
    event.preventDefault()

    if (!validarFormulario()) return

    try {
      setGuardando(true)
      setErrores({})

      if (modoModal === 'crear') {
        await api.post('/proyectos', payloadProyecto())
      } else {
        await api.put(`/proyectos/${proyectoEditando.id_proyecto}`, payloadProyecto())
      }

      cerrarModal()
      await cargarDatos()
    } catch (err) {
      setErrores({
        general: err.response?.data?.mensaje || 'No se pudo guardar el proyecto.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!proyectoEliminando) return

    try {
      setEliminando(true)
      await api.delete(`/proyectos/${proyectoEliminando.id_proyecto}`)
      setProyectoEliminando(null)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar el proyecto.')
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
          <h2 className="mt-2 text-3xl font-bold text-white">Proyectos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Gestiona proyectos, avance, prioridad y clientes asignados.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-400" />
            <p className="mt-4 text-sm font-medium text-slate-300">
              Cargando proyectos...
            </p>
          </div>
        </div>
      ) : proyectos.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <EmptyState mensaje="Sin proyectos registrados" />
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <FolderKanban className="h-4 w-4" />
              Crear primer proyecto
            </button>
          </div>
        </div>
      ) : (
        <ProyectosTable
          proyectos={proyectos}
          onEditar={abrirEditar}
          onEliminar={setProyectoEliminando}
          onVerDetalle={(proyecto) => navigate(`/admin/proyectos/${proyecto.id_proyecto}`)}
        />
      )}

      <ProyectoModal
        abierto={modalAbierto}
        modo={modoModal}
        formulario={formulario}
        clientesDisponibles={clientesDisponibles}
        gruposDisponibles={gruposDisponibles}
        errores={errores}
        cargando={guardando}
        onChange={actualizarCampo}
        onToggleCliente={alternarCliente}
        onToggleGrupo={alternarGrupo}
        onSubmit={guardarProyecto}
        onCerrar={cerrarModal}
      />

      <ConfirmDialog
        abierto={Boolean(proyectoEliminando)}
        titulo="Eliminar proyecto"
        mensaje={`Esta accion eliminara ${proyectoEliminando?.nombre || 'este proyecto'} y sus relaciones asociadas.`}
        textoConfirmar="Eliminar proyecto"
        cargando={eliminando}
        onCerrar={() => !eliminando && setProyectoEliminando(null)}
        onConfirmar={confirmarEliminar}
      />
    </section>
  )
}

export default ProyectosPage
