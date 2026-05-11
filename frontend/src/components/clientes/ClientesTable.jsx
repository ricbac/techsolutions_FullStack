import { Edit3, Trash2 } from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin registro'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function EstadoBadge({ estado }) {
  const estilos = {
    activo: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    inactivo: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
    bloqueado: 'bg-red-500/10 text-red-300 ring-red-500/20',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${estilos[estado] || estilos.inactivo}`}>
      {estado}
    </span>
  )
}

function ClientesTable({ clientes, onEditar, onEliminar }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/60">
            <tr>
              {['Nombre', 'Correo', 'Telefono', 'Empresa', 'Estado', 'Ultimo acceso', 'Acciones'].map((columna) => (
                <th
                  key={columna}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clientes.map((cliente) => (
              <tr key={cliente.id_usuario} className="hover:bg-slate-800/40">
                <td className="px-4 py-4 text-sm font-semibold text-white">{cliente.nombre}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{cliente.correo}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{cliente.telefono || 'Sin telefono'}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{cliente.empresa || 'Sin empresa'}</td>
                <td className="px-4 py-4"><EstadoBadge estado={cliente.estado} /></td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatearFecha(cliente.ultimo_acceso)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(cliente)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                      aria-label="Editar cliente"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(cliente)}
                      className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                      aria-label="Eliminar cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-800 lg:hidden">
        {clientes.map((cliente) => (
          <article key={cliente.id_usuario} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{cliente.nombre}</h3>
                <p className="mt-1 text-sm text-slate-400">{cliente.correo}</p>
              </div>
              <EstadoBadge estado={cliente.estado} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <Dato label="Telefono" value={cliente.telefono || 'Sin telefono'} />
              <Dato label="Empresa" value={cliente.empresa || 'Sin empresa'} />
              <Dato label="Ultimo acceso" value={formatearFecha(cliente.ultimo_acceso)} />
            </dl>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onEditar(cliente)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => onEliminar(cliente)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Dato({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-300">{value}</dd>
    </div>
  )
}

export default ClientesTable
