// src/components/Layout.jsx
// PURPOSE: The main layout wrapper — sidebar + top bar + page content.
// Every page except Login is wrapped in this Layout.
// Sidebar shows different menu items based on user role.

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/',            label: 'Dashboard',  icon: '🏠', roles: ['admin','officer','viewer'] },
  { path: '/fir',         label: 'FIRs',       icon: '📄', roles: ['admin','officer','viewer'] },
  { path: '/cases',       label: 'Cases',      icon: '🗂️',  roles: ['admin','officer','viewer'] },
  { path: '/officers',    label: 'Officers',   icon: '👮', roles: ['admin','officer','viewer'] },
  { path: '/suspects',    label: 'Suspects',   icon: '🔍', roles: ['admin','officer','viewer'] },
  { path: '/evidence',    label: 'Evidence',   icon: '🔬', roles: ['admin','officer','viewer'] },
  { path: '/charges',     label: 'Charges',    icon: '⚖️',  roles: ['admin','officer','viewer'] },
  { path: '/reports',     label: 'Reports',    icon: '📊', roles: ['admin','officer'] },
]

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-100)' }}>

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside style={{
        width:        collapsed ? '60px' : 'var(--sidebar-w)',
        background:   'var(--navy)',
        display:      'flex',
        flexDirection:'column',
        flexShrink:   0,
        transition:   'width 0.2s ease',
        overflow:     'hidden',
        position:     'sticky',
        top:          0,
        height:       '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.2rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.6rem', minHeight: 'var(--header-h)' }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🛡️</span>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>LEMS</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Law Enforcement</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0.8rem 0', overflowY: 'auto' }}>
          {visibleItems.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link key={item.path} to={item.path} style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '0.75rem',
                padding:    collapsed ? '0.75rem' : '0.65rem 1.2rem',
                color:      active ? '#fff' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: active ? '3px solid var(--amber)' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                fontSize:   '0.88rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed && (
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                {user?.officer_name || user?.username}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user?.role}
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width:      '100%',
            padding:    '0.5rem',
            background: 'rgba(255,255,255,0.08)',
            border:     '1px solid rgba(255,255,255,0.15)',
            borderRadius:'var(--radius)',
            color:      'rgba(255,255,255,0.7)',
            cursor:     'pointer',
            fontFamily: 'var(--font-heading)',
            fontSize:   '0.82rem',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap:        '0.4rem',
          }}>
            🚪 {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height:       'var(--header-h)',
          background:   'var(--white)',
          borderBottom: '1px solid var(--gray-200)',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 1.5rem',
          gap:          '1rem',
          boxShadow:    'var(--shadow)',
          position:     'sticky',
          top:          0,
          zIndex:       100,
        }}>
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--gray-500)' }}>
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', color: 'var(--gray-500)', letterSpacing: '0.04em' }}>
            {user?.station_name && `📍 ${user.station_name}`}
          </div>
          <div style={{
            background:  'var(--navy)',
            color:       '#fff',
            borderRadius:'20px',
            padding:     '0.25rem 0.8rem',
            fontSize:    '0.78rem',
            fontFamily:  'var(--font-heading)',
            fontWeight:  600,
            letterSpacing:'0.06em',
            textTransform:'uppercase',
          }}>
            {user?.role}
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
