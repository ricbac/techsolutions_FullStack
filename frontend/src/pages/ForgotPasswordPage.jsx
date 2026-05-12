import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import api from '../services/api'

function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (event) => {
    event.preventDefault()
    setMensaje('')
    setError('')
    setCargando(true)

    try {
      const { data } = await api.post('/auth/recuperar-password', { correo })
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo procesar la solicitud.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">TechSolutions</p>
        <h1 className="mt-3 text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ingresa tu correo y te enviaremos instrucciones para restablecer el acceso.
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Correo</span>
            <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-3 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
              <Mail className="h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                className="w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="usuario@correo.com"
                required
              />
            </span>
          </label>

          {mensaje && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {cargando ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
        </form>

        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-sky-700 hover:text-sky-600">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
