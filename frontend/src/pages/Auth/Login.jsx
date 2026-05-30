// src/pages/Auth/Login.jsx
// PURPOSE: Login form. Sends POST /api/auth/login.
// On success: saves token to AuthContext + localStorage.
// Redirects based on role.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components'

export default function Login() {
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(form.username, form.password)
      const { token, user } = res.data
      login(token, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:       '100vh',
      background:      'var(--navy)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '1rem',
      backgroundImage: 'radial-gradient(ellipse at 60% 40%, #1b3a6b 0%, #0f1f3d 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>LEMS</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
            Law Enforcement Management System
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--navy)', marginBottom: '1.4rem', letterSpacing: '0.03em' }}>
            Sign In
          </h2>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.65rem', fontSize: '1rem', justifyContent: 'center' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Test credentials hint */}
          <div style={{ marginTop: '1.4rem', padding: '0.8rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--gray-600)' }}>TEST CREDENTIALS</div>
            <div>admin / password</div>
            <div>priya / password &nbsp;(Officer)</div>
            <div>viewer1 / password</div>
          </div>
        </div>
      </div>
    </div>
  )
}
