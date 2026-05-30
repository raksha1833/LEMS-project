// src/pages/Suspects/SuspectList.jsx
import { useState, useEffect } from 'react'
import { suspectAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Spinner, EmptyState, Modal, Alert } from '../../components'

export default function SuspectList() {
  const [suspects, setSuspects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const { canEdit } = useAuth()

  const load = () => {
    setLoading(true)
    suspectAPI.getAll()
      .then(r => setSuspects(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suspects</h1>
          <p className="page-subtitle">All suspects in the system</p>
        </div>
        {canEdit() && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Suspect
          </button>
        )}
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Address</th>
                  <th>National ID</th>
                  <th>Criminal Record</th>
                  <th>Prior Offenses</th>
                </tr>
              </thead>
              <tbody>
                {suspects.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon="🔍" message="No suspects found." />
                    </td>
                  </tr>
                )}
                {suspects.map(s => (
                  <tr key={s.suspect_id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {s.age || '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{s.gender || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.address || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {s.national_id || '—'}
                    </td>
                    <td>
                      {s.criminal_record
                        ? <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: '0.85rem' }}>✓ Yes</span>
                        : <span style={{ color: 'var(--green)', fontSize: '0.85rem' }}>No</span>
                      }
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textAlign: 'center' }}>
                      {s.prior_offenses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddSuspectModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); load() }}
      />
    </div>
  )
}

function AddSuspectModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', dob: '', gender: '', address: '',
    contact: '', national_id: ''
  })
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const submit = async () => {
    if (!form.name) { setErr('Suspect name is required.'); return }
    setLoading(true)
    try {
      await suspectAPI.create(form)
      setForm({ name:'', dob:'', gender:'', address:'', contact:'', national_id:'' })
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add suspect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Suspect"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Suspect'}
          </button>
        </>
      }
    >
      {err && <Alert type="error" message={err} onClose={() => setErr('')} />}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-control" value={form.name} onChange={set('name')} placeholder="Full name" />
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input className="form-control" type="date" value={form.dob} onChange={set('dob')} />
        </div>
        <div className="form-group">
          <label className="form-label">Gender</label>
          <select className="form-control" value={form.gender} onChange={set('gender')}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">National ID</label>
          <input className="form-control" value={form.national_id} onChange={set('national_id')} placeholder="Aadhaar / Passport" />
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <input className="form-control" value={form.contact} onChange={set('contact')} placeholder="Phone number" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-control" value={form.address} onChange={set('address')} rows={2} placeholder="Full address" />
      </div>
    </Modal>
  )
}
