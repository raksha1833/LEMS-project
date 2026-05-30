// src/pages/Reports/Reports.jsx
import { useState, useEffect } from 'react'
import { reportAPI, utilAPI } from '../../services/api'
import { Spinner, StatCard, EmptyState } from '../../components'

export default function Reports() {
  const [stations,         setStations]         = useState([])
  const [selectedStation,  setSelectedStation]  = useState('')
  const [report,           setReport]           = useState(null)
  const [loading,          setLoading]          = useState(false)

  useEffect(() => {
    utilAPI.getStations()
      .then(r => setStations(r.data.data))
      .catch(console.error)
  }, [])

  const loadReport = async () => {
    if (!selectedStation) return
    setLoading(true)
    try {
      const r = await reportAPI.getStationReport(selectedStation)
      setReport(r.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const wColor = s => {
    if (s === 'Overloaded')    return 'var(--red)'
    if (s === 'Full Capacity') return 'var(--amber)'
    if (s === 'Near Capacity') return '#f59e0b'
    return 'var(--green)'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Station Report</h1>
          <p className="page-subtitle">Comprehensive analytics for a selected station</p>
        </div>
      </div>

      {/* Station selector */}
      <div className="card mb-4">
        <div className="card-body" style={{ display:'flex', gap:'0.8rem', alignItems:'flex-end' }}>
          <div className="form-group" style={{ flex:1, marginBottom:0 }}>
            <label className="form-label">Select Station</label>
            <select className="form-control" value={selectedStation} onChange={e => setSelectedStation(e.target.value)}>
              <option value="">Choose a station...</option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.name} — {s.district}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={loadReport}
            disabled={!selectedStation || loading}
          >
            {loading ? 'Loading...' : '📊 Generate Report'}
          </button>
        </div>
      </div>

      {loading && <Spinner />}

      {report && !loading && (
        <>
          {/* Station overview */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">📍 {report.station?.name}</span>
              <span style={{ fontSize:'0.85rem', color:'var(--gray-500)' }}>
                {report.station?.district}, {report.station?.state}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
                <div><span className="text-muted">Contact: </span><strong>{report.station?.contact || '—'}</strong></div>
                <div><span className="text-muted">Status: </span><strong>{report.station?.status}</strong></div>
                <div><span className="text-muted">Established: </span><strong>{report.station?.established_date ? new Date(report.station.established_date).getFullYear() : '—'}</strong></div>
              </div>
            </div>
          </div>

          {/* Case stats */}
          {report.case_stats?.length > 0 && (
            <div className="mb-4">
              <h3 style={{ fontFamily:'var(--font-heading)', color:'var(--navy)', marginBottom:'0.8rem', fontSize:'1rem', letterSpacing:'0.04em', textTransform:'uppercase' }}>Case Statistics</h3>
              <div className="grid-4">
                {report.case_stats.map((s, i) => (
                  <StatCard
                    key={i}
                    label={`${s.status} / ${s.priority}`}
                    value={s.count}
                    color={s.status === 'closed' ? 'var(--green)' : s.status === 'open' ? 'var(--navy-light)' : 'var(--amber)'}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid-2" style={{ gap:'1.2rem' }}>
            {/* Officer workload */}
            <div className="card">
              <div className="card-header"><span className="card-title">Officer Workload</span></div>
              <div className="card-body">
                {report.officer_workload?.length === 0 && <EmptyState icon="👮" message="No officers found." />}
                {report.officer_workload?.map(o => (
                  <div key={o.officer_id} style={{ marginBottom:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                      <div>
                        <span style={{ fontWeight:600, fontFamily:'var(--font-heading)' }}>{o.officer_name}</span>
                        <span style={{ fontSize:'0.78rem', color:'var(--gray-500)', marginLeft:'0.5rem' }}>{o.rank_title}</span>
                      </div>
                      <span style={{ fontSize:'0.78rem', fontWeight:700, color: wColor(o.workload_status) }}>
                        {o.workload_status}
                      </span>
                    </div>
                    <div style={{ background:'var(--gray-100)', borderRadius:'20px', height:'6px', overflow:'hidden' }}>
                      <div style={{
                        width: `${Math.min((o.active_assigned_cases / o.max_cases_allowed) * 100, 100)}%`,
                        height:'100%',
                        background: wColor(o.workload_status),
                        borderRadius:'20px',
                        transition:'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.2rem', fontSize:'0.75rem', color:'var(--gray-400)', fontFamily:'var(--font-mono)' }}>
                      <span>{o.active_assigned_cases} active</span>
                      <span>max {o.max_cases_allowed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent arrests */}
            <div className="card">
              <div className="card-header"><span className="card-title">Recent Arrests</span></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Suspect</th><th>Officer</th><th>Date</th><th>Location</th></tr></thead>
                  <tbody>
                    {report.recent_arrests?.length === 0 && (
                      <tr><td colSpan={4}><EmptyState icon="🚔" message="No arrests recorded." /></td></tr>
                    )}
                    {report.recent_arrests?.map(a => (
                      <tr key={a.arrest_id}>
                        <td style={{ fontWeight:500 }}>{a.suspect_name}</td>
                        <td style={{ fontSize:'0.85rem' }}>{a.arresting_officer}</td>
                        <td style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>
                          {new Date(a.arrest_date).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>
                          {a.location || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Evidence summary */}
          {report.evidence_summary?.length > 0 && (
            <div className="card mt-4">
              <div className="card-header"><span className="card-title">Evidence Summary</span></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Type</th><th>Status</th><th>Count</th></tr></thead>
                  <tbody>
                    {report.evidence_summary.map((e, i) => (
                      <tr key={i}>
                        <td style={{ textTransform:'capitalize' }}>{e.type}</td>
                        <td style={{ textTransform:'capitalize' }}>{e.status.replace('_',' ')}</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{e.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
