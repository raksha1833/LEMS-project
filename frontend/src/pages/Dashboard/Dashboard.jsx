// src/pages/Dashboard/Dashboard.jsx
// PURPOSE: Home page after login.
// Shows role-filtered stats: total FIRs, cases, arrests, evidence.
// Shows 5 most recent FIRs.
// Admin sees all stations. Officer sees own station only.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reportAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { StatCard, Spinner, Badge } from '../../components'

export default function Dashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const { user }  = useAuth()

  useEffect(() => {
    reportAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const { cases, firs, arrests, evidence, recent_firs } = data || {}

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.officer_name || user?.username}
            {user?.station_name && ` — ${user.station_name}`}
          </p>
        </div>
        <Link to="/fir/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          + File New FIR
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-4">
        <StatCard label="Total Cases"   value={cases?.total_cases}   color="#1b3a6b" sub={`${cases?.open_cases || 0} open`} />
        <StatCard label="Total FIRs"    value={firs?.total_firs}     color="#d97706" sub={`${firs?.open_firs || 0} open`} />
        <StatCard label="Total Arrests" value={arrests?.total_arrests} color="#b91c1c" />
        <StatCard label="Evidence Items" value={evidence?.total_evidence} color="#166534" sub={`${evidence?.sealed_evidence || 0} sealed`} />
      </div>

      {/* Case status breakdown */}
      <div className="grid-4 mb-4">
        <StatCard label="Open Cases"         value={cases?.open_cases}    color="#1e40af" />
        <StatCard label="Investigating"       value={cases?.investigating} color="#92400e" />
        <StatCard label="Pending Trial"       value={cases?.pending_trial} color="#5b21b6" />
        <StatCard label="Closed Cases"        value={cases?.closed_cases}  color="#065f46" />
      </div>

      {/* Recent FIRs */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent FIRs</span>
          <Link to="/fir" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View All →</Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>FIR #</th>
                <th>Complainant</th>
                <th>Incident Location</th>
                <th>Date Filed</th>
                <th>Status</th>
                <th>Case</th>
              </tr>
            </thead>
            <tbody>
              {recent_firs?.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>No FIRs found</td></tr>
              )}
              {recent_firs?.map(fir => (
                <tr key={fir.fir_id}>
                  <td><span className="text-mono">#{fir.fir_id}</span></td>
                  <td><Link to={`/fir/${fir.fir_id}`} style={{ color: 'var(--navy-light)', fontWeight: 500 }}>{fir.complainant_name}</Link></td>
                  <td style={{ color: 'var(--gray-600)', fontSize: '0.88rem' }}>{fir.incident_location}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{new Date(fir.date_filed).toLocaleDateString('en-IN')}</td>
                  <td><Badge value={fir.status} /></td>
                  <td>
                    {fir.case_id
                      ? <Link to={`/cases/${fir.case_id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Case #{fir.case_id}</Link>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
