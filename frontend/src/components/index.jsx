// src/components/index.jsx
// PURPOSE: All small reusable UI components in one file.
// Import from here: import { Badge, Spinner, Modal } from '../components'

import React, { useState } from 'react'

// ── Badge: shows status with color ────────────────────
export function Badge({ value, type = 'status' }) {
  if (!value) return null
  const cls = `badge badge-${value.toLowerCase().replace(' ', '_')}`
  return <span className={cls}>{value.replace('_', ' ')}</span>
}

// ── Spinner: loading indicator ─────────────────────────
export function Spinner() {
  return <div className="loading-center"><div className="spinner" /></div>
}

// ── Alert: success/error/info messages ─────────────────
export function Alert({ type = 'info', message, onClose }) {
  if (!message) return null
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', opacity: 0.7, marginLeft: '1rem' }}>✕</button>
      )}
    </div>
  )
}

// ── Modal: popup dialog ────────────────────────────────
export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── StatCard: dashboard metric box ─────────────────────
export function StatCard({ label, value, color = '#1b3a6b', sub }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-muted mt-1">{sub}</div>}
    </div>
  )
}

// ── Tabs component ─────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.key} className={`tab ${active === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count !== undefined && (
            <span style={{ marginLeft: '0.4rem', background: active === t.key ? '#1b3a6b' : '#e2e8f0', color: active === t.key ? '#fff' : '#64748b', borderRadius: '10px', padding: '0 0.45rem', fontSize: '0.72rem', fontWeight: 700 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────
export function EmptyState({ icon = '📭', message = 'No data found.' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  )
}

// ── InfoGrid: key-value detail display ─────────────────
export function InfoGrid({ items }) {
  return (
    <div className="info-grid">
      {items.map(({ label, value }) => (
        <div className="info-item" key={label}>
          <div className="info-label">{label}</div>
          <div className="info-value">{value || '—'}</div>
        </div>
      ))}
    </div>
  )
}

// ── ConfirmDialog ──────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }>
      <p style={{ color: '#475569' }}>{message}</p>
    </Modal>
  )
}
