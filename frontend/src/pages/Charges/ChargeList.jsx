// src/pages/Charges/ChargeList.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { chargeAPI } from '../../services/api'
import { Spinner, EmptyState } from '../../components'

export default function ChargeList() {
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargeAPI.getAll()
      .then(r => setCharges(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusColor = s => ({
    pending:   { bg:'#fef3c7', color:'#92400e' },
    convicted: { bg:'#d1fae5', color:'#065f46' },
    acquitted: { bg:'#dbeafe', color:'#1e40af' },
    dropped:   { bg:'#f1f5f9', color:'#475569' },
  }[s] || { bg:'#f1f5f9', color:'#475569' })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Charges</h1>
          <p className="page-subtitle">All IPC charges filed across cases</p>
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Suspect</th>
                  <th>IPC Section</th>
                  <th>Offence Title</th>
                  <th>Date Charged</th>
                  <th>Bailable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {charges.length === 0 && (
                  <tr><td colSpan={7}><EmptyState icon="⚖️" message="No charges filed." /></td></tr>
                )}
                {charges.map(c => {
                  const sc = statusColor(c.charge_status)
                  return (
                    <tr key={c.charge_id}>
                      <td>
                        <Link to={`/cases/${c.case_id}`} style={{ color:'var(--navy-light)', fontFamily:'var(--font-mono)', fontWeight:600 }}>
                          #{c.case_id}
                        </Link>
                      </td>
                      <td style={{ fontWeight:500 }}>{c.suspect_name}</td>
                      <td>
                        <span style={{ fontFamily:'var(--font-mono)', color:'var(--navy-light)', fontWeight:700, fontSize:'0.9rem' }}>
                          IPC {c.ipc_section}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.85rem' }}>{c.section_title}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>
                        {new Date(c.date_charged).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontSize:'0.85rem' }}>
                        {c.is_bailable
                          ? <span style={{ color:'var(--green)', fontWeight:600 }}>✓ Yes</span>
                          : <span style={{ color:'var(--red)', fontWeight:600 }}>✗ No</span>
                        }
                      </td>
                      <td>
                        <span style={{ background:sc.bg, color:sc.color, padding:'0.18rem 0.6rem', borderRadius:'20px', fontSize:'0.78rem', fontFamily:'var(--font-heading)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          {c.charge_status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
