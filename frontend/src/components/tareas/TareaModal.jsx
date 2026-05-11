import { X } from 'lucide-react'
import { estadosTarea, prioridadesTarea } from './TareasFiltros'

const formularioInicialTarea = {
  titulo: '',
  descripcion: '',
  id_proyecto: '',
  id_usuario_asignado: '',
  estado: 'pendiente',
  prioridad: 'media',
  fecha_inicio: '',
  fecha_limite: '',
}

function TareaModal({
  abierto,
  modo = 'crear',
  formulario,
  proyectos = [],
  clientes = [],
  errores = {},
  cargando = false,
  onChange,
  onSubmit,
  onCerrar,
}) {
  if (!abierto) return null

  const esEditar = modo === 'editar'

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-4 backdrop-blur-sm sm:py-8">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/40">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              Tareas
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {esEditar ? 'Editar tarea' : 'Nueva tarea'}
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

        <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <CampoTexto
              label="Titulo"
              name="titulo"
              value={formulario.titulo}
              error={errores.titulo}
              onChange={onChange}
              required
            />

            <SelectCampo
              label="Proyecto"
              name="id_proyecto"
              value={formulario.id_proyecto}
              error={errores.id_proyecto}
              onChange={onChange}
              required
              disabled={esEditar}
            >
              <option value="">Selecciona un proyecto</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                  {proyecto.nombre}
                </option>
              ))}
            </SelectCampo>

            <SelectCampo
              label="Cliente asignado"
              name="id_usuario_asignado"
              value={formulario.id_usuario_asignado}
              error={errores.id_usuario_asignado}
              onChange={onChange}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id_usuario} value={cliente.id_usuario}>
                  {cliente.nombre} {cliente.empresa ? `- ${cliente.empresa}` : ''}
                </option>
              ))}
            </SelectCampo>

            <SelectCampo
              label="Estado"
              name="estado"
              value={formulario.estado}
              onChange={onChange}
            >
              {estadosTarea.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.texto}
                </option>
              ))}
            </SelectCampo>

            <SelectCampo
              label="Prioridad"
              name="prioridad"
              value={formulario.prioridad}
              onChange={onChange}
            >
              {prioridadesTarea.map((prioridad) => (
                <option key={prioridad.valor} value={prioridad.valor}>
                  {prioridad.texto}
                </option>
              ))}
            </SelectCampo>

            <CampoTexto
              label="Fecha inicio"
              name="fecha_inicio"
              type="date"
              value={formulario.fecha_inicio}
              error={errores.fecha_inicio}
              onChange={onChange}
            />

            <CampoTexto
              label="Fecha limite"
              name="fecha_limite"
              type="date"
              value={formulario.fecha_limite}
              error={errores.fecha_limite}
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
              {cargando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CampoTexto({ label, name, type = 'text', value, error, onChange, required }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

function SelectCampo({ label, name, value, error, onChange, required, disabled, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

export { formularioInicialTarea }
export default TareaModal
