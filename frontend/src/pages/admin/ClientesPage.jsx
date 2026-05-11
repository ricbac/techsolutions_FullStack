import { useEffect, useState } from 'react'
import { Loader2, Plus, Users } from 'lucide-react'
import ClienteModal, {
  formularioInicialCrear,
  formularioInicialEditar,
} from '../../components/clientes/ClienteModal'
import ClientesTable from '../../components/clientes/ClientesTable'
import EmptyState from '../../components/dashboard/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../services/api'

function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteEliminando, setClienteEliminando] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicialCrear)
  const [errores, setErrores] = useState({})

  const cargarClientes = async () => {
    try {
      setCargando(true)
      setError('')
      const { data } = await api.get('/clientes')
      setClientes(data)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar los clientes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const abrirCrear = () => {
    setModoModal('crear')
    setClienteEditando(null)
    setFormulario(formularioInicialCrear)
    setErrores({})
    setModalAbierto(true)
  }

  const abrirEditar = async (cliente) => {
    try {
      setError('')
      const { data } = await api.get(`/clientes/${cliente.id_usuario}`)
      setModoModal('editar')
      setClienteEditando(data)
      setFormulario({
        nombre: data.nombre || '',
        telefono: data.telefono || '',
        empresa: data.empresa || '',
        estado: data.estado || 'activo',
      })
      setErrores({})
      setModalAbierto(true)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo obtener el cliente.')
    }
  }

  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setClienteEditando(null)
    setFormulario(formularioInicialCrear)
    setErrores({})
  }

  const actualizarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((prevState) => ({ ...prevState, [name]: value }))
    setErrores((prevState) => ({ ...prevState, [name]: '' }))
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio'

    if (modoModal === 'crear') {
      if (!formulario.correo.trim()) nuevosErrores.correo = 'El correo es obligatorio'
      if (!formulario.password.trim()) nuevosErrores.password = 'El password es obligatorio'
      if (!formulario.telefono.trim()) nuevosErrores.telefono = 'El telefono es obligatorio'
      if (!formulario.empresa.trim()) nuevosErrores.empresa = 'La empresa es obligatoria'
    }

    if (modoModal === 'editar' && !formulario.estado) {
      nuevosErrores.estado = 'El estado es obligatorio'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const guardarCliente = async (event) => {
    event.preventDefault()

    if (!validarFormulario()) return

    try {
      setGuardando(true)
      setErrores({})

      if (modoModal === 'crear') {
        await api.post('/clientes', formulario)
      } else {
        await api.put(`/clientes/${clienteEditando.id_usuario}`, {
          nombre: formulario.nombre,
          telefono: formulario.telefono,
          empresa: formulario.empresa,
          estado: formulario.estado,
        })
      }

      cerrarModal()
      await cargarClientes()
    } catch (err) {
      setErrores({
        general: err.response?.data?.mensaje || 'No se pudo guardar el cliente.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!clienteEliminando) return

    try {
      setEliminando(true)
      await api.delete(`/clientes/${clienteEliminando.id_usuario}`)
      setClienteEliminando(null)
      await cargarClientes()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar el cliente.')
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
          <h2 className="mt-2 text-3xl font-bold text-white">Clientes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Gestiona los usuarios con rol Cliente y sus datos de contacto.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
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
              Cargando clientes...
            </p>
          </div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <EmptyState mensaje="Sin clientes registrados" />
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <Users className="h-4 w-4" />
              Crear primer cliente
            </button>
          </div>
        </div>
      ) : (
        <ClientesTable
          clientes={clientes}
          onEditar={abrirEditar}
          onEliminar={setClienteEliminando}
        />
      )}

      <ClienteModal
        abierto={modalAbierto}
        modo={modoModal}
        formulario={formulario}
        errores={errores}
        cargando={guardando}
        onChange={actualizarCampo}
        onSubmit={guardarCliente}
        onCerrar={cerrarModal}
      />

      <ConfirmDialog
        abierto={Boolean(clienteEliminando)}
        titulo="Eliminar cliente"
        mensaje={`Esta accion eliminara a ${clienteEliminando?.nombre || 'este cliente'} y no se puede deshacer.`}
        textoConfirmar="Eliminar cliente"
        cargando={eliminando}
        onCerrar={() => !eliminando && setClienteEliminando(null)}
        onConfirmar={confirmarEliminar}
      />
    </section>
  )
}

export default ClientesPage
