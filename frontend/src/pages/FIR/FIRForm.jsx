// src/pages/FIR/FIRForm.jsx
// PURPOSE: Form to file a new FIR.
// Calls POST /api/fir → backend calls file_fir() stored procedure.
// On success: Trigger 1 auto-creates CrimeCase.
// Redirects to the newly created Case detail page.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { firAPI, utilAPI, officerAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components'

export default function FIRForm() {
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [form, setForm] = useState({
    complainant_name:    '',
    complainant_contact: '',
    complainant_address: '',
    incident_date:       '',
    incident_location:   '',
    description:         '',
    station_id:          user?.station_id || '',
    officer_id:          user?.officer_id || '',
  })

  const [stations,  setStations]  = useState([])
  const [officers,  setOfficers]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    utilAPI.getStations().then(r => setStations(r.data.data))
    officerAPI.getAll({ status: 'active' }).then(r => setOfficers(r.data.data))
  }, [])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await firAPI.create(form)
      const { case_id } = res.data.data
      // Navigate to the auto-created case
      navigate(`/cases/${case_id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file FIR.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">File New FIR</h1>
          <p className="page-subtitle">First Information Report — auto-creates a linked CrimeCase</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">FIR Details</span>
        </div>
        <div className="card-body">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Complainant Name *</label>
                <input className="form-control" value={form.complainant_name} onChange={set('complainant_name')} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Complainant Contact</label>
                <input className="form-control" value={form.complainant_contact} onChange={set('complainant_contact')} placeholder="Phone number" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Complainant Address</label>
              <input className="form-control" value={form.complainant_address} onChange={set('complainant_address')} placeholder="Full address" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Incident Date *</label>
                <input className="form-control" type="date" value={form.incident_date} onChange={set('incident_date')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Incident Location *</label>
                <input className="form-control" value={form.incident_location} onChange={set('incident_location')} required placeholder="Where did it happen?" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" value={form.description} onChange={set('description')} required placeholder="Describe the incident in detail..." rows={4} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Station *</label>
                <select className="form-control" value={form.station_id} onChange={set('station_id')} required
                  disabled={user?.role === 'officer'}>
                  <option value="">Select station</option>
                  {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Registering Officer *</label>
                <select className="form-control" value={form.officer_id} onChange={set('officer_id')} required
                  disabled={user?.role === 'officer'}>
                  <option value="">Select officer</option>
                  {officers.map(o => <option key={o.officer_id} value={o.officer_id}>{o.name} ({o.rank})</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Filing FIR...' : '✓ File FIR'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/fir')}>
                Cancel
              </button>
            </div>
          </form>

          <div className="alert alert-info mt-3">
            <strong>Note:</strong> Filing a FIR automatically creates a linked CrimeCase via Trigger 1. You will be redirected to the case page after submission.
          </div>
        </div>
      </div>
    </div>
  )
}
