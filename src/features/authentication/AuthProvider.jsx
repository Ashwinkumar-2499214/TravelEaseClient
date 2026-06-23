import React, { createContext, useContext, useEffect, useState } from 'react'
import authService from './services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('te_auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        setCurrentUser(parsed.user)
      }
    } catch (e) {
      // ignore
    } finally {
      setAuthReady(true)
    }
  }, [])

  const login = async (credentials) => {
    const res = await authService.login(credentials)
    // API returns { message, data: { userId, name, email, role, token } }
    const payload = res.data ?? res
    const user = {
      id: payload.userId ?? payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
    const stored = { token: payload.token, user }
    localStorage.setItem('te_auth', JSON.stringify(stored))
    setCurrentUser(user)
    return stored
  }

  const logout = async () => {
    try { await authService.logout(currentUser?.id) } catch(e){/* ignore */}
    localStorage.removeItem('te_auth')
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export default useAuth
