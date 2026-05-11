import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldAlert, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'

const iconos = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: ShieldAlert,
}

const estilos = {
  oscuro: {
    contenedor: 'border-slate-800 bg-slate-900 text-slate-100',
    item: 'border-slate-800 bg-slate-950',
    itemNoLeido: 'border-sky-500/40 bg-sky-500/10',
    texto: 'text-slate-300',
    muted: 'text-slate-500',
    boton: 'border-slate-700 text-slate-200 hover:bg-slate-800',
  },
  claro: {
    contenedor: 'border-slate-200 bg-white text-slate-950',
    item: 'border-slate-200 bg-white',
    itemNoLeido: 'border-sky-200 bg-sky-50',
    texto: 'text-slate-600',
    muted: 'text-slate-400',
    boton: 'border-slate-200 text-slate-700 hover:bg-slate-50',
  },
}

function tiempoRelativo(fecha) {
  const diferencia = Date.now() - new Date(fecha).getTime()
  const minutos = Math.floor(diferencia / 60000)
  if (minutos < 1) return 'Hace unos segundos'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `Hace ${dias} d`
}

function NotificacionesPanel({ modo = 'oscuro' }) {
  const tema = estilos[modo]
  const [notificaciones, setNotificaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarNotificaciones = useCallback(async () => {
    try {
      setError('')
      const { data } = await api.get('/notificaciones')
      setNotificaciones(data)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar las notificaciones.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarNotificaciones()
    const intervalo = setInterval(cargarNotificaciones, 30000)
    return () => clearInterval(intervalo)
  }, [cargarNotificaciones])

  const marcarLeida = async (id) => {
    await api.put(`/notificaciones/${id}/leer`)
    await cargarNotificaciones()
    window.dispatchEvent(new Event('notificaciones:actualizar'))
  }

  const marcarTodas = async () => {
    await api.put('/notificaciones/leer-todas')
    await cargarNotificaciones()
    window.dispatchEvent(new Event('notificaciones:actualizar'))
  }

  const eliminar = async (id) => {
    await api.delete(`/notificaciones/${id}`)
    await cargarNotificaciones()
    window.dispatchEvent(new Event('notificaciones:actualizar'))
  }

  const noLeidas = notificaciones.filter((item) => !item.leida).length

  if (cargando) {
    return (
      <div className={`flex min-h-64 items-center justify-center rounded-lg border ${tema.contenedor}`}>
        <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
      </div>
    )
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={`text-3xl font-bold ${modo === 'oscuro' ? 'text-white' : 'text-slate-950'}`}>
            Notificaciones
          </h2>
          <p className={`mt-2 text-sm ${tema.texto}`}>
            {noLeidas} notificaciones sin leer
          </p>
        </div>
        <button
          type="button"
          onClick={marcarTodas}
          disabled={noLeidas === 0}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${tema.boton}`}
        >
          Marcar todas como leidas
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {error}
        </div>
      )}

      <div className={`rounded-lg border p-3 ${tema.contenedor}`}>
        {notificaciones.length === 0 && (
          <div className={`rounded-lg border border-dashed p-8 text-center text-sm ${tema.item} ${tema.muted}`}>
            Sin notificaciones disponibles
          </div>
        )}

        <div className="space-y-3">
          {notificaciones.map((notificacion) => {
            const Icono = iconos[notificacion.tipo] || Info
            return (
              <article
                key={notificacion.id_notificacion}
                className={`rounded-lg border p-4 ${
                  notificacion.leida ? tema.item : tema.itemNoLeido
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 rounded-lg bg-sky-500/10 p-2 text-sky-500">
                    <Icono className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="font-bold">{notificacion.titulo}</h3>
                      <span className={`text-xs ${tema.muted}`}>
                        {tiempoRelativo(notificacion.fecha_creacion)}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm leading-6 ${tema.texto}`}>{notificacion.mensaje}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!notificacion.leida && (
                        <button
                          type="button"
                          onClick={() => marcarLeida(notificacion.id_notificacion)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${tema.boton}`}
                        >
                          Marcar leida
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminar(notificacion.id_notificacion)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${tema.boton}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default NotificacionesPanel
