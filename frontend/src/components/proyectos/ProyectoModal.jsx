import { X } from 'lucide-react'

const estadosProyecto = [
  { valor: 'planificacion', texto: 'Planificacion' },
  { valor: 'en_progreso', texto: 'En progreso' },
  { valor: 'en_revision', texto: 'En revision' },
  { valor: 'completado', texto: 'Completado' },
  { valor: 'cancelado', texto: 'Cancelado' },
]

const prioridadesProyecto = [
  { valor: 'baja', texto: 'Baja' },
  { valor: 'media', texto: 'Media' },
  { valor: 'alta', texto: 'Alta' },
  { valor: 'urgente', texto: 'Urgente' },
]

const formularioInicialProyecto = {
  nombre: '',
  descripcion: '',
  estado: 'planificacion',
  prioridad: 'media',
  progreso: 0,
  fecha_inicio: '',
  fecha_fin: '',
  clientes: [],
  grupos: [],
}

function ProyectoModal({
  abierto,
  modo = 'crear',
  formulario,
  clientesDisponibles = [],
  gruposDisponibles = [],
  errores = {},
  cargando = false,
  onChange,
  onToggleCliente,
  onToggleGrupo,
  onSubmit,
  onCerrar,
}) {
  if (!abierto) return null

  const esEditar = modo === 'editar'

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-4 backdrop-blur-sm sm:py-8">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/40">
        <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              Proyectos
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {esEditar ? 'Editar proyecto' : 'Nuevo proyecto'}
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
        </div>

        <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-2">
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
                {estadosProyecto.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.texto}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Prioridad</span>
              <select
                name="prioridad"
                value={formulario.prioridad}
                onChange={onChange}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              >
                {prioridadesProyecto.map((prioridad) => (
                  <option key={prioridad.valor} value={prioridad.valor}>
                    {prioridad.texto}
                  </option>
                ))}
              </select>
            </label>

            <CampoTexto
              label="Progreso"
              name="progreso"
              type="number"
              min="0"
              max="100"
              step="1"
              value={formulario.progreso}
              error={errores.progreso}
              onChange={onChange}
              required
            />

            <CampoTexto
              label="Fecha inicio"
              name="fecha_inicio"
              type="date"
              value={formulario.fecha_inicio}
              error={errores.fecha_inicio}
              onChange={onChange}
            />

            <CampoTexto
              label="Fecha fin"
              name="fecha_fin"
              type="date"
              value={formulario.fecha_fin}
              error={errores.fecha_fin}
              onChange={onChange}
            />
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-200">Descripcion</span>
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={onChange}
              rows="4"
              className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </label>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-200">
                Clientes asignados
              </span>
              <span className="text-xs text-slate-500">
                {formulario.clientes.length} seleccionados
              </span>
            </div>

            <div className="scrollbar-sutil mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
              {clientesDisponibles.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">
                  No hay clientes activos disponibles.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {clientesDisponibles.map((cliente) => (
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

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-200">
                Grupos asignados
              </span>
              <span className="text-xs text-slate-500">
                {formulario.grupos.length} seleccionados
              </span>
            </div>

            <div className="scrollbar-sutil mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
              {gruposDisponibles.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">
                  No hay grupos activos disponibles.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {gruposDisponibles.map((grupo) => (
                    <label
                      key={grupo.id_grupo}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 p-3 hover:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={formulario.grupos.includes(grupo.id_grupo)}
                        onChange={() => onToggleGrupo(grupo.id_grupo)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">
                          {grupo.nombre}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {grupo.integrantes_count} integrantes
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

          <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-900 px-5 pt-5 pb-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {cargando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CampoTexto({
  label,
  name,
  type = 'text',
  value,
  error,
  onChange,
  required,
  ...props
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        {...props}
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

export { estadosProyecto, formularioInicialProyecto, prioridadesProyecto }
export default ProyectoModal
