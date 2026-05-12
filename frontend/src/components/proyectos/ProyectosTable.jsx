import { Edit3, Eye, Trash2 } from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  return texto ? texto.replaceAll('_', ' ') : 'Sin dato'
}

function EstadoBadge({ estado }) {
  const estilos = {
    planificacion: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    en_progreso: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    en_revision: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
    completado: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    cancelado: 'bg-red-500/10 text-red-300 ring-red-500/20',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${estilos[estado] || estilos.planificacion}`}>
      {formatearTexto(estado)}
    </span>
  )
}

function PrioridadBadge({ prioridad }) {
  const estilos = {
    baja: 'text-slate-300',
    media: 'text-sky-300',
    alta: 'text-amber-300',
    urgente: 'text-red-300',
  }

  return (
    <span className={`text-sm font-semibold capitalize ${estilos[prioridad] || estilos.media}`}>
      {prioridad}
    </span>
  )
}

function Progreso({ valor }) {
  const progreso = Number(valor || 0)

  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Avance</span>
        <span className="font-semibold text-slate-200">{progreso}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-sky-400"
          style={{ width: `${Math.min(progreso, 100)}%` }}
        />
      </div>
    </div>
  )
}

function ProyectosTable({ proyectos, onEditar, onEliminar, onVerDetalle }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/60">
            <tr>
              {[
                'Nombre',
                'Estado',
                'Prioridad',
                'Progreso',
                'Clientes relacionados',
                'Individuales',
                'Grupos',
                'Tareas',
                'Completadas',
                'Fechas',
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
            {proyectos.map((proyecto) => (
              <tr key={proyecto.id_proyecto} className="hover:bg-slate-800/40">
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-white">{proyecto.nombre}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                    {proyecto.descripcion || 'Sin descripcion'}
                  </p>
                </td>
                <td className="px-4 py-4"><EstadoBadge estado={proyecto.estado} /></td>
                <td className="px-4 py-4"><PrioridadBadge prioridad={proyecto.prioridad} /></td>
                <td className="px-4 py-4"><Progreso valor={proyecto.progreso} /></td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  {proyecto.clientes_relacionados_count ?? proyecto.clientes_asignados}
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  {proyecto.clientes_individuales_count ?? proyecto.clientes_asignados}
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  {proyecto.grupos_count ?? proyecto.grupos_asignados}
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{proyecto.total_tareas}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{proyecto.tareas_completadas}</td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  <span className="block">{formatearFecha(proyecto.fecha_inicio)}</span>
                  <span className="block text-xs text-slate-500">{formatearFecha(proyecto.fecha_fin)}</span>
                </td>
                <td className="px-4 py-4">
                  <Acciones proyecto={proyecto} onEditar={onEditar} onEliminar={onEliminar} onVerDetalle={onVerDetalle} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-800 xl:hidden">
        {proyectos.map((proyecto) => (
          <article key={proyecto.id_proyecto} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{proyecto.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {proyecto.descripcion || 'Sin descripcion'}
                </p>
              </div>
              <EstadoBadge estado={proyecto.estado} />
            </div>

            <div className="mt-4">
              <Progreso valor={proyecto.progreso} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <Dato label="Prioridad" value={<PrioridadBadge prioridad={proyecto.prioridad} />} />
              <Dato
                label="Clientes relacionados"
                value={proyecto.clientes_relacionados_count ?? proyecto.clientes_asignados}
              />
              <Dato
                label="Clientes individuales"
                value={proyecto.clientes_individuales_count ?? proyecto.clientes_asignados}
              />
              <Dato label="Grupos" value={proyecto.grupos_count ?? proyecto.grupos_asignados} />
              <Dato label="Tareas" value={proyecto.total_tareas} />
              <Dato label="Completadas" value={proyecto.tareas_completadas} />
              <Dato
                label="Fechas"
                value={`${formatearFecha(proyecto.fecha_inicio)} - ${formatearFecha(proyecto.fecha_fin)}`}
              />
            </dl>

            <div className="mt-4">
              <Acciones proyecto={proyecto} onEditar={onEditar} onEliminar={onEliminar} onVerDetalle={onVerDetalle} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Acciones({ proyecto, onEditar, onEliminar, onVerDetalle }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onVerDetalle(proyecto)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sky-500/30 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/10 xl:flex-none xl:p-2"
        aria-label="Ver detalle"
      >
        <Eye className="h-4 w-4" />
        <span className="xl:hidden">Detalle</span>
      </button>
      <button
        type="button"
        onClick={() => onEditar(proyecto)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 xl:flex-none xl:p-2"
        aria-label="Editar proyecto"
      >
        <Edit3 className="h-4 w-4" />
        <span className="xl:hidden">Editar</span>
      </button>
      <button
        type="button"
        onClick={() => onEliminar(proyecto)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 xl:flex-none xl:p-2"
        aria-label="Eliminar proyecto"
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

export default ProyectosTable
