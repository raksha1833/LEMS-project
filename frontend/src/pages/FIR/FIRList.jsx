// src/pages/FIR/FIRList.jsx
// PURPOSE: Shows all FIRs. Officers see only their station.
// Can filter by status. Each row links to FIR detail.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { firAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Badge, Spinner, EmptyState } from '../../components'

export default function FIRList() {
  const [firs,    setFirs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const { canEdit } = useAuth()

  const load = () => {
    setLoading(true)
    firAPI.getAll(status ? { status } : {})
      .then(res => setFirs(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">FIRs</h1>
          <p className="page-subtitle">First Information Reports</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <select className="form-control" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="closed">Closed</option>
            <option value="false_report">False Report</option>
          </select>
          {canEdit() && (
            <Link to="/fir/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ File FIR</Link>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>FIR #</th>
                  <th>Complainant</th>
                  <th>Incident Date</th>
                  <th>Location</th>
                  <th>Station</th>
                  <th>Officer</th>
                  <th>Status</th>
                  <th>Case</th>
                </tr>
              </thead>
              <tbody>
                {firs.length === 0 && (
                  <tr><td colSpan={8}><EmptyState icon="📄" message="No FIRs found." /></td></tr>
                )}
                {firs.map(f => (
                  <tr key={f.fir_id}>
                    <td><Link to={`/fir/${f.fir_id}`} style={{ color: 'var(--navy-light)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>#{f.fir_id}</Link></td>
                    <td style={{ fontWeight: 500 }}>{f.complainant_name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{new Date(f.incident_date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.incident_location}</td>
                    <td style={{ fontSize: '0.85rem' }}>{f.station_name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{f.registered_by}</td>
                    <td><Badge value={f.status} /></td>
                    <td>
                      {f.case_id
                        ? <Link to={`/cases/${f.case_id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Case #{f.case_id}</Link>
                        : '—'
                      }
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
