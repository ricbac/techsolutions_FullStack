import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import api from '../services/api'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [formulario, setFormulario] = useState({ nuevaPassword: '', confirmarPassword: '' })
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const actualizarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!token) {
      setError('El enlace de recuperación no es válido.')
      return
    }

    if (formulario.nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (formulario.nuevaPassword !== formulario.confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setCargando(true)
      const { data } = await api.post('/auth/reset-password', {
        token,
        nuevaPassword: formulario.nuevaPassword,
      })
      setMensaje(data.mensaje)
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo restablecer la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">TechSolutions</p>
        <h1 className="mt-3 text-2xl font-bold">Crear nueva contraseña</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Define una contraseña nueva para recuperar el acceso a tu cuenta.
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-5">
          <PasswordField
            label="Nueva contraseña"
            name="nuevaPassword"
            value={formulario.nuevaPassword}
            onChange={actualizarCampo}
          />
          <PasswordField
            label="Confirmar contraseña"
            name="confirmarPassword"
            value={formulario.confirmarPassword}
            onChange={actualizarCampo}
          />

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
            {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-sky-700 hover:text-sky-600">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  )
}

function PasswordField({ label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-3 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
        <LockKeyhole className="h-5 w-5 text-slate-400" />
        <input
          type="password"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="Mínimo 8 caracteres"
          required
        />
      </span>
    </label>
  )
}

export default ResetPasswordPage
