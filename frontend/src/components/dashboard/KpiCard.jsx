function KpiCard({ titulo, valor, icono: Icono, tono = 'sky' }) {
  const tonos = {
    sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/20',
  }

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{titulo}</p>
          <p className="mt-3 text-3xl font-bold text-white">{valor}</p>
        </div>
        <div className={`rounded-lg p-3 ring-1 ${tonos[tono]}`}>
          <Icono className="h-5 w-5" />
        </div>
      </div>
    </article>
  )
}

export default KpiCard
