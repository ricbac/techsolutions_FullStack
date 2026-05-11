import { Inbox } from 'lucide-react'

function EmptyState({ mensaje = 'Sin datos disponibles' }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center">
      <div className="rounded-lg bg-slate-800 p-3 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-200">{mensaje}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Cuando existan registros, esta seccion mostrara informacion actualizada.
      </p>
    </div>
  )
}

export default EmptyState
