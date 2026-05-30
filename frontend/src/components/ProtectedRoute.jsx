// src/components/ProtectedRoute.jsx
// PURPOSE: Wraps pages that require login.
// If no token in localStorage → redirects to /login.
// If role not allowed → shows access denied message.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './index'

export default function ProtectedRoute({ children, roles }) {
  const { user, token, loading } = useAuth()

  if (loading) return <Spinner />

  if (!token || !user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ color: 'var(--red)', fontFamily: 'var(--font-heading)' }}>Access Denied</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>
          You don't have permission to view this page.
          Required role: {roles.join(' or ')}
        </p>
      </div>
    )
  }

  return children
}
