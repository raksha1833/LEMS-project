// src/pages/Officers/OfficerList.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { officerAPI } from '../../services/api'
import { Badge, Spinner, EmptyState } from '../../components'

export function OfficerList() {
  const [officers, setOfficers] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    officerAPI.getAll().then(r => setOfficers(r.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Officers</h1><p className="page-subtitle">All active police officers</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Rank</th><th>Station</th><th>District</th><th>Status</th><th>Contact</th></tr></thead>
              <tbody>
                {officers.length === 0 && <tr><td colSpan={6}><EmptyState icon="👮" message="No officers found." /></td></tr>}
                {officers.map(o => (
                  <tr key={o.officer_id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link to={`/officers/${o.officer_id}`} style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                        {o.name}
                      </Link>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--navy-light)' }}>{o.officer_rank || o.rank}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{o.station}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{o.district}</td>
                    <td><Badge value={o.status} /></td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{o.contact || '—'}</td>
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

// ── Officer Workload Page ──────────────────────────────────────────────────
// src/pages/Officers/OfficerWorkload.jsx
// Uses vw_officer_workload view
export function OfficerWorkload() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    officerAPI.getWorkload().then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  const barColor = (status) => {
    if (status === 'Overloaded')    return 'var(--red)'
    if (status === 'Full Capacity') return 'var(--amber)'
    if (status === 'Near Capacity') return '#f59e0b'
    return 'var(--green)'
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Officer Workload</h1><p className="page-subtitle">From vw_officer_workload view — cases vs rank capacity</p></div>
      </div>
      {loading ? <Spinner /> : (
        <div className="grid-2" style={{ gap: '1rem' }}>
          {data.map(o => (
            <div key={o.officer_id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>{o.officer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>{o.rank_title} · {o.station_name}</div>
                  </div>
                  <span style={{ background: barColor(o.workload_status) + '22', color: barColor(o.workload_status), padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 700, border: `1px solid ${barColor(o.workload_status)}44` }}>
                    {o.workload_status}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ background: 'var(--gray-100)', borderRadius: '20px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((o.active_assigned_cases / o.max_cases_allowed) * 100, 100)}%`,
                    height: '100%',
                    background: barColor(o.workload_status),
                    borderRadius: '20px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)' }}>
                  <span>{o.active_assigned_cases} active</span>
                  <span>max {o.max_cases_allowed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
