import { Edit3, Trash2 } from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  return texto ? texto.replaceAll('_', ' ') : 'Sin dato'
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
    en_progreso: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    completada: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    cancelada: 'bg-red-500/10 text-red-300 ring-red-500/20',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${estilos[estado] || estilos.pendiente}`}>
      {formatearTexto(estado)}
    </span>
  )
}

function PrioridadBadge({ prioridad }) {
  const estilos = {
    baja: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
    media: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    alta: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    urgente: 'bg-red-500/10 text-red-300 ring-red-500/20',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${estilos[prioridad] || estilos.media}`}>
      {prioridad}
    </span>
  )
}

function TareasTable({ tareas, onEditar, onEliminar }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/60">
            <tr>
              {[
                'Titulo',
                'Proyecto',
                'Cliente asignado',
                'Estado',
                'Prioridad',
                'Fecha inicio',
                'Fecha limite',
                'Fecha completada',
                'Acciones',
              ].map((columna) => (
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
            {tareas.map((tarea) => (
              <tr key={tarea.id_tarea} className="hover:bg-slate-800/40">
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-white">{tarea.titulo}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                    {tarea.descripcion || 'Sin descripcion'}
                  </p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{tarea.proyecto}</td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  {tarea.cliente_asignado || 'Sin asignar'}
                </td>
                <td className="px-4 py-4"><EstadoBadge estado={tarea.estado} /></td>
                <td className="px-4 py-4"><PrioridadBadge prioridad={tarea.prioridad} /></td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatearFecha(tarea.fecha_inicio)}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatearFecha(tarea.fecha_limite)}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatearFecha(tarea.fecha_completada)}</td>
                <td className="px-4 py-4">
                  <Acciones tarea={tarea} onEditar={onEditar} onEliminar={onEliminar} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-800 xl:hidden">
        {tareas.map((tarea) => (
          <article key={tarea.id_tarea} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{tarea.titulo}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {tarea.descripcion || tarea.proyecto}
                </p>
              </div>
              <EstadoBadge estado={tarea.estado} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <Dato label="Proyecto" value={tarea.proyecto} />
              <Dato label="Cliente" value={tarea.cliente_asignado || 'Sin asignar'} />
              <Dato label="Prioridad" value={<PrioridadBadge prioridad={tarea.prioridad} />} />
              <Dato label="Inicio" value={formatearFecha(tarea.fecha_inicio)} />
              <Dato label="Limite" value={formatearFecha(tarea.fecha_limite)} />
              <Dato label="Completada" value={formatearFecha(tarea.fecha_completada)} />
            </dl>

            <div className="mt-4">
              <Acciones tarea={tarea} onEditar={onEditar} onEliminar={onEliminar} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Acciones({ tarea, onEditar, onEliminar }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEditar(tarea)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 xl:flex-none xl:p-2"
        aria-label="Editar tarea"
      >
        <Edit3 className="h-4 w-4" />
        <span className="xl:hidden">Editar</span>
      </button>
      <button
        type="button"
        onClick={() => onEliminar(tarea)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 xl:flex-none xl:p-2"
        aria-label="Eliminar tarea"
      >
        <Trash2 className="h-4 w-4" />
        <span className="xl:hidden">Eliminar</span>
      </button>
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

export { EstadoBadge, PrioridadBadge }
export default TareasTable
