import { X } from 'lucide-react'

const formularioInicialCrear = {
  nombre: '',
  correo: '',
  password: '',
  telefono: '',
  empresa: '',
}

const formularioInicialEditar = {
  nombre: '',
  telefono: '',
  empresa: '',
  estado: 'activo',
}

function ClienteModal({
  abierto,
  modo = 'crear',
  formulario,
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
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/40">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              Clientes
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {esEditar ? 'Editar cliente' : 'Nuevo cliente'}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              label="Nombre"
              name="nombre"
              value={formulario.nombre}
              error={errores.nombre}
              onChange={onChange}
              required
            />

            {!esEditar && (
              <CampoTexto
                label="Correo"
                name="correo"
                type="email"
                value={formulario.correo}
                error={errores.correo}
                onChange={onChange}
                required
              />
            )}

            {!esEditar && (
              <CampoTexto
                label="Password"
                name="password"
                type="password"
                value={formulario.password}
                error={errores.password}
                onChange={onChange}
                required
              />
            )}

            <CampoTexto
              label="Telefono"
              name="telefono"
              value={formulario.telefono}
              error={errores.telefono}
              onChange={onChange}
              required={!esEditar}
            />

            <CampoTexto
              label="Empresa"
              name="empresa"
              value={formulario.empresa}
              error={errores.empresa}
              onChange={onChange}
              required={!esEditar}
            />

            {esEditar && (
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
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </label>
            )}
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
              {cargando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear cliente'}
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
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

export { formularioInicialCrear, formularioInicialEditar }
export default ClienteModal
