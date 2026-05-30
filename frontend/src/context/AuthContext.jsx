// src/context/AuthContext.jsx
// PURPOSE: Store the logged-in user's data globally.
// Every component in the app can read the user's role,
// officer_id, station_id from here without prop drilling.
// When user logs in → token saved here + localStorage.
// When user logs out → everything cleared.

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)   // { user_id, username, role, officer_id, station_id, ... }
  const [token, setToken] = useState(null)   // JWT string
  const [loading, setLoading] = useState(true)

  // On app start — restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('lems_token')
    const savedUser  = localStorage.getItem('lems_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenValue, userData) => {
    setToken(tokenValue)
    setUser(userData)
    localStorage.setItem('lems_token', tokenValue)
    localStorage.setItem('lems_user',  JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('lems_token')
    localStorage.removeItem('lems_user')
  }

  // Helpers
  const isAdmin   = () => user?.role === 'admin'
  const isOfficer = () => user?.role === 'officer'
  const isViewer  = () => user?.role === 'viewer'
  const canEdit   = () => user?.role === 'admin' || user?.role === 'officer'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isOfficer, isViewer, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use in any component: const { user, token } = useAuth()
export const useAuth = () => useContext(AuthContext)
