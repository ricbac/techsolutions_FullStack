import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null
  })
  const [cargandoSesion, setCargandoSesion] = useState(Boolean(token))

  const guardarSesion = (nuevoToken, nuevoUsuario) => {
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
    setToken(nuevoToken)
    setUsuario(nuevoUsuario)
  }

  const limpiarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
  }

  const login = async ({ correo, password }) => {
    const { data } = await api.post('/auth/login', { correo, password })
    guardarSesion(data.token, data.usuario)
    return data.usuario
  }

  const logout = () => {
    limpiarSesion()
  }

  const actualizarUsuario = (nuevoUsuario) => {
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
    setUsuario(nuevoUsuario)
  }

  useEffect(() => {
    const verificarSesion = async () => {
      if (!token) {
        setCargandoSesion(false)
        return
      }

      try {
        const { data } = await api.get('/auth/perfil')
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        setUsuario(data.usuario)
      } catch (error) {
        limpiarSesion()
      } finally {
        setCargandoSesion(false)
      }
    }

    verificarSesion()
  }, [token])

  const value = useMemo(
    () => ({
      token,
      usuario,
      cargandoSesion,
      login,
      logout,
      actualizarUsuario,
      autenticado: Boolean(token && usuario),
    }),
    [token, usuario, cargandoSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
