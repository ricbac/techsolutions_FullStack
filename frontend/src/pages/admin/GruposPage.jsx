import { useEffect, useState } from 'react'
import { Edit3, Loader2, Plus, Trash2, UsersRound, X } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../services/api'

const formularioInicial = {
  nombre: '',
  descripcion: '',
  estado: 'activo',
  clientes: [],
}

function GruposPage() {
  const [grupos, setGrupos] = useState([])
  const [clientes, setClientes] = useState([])
  const [formulario, setFormulario] = useState(formularioInicial)
  const [grupoEditando, setGrupoEditando] = useState(null)
  const [grupoEliminando, setGrupoEliminando] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')
      const [gruposResp, clientesResp] = await Promise.all([
        api.get('/grupos'),
        api.get('/grupos/opciones/clientes'),
      ])
      setGrupos(gruposResp.data)
      setClientes(clientesResp.data)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar los grupos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirCrear = () => {
    setGrupoEditando(null)
    setFormulario(formularioInicial)
    setErrores({})
    setModalAbierto(true)
  }

  const abrirEditar = async (grupo) => {
    try {
      setError('')
      const { data } = await api.get(`/grupos/${grupo.id_grupo}`)
      setGrupoEditando(data)
      setFormulario({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        estado: data.estado || 'activo',
        clientes: data.clientes.map((cliente) => cliente.id_usuario),
      })
      setErrores({})
      setModalAbierto(true)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo obtener el grupo.')
    }
  }

  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setGrupoEditando(null)
    setFormulario(formularioInicial)
    setErrores({})
  }

  const actualizarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((prevState) => ({ ...prevState, [name]: value }))
    setErrores((prevState) => ({ ...prevState, [name]: '' }))
  }

  const alternarCliente = (idUsuario) => {
    setFormulario((prevState) => {
      const existe = prevState.clientes.includes(idUsuario)
      return {
        ...prevState,
        clientes: existe
          ? prevState.clientes.filter((id) => id !== idUsuario)
          : [...prevState.clientes, idUsuario],
      }
    })
  }

  const validarFormulario = () => {
    const nuevosErrores = {}
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const guardarGrupo = async (event) => {
    event.preventDefault()
    if (!validarFormulario()) return

    try {
      setGuardando(true)
      setErrores({})

      if (grupoEditando) {
        await api.put(`/grupos/${grupoEditando.id_grupo}`, formulario)
      } else {
        await api.post('/grupos', formulario)
      }

      cerrarModal()
      await cargarDatos()
    } catch (err) {
      setErrores({
        general: err.response?.data?.mensaje || 'No se pudo guardar el grupo.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!grupoEliminando) return

    try {
      setEliminando(true)
      await api.delete(`/grupos/${grupoEliminando.id_grupo}`)
      setGrupoEliminando(null)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar el grupo.')
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
          <h2 className="mt-2 text-3xl font-bold text-white">Grupos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Organiza clientes por equipos para futuras asignaciones a proyectos.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Nuevo grupo
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 px-6 py-12 text-center">
          <UsersRound className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-4 font-semibold text-white">Sin grupos registrados</p>
          <p className="mt-1 text-sm text-slate-500">
            Crea un grupo para organizar clientes por equipo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {grupos.map((grupo) => (
            <article key={grupo.id_grupo} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{grupo.nombre}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {grupo.descripcion || 'Sin descripcion'}
                  </p>
                </div>
                <EstadoBadge estado={grupo.estado} />
              </div>

              <div className="mt-5 rounded-lg bg-slate-950 p-4">
                <p className="text-sm text-slate-500">Integrantes</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {grupo.total_integrantes}
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEditar(grupo)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  <Edit3 className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setGrupoEliminando(grupo)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <GrupoModal
        abierto={modalAbierto}
        editando={Boolean(grupoEditando)}
        formulario={formulario}
        clientes={clientes}
        errores={errores}
        guardando={guardando}
        onChange={actualizarCampo}
        onToggleCliente={alternarCliente}
        onSubmit={guardarGrupo}
        onCerrar={cerrarModal}
      />

      <ConfirmDialog
        abierto={Boolean(grupoEliminando)}
        titulo="Eliminar grupo"
        mensaje={`Esta accion eliminara ${grupoEliminando?.nombre || 'este grupo'} y sus asignaciones.`}
        textoConfirmar="Eliminar grupo"
        cargando={eliminando}
        onCerrar={() => !eliminando && setGrupoEliminando(null)}
        onConfirmar={confirmarEliminar}
      />
    </section>
  )
}

function GrupoModal({
  abierto,
  editando,
  formulario,
  clientes,
  errores,
  guardando,
  onChange,
  onToggleCliente,
  onSubmit,
  onCerrar,
}) {
  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              Grupos
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {editando ? 'Editar grupo' : 'Nuevo grupo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              label="Nombre"
              name="nombre"
              value={formulario.nombre}
              error={errores.nombre}
              onChange={onChange}
              required
            />

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Estado</span>
              <select
                name="estado"
                value={formulario.estado}
                onChange={onChange}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-200">Descripcion</span>
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={onChange}
              rows="3"
              className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </label>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Clientes</span>
              <span className="text-xs text-slate-500">
                {formulario.clientes.length} seleccionados
              </span>
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
              {clientes.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">
                  No hay clientes activos disponibles.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {clientes.map((cliente) => (
                    <label
                      key={cliente.id_usuario}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 p-3 hover:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={formulario.clientes.includes(cliente.id_usuario)}
                        onChange={() => onToggleCliente(cliente.id_usuario)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">
                          {cliente.nombre}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {cliente.empresa || cliente.correo}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errores.general && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
              {errores.general}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CampoTexto({ label, name, value, error, onChange, required }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

function EstadoBadge({ estado }) {
  const activo = estado === 'activo'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
      activo
        ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20'
        : 'bg-slate-500/10 text-slate-300 ring-slate-500/20'
    }`}>
      {estado}
    </span>
  )
}

export default GruposPage
