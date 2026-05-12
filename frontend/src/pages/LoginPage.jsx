import { useState } from 'react'
import { LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function obtenerRutaPorRol(nombreRol) {
  if (nombreRol === 'Administrador') return '/admin/dashboard'
  if (nombreRol === 'Cliente') return '/cliente/dashboard'
  return '/login'
}

function LoginPage() {
  const { login, usuario, autenticado } = useAuth()
  const navigate = useNavigate()
  const [formulario, setFormulario] = useState({ correo: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (autenticado && usuario) {
    return <Navigate to={obtenerRutaPorRol(usuario.nombre_rol)} replace />
  }

  const actualizarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((prevState) => ({ ...prevState, [name]: value }))
  }

  const enviarFormulario = async (event) => {
    event.preventDefault()
    setError('')
    setCargando(true)

    try {
      const usuarioAutenticado = await login(formulario)
      navigate(obtenerRutaPorRol(usuarioAutenticado.nombre_rol), { replace: true })
    } catch (err) {
      const mensaje =
        err.response?.data?.mensaje || 'No se pudo iniciar sesion. Verifica tus datos.'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-slate-900 px-10 py-12 lg:flex lg:flex-col lg:justify-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">
              TechSolutions
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">
              Gestion empresarial para proyectos y tareas
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Organiza clientes, proyectos, tareas y reportes desde un entorno claro y centralizado.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">
                TechSolutions
              </p>
              <h1 className="mt-3 text-3xl font-bold">Gestion empresarial para proyectos y tareas</h1>
            </div>

            <div className="rounded-lg border border-slate-800 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30 sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Ingreso
                </p>
                <h2 className="mt-2 text-2xl font-bold">Bienvenido</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ingresa con tu correo y contrasena para continuar.
                </p>
              </div>

              <form className="space-y-5" onSubmit={enviarFormulario}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Correo</span>
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-3 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      name="correo"
                      value={formulario.correo}
                      onChange={actualizarCampo}
                      className="w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="admin@techsolutions.com"
                      autoComplete="email"
                      required
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-3 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                    <LockKeyhole className="h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formulario.password}
                      onChange={actualizarCampo}
                      className="w-full border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Tu contraseña"
                      autoComplete="current-password"
                      required
                    />
                  </span>
                </label>

                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm font-semibold text-sky-700 hover:text-sky-600">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

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
                  {cargando ? 'Iniciando sesion...' : 'Iniciar sesion'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
