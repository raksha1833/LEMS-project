// src/pages/Cases/CaseList.jsx
// PURPOSE: Shows all active cases using vw_active_cases_per_station view.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { caseAPI } from '../../services/api'
import { Badge, Spinner, EmptyState } from '../../components'

export default function CaseList() {
  const [cases,   setCases]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '' })

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.status)   params.status   = filters.status
    if (filters.priority) params.priority = filters.priority
    caseAPI.getAll(params)
      .then(r => setCases(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Active crime cases — from vw_active_cases_per_station view</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <select className="form-control" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="pending_trial">Pending Trial</option>
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Complainant</th>
                  <th>Incident Location</th>
                  <th>Station</th>
                  <th>Lead Officer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Days Open</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 && (
                  <tr><td colSpan={8}><EmptyState icon="🗂️" message="No active cases found." /></td></tr>
                )}
                {cases.map(c => (
                  <tr key={c.case_id}>
                    <td>
                      <Link to={`/cases/${c.case_id}`} style={{ color: 'var(--navy-light)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        #{c.case_id}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.complainant_name}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.incident_location}</td>
                    <td style={{ fontSize: '0.85rem' }}>{c.station_name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{c.lead_officer_name} <span style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>({c.lead_officer_rank})</span></td>
                    <td><Badge value={c.priority} /></td>
                    <td><Badge value={c.case_status} /></td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        color: c.days_open > 30 ? 'var(--red)' : c.days_open > 14 ? 'var(--amber)' : 'var(--green)',
                        fontWeight: 600,
                        fontSize: '0.88rem'
                      }}>
                        {c.days_open}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
