import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { officerAPI } from '../../services/api'
import { Badge, Spinner, Alert, EmptyState } from '../../components'

export default function OfficerDetail() {
  const { id } = useParams()

  const [officer, setOfficer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    setErr('')

    officerAPI.getById(id)
      .then(r => setOfficer(r.data.data))
      .catch(e => {
        setErr(e.response?.data?.message || 'Failed to load officer details.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />

  if (err) {
    return (
      <div>
        <Alert type="error" message={err} />
        <Link to="/officers" className="btn btn-ghost" style={{ marginTop: '1rem', display: 'inline-block' }}>
          ← Back to Officers
        </Link>
      </div>
    )
  }

  if (!officer) return null

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
            <h1 className="page-title">{officer.name}</h1>
            <Badge value={officer.status} />
          </div>
          <p className="page-subtitle">
            {officer.rank || officer.officer_rank} — {officer.station}, {officer.district}
          </p>
        </div>

        <Link to="/officers" className="btn btn-ghost">
          ← Back to Officers
        </Link>
      </div>

      <div className="grid-2" style={{ gap: '1.2rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Officer Profile</span>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Officer ID</div>
                <div className="info-value">#{officer.officer_id}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Rank</div>
                <div className="info-value">{officer.rank || officer.officer_rank || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Gender</div>
                <div className="info-value">{officer.gender || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Date of Birth</div>
                <div className="info-value">
                  {officer.dob ? new Date(officer.dob).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Date Joined</div>
                <div className="info-value">
                  {officer.date_joined ? new Date(officer.date_joined).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Contact</div>
                <div className="info-value">{officer.contact || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Station</div>
                <div className="info-value">{officer.station || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">District</div>
                <div className="info-value">{officer.district || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Max Case Capacity</div>
                <div className="info-value">{officer.max_cases_allowed ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          <div className="card-body">
            {!officer.recent_logs || officer.recent_logs.length === 0 ? (
              <EmptyState icon="📋" message="No recent activity found." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {officer.recent_logs.map(log => (
                  <div
                    key={log.log_id}
                    style={{
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      padding: '0.8rem 1rem'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--navy)',
                        marginBottom: '0.2rem'
                      }}
                    >
                      {log.action_taken}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      Case #{log.case_id}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      {new Date(log.action_date).toLocaleString('en-IN')}
                    </div>

                    {log.remarks && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.84rem', color: 'var(--gray-700)' }}>
                        {log.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}