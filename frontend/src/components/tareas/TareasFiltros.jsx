import { Filter, RotateCcw } from 'lucide-react'

const estadosTarea = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'en_progreso', texto: 'En progreso' },
  { valor: 'completada', texto: 'Completada' },
  { valor: 'cancelada', texto: 'Cancelada' },
]

const prioridadesTarea = [
  { valor: 'baja', texto: 'Baja' },
  { valor: 'media', texto: 'Media' },
  { valor: 'alta', texto: 'Alta' },
  { valor: 'urgente', texto: 'Urgente' },
]

const filtrosInicialesTareas = {
  proyecto: '',
  cliente: '',
  estado: '',
  prioridad: '',
}

function TareasFiltros({
  filtros,
  proyectos = [],
  clientes = [],
  onChange,
  onLimpiar,
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Filtros</h3>
        </div>
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectFiltro
          label="Proyecto"
          name="proyecto"
          value={filtros.proyecto}
          onChange={onChange}
        >
          <option value="">Todos</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
              {proyecto.nombre}
            </option>
          ))}
        </SelectFiltro>

        <SelectFiltro
          label="Cliente"
          name="cliente"
          value={filtros.cliente}
          onChange={onChange}
        >
          <option value="">Todos</option>
          {clientes.map((cliente) => (
            <option key={cliente.id_usuario} value={cliente.id_usuario}>
              {cliente.nombre}
            </option>
          ))}
        </SelectFiltro>

        <SelectFiltro
          label="Estado"
          name="estado"
          value={filtros.estado}
          onChange={onChange}
        >
          <option value="">Todos</option>
          {estadosTarea.map((estado) => (
            <option key={estado.valor} value={estado.valor}>
              {estado.texto}
            </option>
          ))}
        </SelectFiltro>

        <SelectFiltro
          label="Prioridad"
          name="prioridad"
          value={filtros.prioridad}
          onChange={onChange}
        >
          <option value="">Todas</option>
          {prioridadesTarea.map((prioridad) => (
            <option key={prioridad.valor} value={prioridad.valor}>
              {prioridad.texto}
            </option>
          ))}
        </SelectFiltro>
      </div>
    </div>
  )
}

function SelectFiltro({ label, name, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      >
        {children}
      </select>
    </label>
  )
}

export { estadosTarea, filtrosInicialesTareas, prioridadesTarea }
export default TareasFiltros
