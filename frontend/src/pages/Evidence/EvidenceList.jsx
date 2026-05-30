// src/pages/Evidence/EvidenceList.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { evidenceAPI } from '../../services/api'
import { Spinner, EmptyState, Alert } from '../../components'

export default function EvidenceList() {
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [caseFilter, setCaseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })

  const load = () => {
    setLoading(true)
    const params = {}
    if (caseFilter) params.case_id = caseFilter
    if (statusFilter) params.status = statusFilter

    evidenceAPI.getAll(params)
      .then(r => setEvidence(r.data.data))
      .catch(() => {
        setMsg({ type: 'error', text: 'Failed to fetch evidence.' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [caseFilter, statusFilter])

  const statusColor = (s) => {
    if (s === 'active') return '#1e40af'
    if (s === 'under_analysis') return '#92400e'
    if (s === 'sealed') return '#065f46'
    if (s === 'destroyed') return '#991b1b'
    return '#475569'
  }

  const handleDelete = async (evidenceId) => {
    try {
      await evidenceAPI.delete(evidenceId)
      setMsg({ type: 'success', text: 'Evidence deleted successfully.' })
      load()
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete evidence.'
      })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence</h1>
          <p className="page-subtitle">All evidence items across all cases</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <input
            className="form-control"
            style={{ width: '140px' }}
            placeholder="Filter by Case #"
            value={caseFilter}
            onChange={e => setCaseFilter(e.target.value)}
          />
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="under_analysis">Under Analysis</option>
            <option value="sealed">Sealed</option>
            <option value="destroyed">Destroyed</option>
          </select>
        </div>
      </div>

      {msg.text && (
        <Alert
          type={msg.type}
          message={msg.text}
          onClose={() => setMsg({ type: '', text: '' })}
        />
      )}

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Collected By</th>
                  <th>Date Collected</th>
                  <th>Storage Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {evidence.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon="🔬" message="No evidence found." />
                    </td>
                  </tr>
                )}

                {evidence.map(e => (
                  <tr key={e.evidence_id}>
                    <td>
                      <Link
                        to={`/cases/${e.case_id}`}
                        style={{ color: 'var(--navy-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                      >
                        #{e.case_id}
                      </Link>
                    </td>

                    <td>
                      <span
                        style={{
                          background: 'var(--gray-100)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {e.type}
                      </span>
                    </td>

                    <td
                      style={{
                        fontSize: '0.85rem',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {e.description}
                    </td>

                    <td style={{ fontSize: '0.85rem' }}>{e.collected_by_name}</td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {new Date(e.date_collected).toLocaleDateString('en-IN')}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {e.storage_location || '—'}
                    </td>

                    <td>
                      <span
                        style={{
                          background: statusColor(e.status) + '18',
                          color: statusColor(e.status),
                          padding: '0.18rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          border: `1px solid ${statusColor(e.status)}33`
                        }}
                      >
                        {e.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(e.evidence_id)}
                      >
                        Delete
                      </button>
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