import { Loader2, Save, Shield, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const tema = {
  oscuro: {
    textoTitulo: 'text-white',
    texto: 'text-slate-300',
    fondo: 'border-slate-800 bg-slate-900',
    input: 'border-slate-700 bg-slate-950 text-white focus:border-sky-500 focus:ring-sky-500/10',
    tarjeta: 'border-slate-800 bg-slate-950',
    botonSecundario: 'border-slate-700 text-slate-200 hover:bg-slate-800',
  },
  claro: {
    textoTitulo: 'text-slate-950',
    texto: 'text-slate-600',
    fondo: 'border-slate-200 bg-white',
    input: 'border-slate-200 bg-white text-slate-950 focus:border-sky-500 focus:ring-sky-100',
    tarjeta: 'border-slate-200 bg-slate-50',
    botonSecundario: 'border-slate-200 text-slate-700 hover:bg-slate-50',
  },
}

function PerfilUsuario({ modo = 'oscuro' }) {
  const estilos = tema[modo]
  const { actualizarUsuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [formPerfil, setFormPerfil] = useState({ nombre: '', telefono: '', empresa: '' })
  const [formPassword, setFormPassword] = useState({ passwordActual: '', nuevaPassword: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setError('')
        const { data } = await api.get('/auth/perfil')
        setPerfil(data.usuario)
        setFormPerfil({
          nombre: data.usuario.nombre || '',
          telefono: data.usuario.telefono || '',
          empresa: data.usuario.empresa || '',
        })
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el perfil.')
      } finally {
        setCargando(false)
      }
    }

    cargarPerfil()
  }, [])

  const actualizarCampoPerfil = (campo, valor) => {
    setFormPerfil((actual) => ({ ...actual, [campo]: valor }))
  }

  const actualizarCampoPassword = (campo, valor) => {
    setFormPassword((actual) => ({ ...actual, [campo]: valor }))
  }

  const guardarPerfil = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      setMensaje('')
      setError('')
      const { data } = await api.put('/auth/perfil', formPerfil)
      setPerfil(data.usuario)
      actualizarUsuario(data.usuario)
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar el perfil.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      setMensaje('')
      setError('')
      const { data } = await api.put('/auth/cambiar-password', formPassword)
      setFormPassword({ passwordActual: '', nuevaPassword: '' })
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cambiar la password.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className={`flex min-h-64 items-center justify-center rounded-lg border ${estilos.fondo}`}>
        <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
      </div>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">Cuenta</p>
        <h2 className={`mt-2 text-3xl font-bold ${estilos.textoTitulo}`}>Mi Perfil</h2>
        <p className={`mt-2 text-sm ${estilos.texto}`}>
          Administra tus datos personales y cambia tu password de acceso.
        </p>
      </div>

      {mensaje && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-500">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded-lg border p-5 ${estilos.fondo}`}>
          <div className={`rounded-lg border p-4 ${estilos.tarjeta}`}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-3 text-sky-500">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`font-bold ${estilos.textoTitulo}`}>{perfil?.nombre}</h3>
                <p className={`text-sm ${estilos.texto}`}>{perfil?.correo}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <InfoRow label="Rol" value={perfil?.nombre_rol} estilos={estilos} />
              <InfoRow label="Estado" value={perfil?.estado} estilos={estilos} />
              <InfoRow label="Empresa" value={perfil?.empresa || 'Sin empresa'} estilos={estilos} />
              <InfoRow label="Telefono" value={perfil?.telefono || 'Sin telefono'} estilos={estilos} />
              <InfoRow
                label="Ultimo acceso"
                value={perfil?.ultimo_acceso ? new Date(perfil.ultimo_acceso).toLocaleString('es-GT') : 'Sin registro'}
                estilos={estilos}
              />
            </dl>
          </div>
        </div>

        <div className="grid gap-6">
          <form onSubmit={guardarPerfil} className={`rounded-lg border p-5 ${estilos.fondo}`}>
            <h3 className={`text-lg font-bold ${estilos.textoTitulo}`}>Datos personales</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre" value={formPerfil.nombre} onChange={(valor) => actualizarCampoPerfil('nombre', valor)} estilos={estilos} required />
              <Campo label="Telefono" value={formPerfil.telefono} onChange={(valor) => actualizarCampoPerfil('telefono', valor)} estilos={estilos} />
              <div className="sm:col-span-2">
                <Campo label="Empresa" value={formPerfil.empresa} onChange={(valor) => actualizarCampoPerfil('empresa', valor)} estilos={estilos} />
              </div>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              <Save className="h-4 w-4" />
              Guardar perfil
            </button>
          </form>

          <form onSubmit={cambiarPassword} className={`rounded-lg border p-5 ${estilos.fondo}`}>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-sky-500" />
              <h3 className={`text-lg font-bold ${estilos.textoTitulo}`}>Cambiar password</h3>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Campo
                label="Password actual"
                type="password"
                value={formPassword.passwordActual}
                onChange={(valor) => actualizarCampoPassword('passwordActual', valor)}
                estilos={estilos}
                required
              />
              <Campo
                label="Nueva password"
                type="password"
                value={formPassword.nuevaPassword}
                onChange={(valor) => actualizarCampoPassword('nuevaPassword', valor)}
                estilos={estilos}
                required
              />
            </div>
            <button
              type="submit"
              disabled={guardando}
              className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold ${estilos.botonSecundario}`}
            >
              Actualizar password
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ label, value, estilos }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={estilos.texto}>{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

function Campo({ label, value, onChange, estilos, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className={`text-sm font-semibold ${estilos.texto}`}>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-lg border px-3 py-3 text-sm outline-none ring-4 ring-transparent ${estilos.input}`}
      />
    </label>
  )
}

export default PerfilUsuario
