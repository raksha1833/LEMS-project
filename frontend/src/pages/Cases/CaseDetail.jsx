// src/pages/Cases/CaseDetail.jsx
// PURPOSE: Full case view — all related data in tabs.
// Tabs: Overview | Suspects | Evidence | Charges | People | Logs

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { caseAPI, suspectAPI, evidenceAPI, chargeAPI, officerAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Badge, Spinner, Tabs, Alert, Modal, EmptyState, InfoGrid, ConfirmDialog } from '../../components'

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit, isAdmin, isOfficer, user } = useAuth()

  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [closing, setClosing] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // Modals
  const [showAddSuspect, setShowAddSuspect] = useState(false)
  const [showCreateSuspect, setShowCreateSuspect] = useState(false)
  const [showAddEvidence, setShowAddEvidence] = useState(false)
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [showArrest, setShowArrest] = useState(false)
  const [showAddVictim, setShowAddVictim] = useState(false)
  const [showAddWitness, setShowAddWitness] = useState(false)
  const [showAssignOfficer, setShowAssignOfficer] = useState(false)
  const [arrestSuspect, setArrestSuspect] = useState(null)

  // Dropdown data
  const [allSuspects, setAllSuspects] = useState([])
  const [allOfficers, setAllOfficers] = useState([])
  const [legalSections, setLegalSections] = useState([])

  const load = () => {
    setLoading(true)
    caseAPI.getById(id)
      .then(r => setCaseData(r.data.data))
      .catch(() => navigate('/cases'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    suspectAPI.getAll().then(r => setAllSuspects(r.data.data))
    officerAPI.getAll({ status: 'active' }).then(r => setAllOfficers(r.data.data))
    chargeAPI.getLegalSections().then(r => setLegalSections(r.data.data))
  }, [id])

  const handleClose = async () => {
    setShowCloseConfirm(false)
    setClosing(true)
    try {
      const r = await caseAPI.close(id)
      setMsg({ type: r.data.success ? 'success' : 'error', text: r.data.message })
      if (r.data.success) load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to close case.' })
    } finally {
      setClosing(false)
    }
  }

  if (loading) return <Spinner />
  if (!caseData) return null

  const c = caseData
  const isClosed = ['closed', 'dismissed'].includes(c.status)

  const tabList = [
    { key: 'overview', label: 'Overview' },
    { key: 'suspects', label: 'Suspects', count: c.suspects?.length },
    { key: 'evidence', label: 'Evidence', count: c.evidence?.length },
    { key: 'charges', label: 'Charges', count: c.charges?.length },
    { key: 'people', label: 'People', count: (c.victims?.length || 0) + (c.witnesses?.length || 0) },
    { key: 'log', label: 'Investigation Log', count: c.investigation_log?.length },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
            <h1 className="page-title">Case #{c.case_id}</h1>
            <Badge value={c.status} />
            <Badge value={c.priority} />
          </div>
          <p className="page-subtitle">
            {c.incident_location} — {new Date(c.incident_date).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {canEdit() && !isClosed && (
            <button className="btn btn-danger" onClick={() => setShowCloseConfirm(true)} disabled={closing}>
              {closing ? 'Closing...' : '🔒 Close Case'}
            </button>
          )}
        </div>
      </div>

      {msg.text && (
        <Alert
          type={msg.type}
          message={msg.text}
          onClose={() => setMsg({ type: '', text: '' })}
        />
      )}

      <Tabs tabs={tabList} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid-2" style={{ gap: '1.2rem' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Case Information</span></div>
            <div className="card-body">
              <InfoGrid items={[
                { label: 'Case ID', value: `#${c.case_id}` },
                { label: 'Status', value: c.status },
                { label: 'Priority', value: c.priority },
                { label: 'Date Opened', value: new Date(c.date_opened).toLocaleDateString('en-IN') },
                { label: 'Date Closed', value: c.date_closed ? new Date(c.date_closed).toLocaleDateString('en-IN') : 'Not closed' },
                { label: 'Station', value: c.station_name },
              ]} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">FIR Details</span></div>
            <div className="card-body">
              <InfoGrid items={[
                { label: 'FIR #', value: `#${c.fir_id}` },
                { label: 'Complainant', value: c.complainant_name },
                { label: 'Contact', value: c.complainant_contact },
                { label: 'Incident Date', value: new Date(c.incident_date).toLocaleDateString('en-IN') },
                { label: 'Location', value: c.incident_location },
                { label: 'FIR Status', value: c.fir_status },
              ]} />
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div
              className="card-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span className="card-title">Assigned Officers</span>
              {isAdmin() && !isClosed && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAssignOfficer(true)}>
                  + Assign Officer
                </button>
              )}
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {c.officers?.map(o => (
                  <div
                    key={o.officer_id}
                    style={{
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      padding: '0.6rem 1rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{o.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {o.officer_rank} — <Badge value={o.role} />
                    </div>
                  </div>
                ))}
                {c.officers?.length === 0 && <span className="text-muted">No officers assigned</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'suspects' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Suspects ({c.suspects?.length})</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {canEdit() && !isClosed && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateSuspect(true)}>
                    + Add Suspect
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddSuspect(true)}>
                    + Link Suspect
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Involvement</th>
                  <th>Arrested</th>
                  <th>Prior Offenses</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {c.suspects?.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon="🔍" message="No suspects linked." />
                    </td>
                  </tr>
                )}

                {c.suspects?.map(s => (
                  <tr key={s.suspect_id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><Badge value={s.involvement_level} /></td>
                    <td>
                      {s.is_arrested
                        ? <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: '0.85rem' }}>✓ Arrested</span>
                        : <span style={{ color: 'var(--amber)', fontSize: '0.85rem' }}>Not arrested</span>
                      }
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {s.prior_offenses}
                    </td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      {canEdit() && !s.is_arrested && !isClosed && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setArrestSuspect(s)
                            setShowArrest(true)
                          }}
                        >
                          Arrest
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Evidence ({c.evidence?.length})</span>
            {canEdit() && !isClosed && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddEvidence(true)}>
                + Add Evidence
              </button>
            )}
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Collected By</th>
                  <th>Date</th>
                  <th>Storage</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {c.evidence?.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon="🔬" message="No evidence added." />
                    </td>
                  </tr>
                )}
                {c.evidence?.map(e => (
                  <tr key={e.evidence_id}>
                    <td><Badge value={e.type} /></td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>{e.description}</td>
                    <td style={{ fontSize: '0.85rem' }}>{e.collected_by_name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {new Date(e.date_collected).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{e.storage_location || '—'}</td>
                    <td><Badge value={e.status} /></td>
                    <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
  {canEdit() && e.status !== 'sealed' && e.status !== 'destroyed' && !isClosed && (
    <select
      className="form-control"
      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: 'auto' }}
      value={e.status}
      onChange={async (ev) => {
        try {
          await evidenceAPI.updateStatus(e.evidence_id, ev.target.value)
          load()
        } catch (err) {
          setMsg({
            type: 'error',
            text: err.response?.data?.message || 'Failed to update evidence status.'
          })
        }
      }}
    >
      <option value="active">Active</option>
      <option value="under_analysis">Under Analysis</option>
      <option value="sealed">Sealed</option>
      <option value="destroyed">Destroyed</option>
    </select>
  )}

  {canEdit() && !isClosed && (
    <button
      className="btn btn-danger btn-sm"
      onClick={async () => {
        try {
          await evidenceAPI.delete(e.evidence_id)
          load()
        } catch (err) {
          setMsg({
            type: 'error',
            text: err.response?.data?.message || 'Failed to delete evidence.'
          })
        }
      }}
    >
      Delete
    </button>
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'charges' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Charges ({c.charges?.length})</span>
            {canEdit() && !isClosed && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddCharge(true)}>
                + Add Charge
              </button>
            )}
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Suspect</th>
                  <th>IPC Section</th>
                  <th>Offence</th>
                  <th>Bailable</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {c.charges?.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon="⚖️" message="No charges filed." />
                    </td>
                  </tr>
                )}

                {c.charges?.map(ch => (
                  <tr key={ch.charge_id}>
                    <td style={{ fontWeight: 500 }}>{ch.suspect_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-light)', fontWeight: 600 }}>
                      IPC {ch.ipc_section}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{ch.section_title}</td>
                    <td style={{ fontSize: '0.85rem' }}>{ch.is_bailable ? '✓ Yes' : '✗ No'}</td>
                    <td><Badge value={ch.charge_status} /></td>
                    <td>
                      {canEdit() && ch.charge_status === 'pending' && (
                        <select
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: 'auto' }}
                          value={ch.charge_status}
                          onChange={async (ev) => {
                            await chargeAPI.updateStatus(ch.charge_id, ev.target.value)
                            load()
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="convicted">Convicted</option>
                          <option value="acquitted">Acquitted</option>
                          <option value="dropped">Dropped</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div className="grid-2" style={{ gap: '1.2rem' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Victims ({c.victims?.length})</span>
              {canEdit() && !isClosed && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddVictim(true)}>
                  + Add Victim
                </button>
              )}
            </div>
            <div className="card-body">
              {c.victims?.length === 0 && <EmptyState icon="👤" message="No victims recorded." />}
              {c.victims?.map(v => (
                <div key={v.victim_id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ fontWeight: 500 }}>{v.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                    {v.contact} {v.gender && `· ${v.gender}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Witnesses ({c.witnesses?.length})</span>
              {canEdit() && !isClosed && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddWitness(true)}>
                  + Add Witness
                </button>
              )}
            </div>
            <div className="card-body">
              {c.witnesses?.length === 0 && <EmptyState icon="👁️" message="No witnesses recorded." />}
              {c.witnesses?.map(w => (
                <div key={w.witness_id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ fontWeight: 500 }}>
                    {w.name} {w.is_protected && <Badge value="protected" />}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                    {w.statement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Investigation Log — Auto + Manual Entries</span>
          </div>
          <div className="card-body">
            {c.investigation_log?.length === 0 && <EmptyState icon="📋" message="No log entries." />}
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              {c.investigation_log?.map((log, i) => (
                <div key={log.log_id} style={{ position: 'relative', paddingBottom: '1.2rem' }}>
                  {i < c.investigation_log.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '-1.08rem',
                        top: '1.4rem',
                        bottom: 0,
                        width: '2px',
                        background: 'var(--gray-200)'
                      }}
                    />
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      left: '-1.4rem',
                      top: '0.4rem',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: log.action_taken.startsWith('Status') ? 'var(--amber)' : 'var(--navy-light)',
                      border: '2px solid #fff',
                      boxShadow: 'var(--shadow)'
                    }}
                  />

                  <div
                    style={{
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      padding: '0.7rem 1rem'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--navy)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {log.action_taken}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                      by {log.officer_name} · {new Date(log.action_date).toLocaleString('en-IN')}
                    </div>
                    {log.remarks && (
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--gray-600)',
                          marginTop: '0.3rem',
                          fontStyle: 'italic'
                        }}
                      >
                        {log.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleClose}
        title="Close Case"
        message="This will permanently close the case. All suspects must be arrested, all charges resolved, and all evidence sealed. Are you sure?"
        confirmLabel="Close Case"
        danger
      />

      <CreateSuspectModal
        isOpen={showCreateSuspect}
        onClose={() => setShowCreateSuspect(false)}
        caseId={id}
        onSuccess={() => {
          setShowCreateSuspect(false)
          load()
          suspectAPI.getAll().then(r => setAllSuspects(r.data.data))
        }}
      />

      <AddSuspectModal
        isOpen={showAddSuspect}
        onClose={() => setShowAddSuspect(false)}
        caseId={id}
        suspects={allSuspects}
        onSuccess={() => {
          setShowAddSuspect(false)
          load()
        }}
      />

      <AddEvidenceModal
        isOpen={showAddEvidence}
        onClose={() => setShowAddEvidence(false)}
        caseId={id}
        officers={allOfficers}
        onSuccess={() => {
          setShowAddEvidence(false)
          load()
        }}
      />

      <AddChargeModal
        isOpen={showAddCharge}
        onClose={() => setShowAddCharge(false)}
        caseId={id}
        suspects={c.suspects}
        sections={legalSections}
        onSuccess={() => {
          setShowAddCharge(false)
          load()
        }}
      />

      <ArrestModal
        isOpen={showArrest}
        onClose={() => setShowArrest(false)}
        suspect={arrestSuspect}
        caseId={id}
        officers={allOfficers}
        currentUser={user}
        isAdmin={isAdmin()}
        isOfficer={isOfficer()}
        onSuccess={() => {
          setShowArrest(false)
          load()
        }}
      />

      <AddVictimModal
        isOpen={showAddVictim}
        onClose={() => setShowAddVictim(false)}
        caseId={id}
        onSuccess={() => {
          setShowAddVictim(false)
          load()
        }}
      />

      <AddWitnessModal
        isOpen={showAddWitness}
        onClose={() => setShowAddWitness(false)}
        caseId={id}
        onSuccess={() => {
          setShowAddWitness(false)
          load()
        }}
      />

      <AssignOfficerModal
        isOpen={showAssignOfficer}
        onClose={() => setShowAssignOfficer(false)}
        caseId={id}
        officers={allOfficers}
        assignedOfficers={c.officers || []}
        onSuccess={() => {
          setShowAssignOfficer(false)
          load()
        }}
      />
    </div>
  )
}

function AssignOfficerModal({ isOpen, onClose, caseId, officers, assignedOfficers, onSuccess }) {
  const [form, setForm] = useState({ officer_id: '', role: 'supporting' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const alreadyAssignedIds = new Set(
    assignedOfficers.map(o => String(o.officer_id))
  )

  const availableOfficers = officers.filter(
    o => !alreadyAssignedIds.has(String(o.officer_id))
  )

  const submit = async () => {
    if (!form.officer_id) {
      setErr('Please select an officer.')
      return
    }

    setLoading(true)
    setErr('')

    try {
      await caseAPI.assignOfficer(caseId, form.officer_id, form.role)
      setForm({ officer_id: '', role: 'supporting' })
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to assign officer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Officer to Case"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Officer'}
          </button>
        </>
      }
    >
      {err && <Alert type="error" message={err} onClose={() => setErr('')} />}

      <div className="form-group">
        <label className="form-label">Officer *</label>
        <select
          className="form-control"
          value={form.officer_id}
          onChange={e => setForm(f => ({ ...f, officer_id: e.target.value }))}
        >
          <option value="">Select officer</option>
          {availableOfficers.map(o => (
            <option key={o.officer_id} value={o.officer_id}>
              {o.name} ({o.officer_rank || o.rank})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Role *</label>
        <select
          className="form-control"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        >
          <option value="supporting">Supporting</option>
          <option value="investigator">Investigator</option>
          <option value="forensics">Forensics</option>
          <option value="lead">Lead</option>
        </select>
      </div>
    </Modal>
  )
}

function CreateSuspectModal({ isOpen, onClose, caseId, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    address: '',
    contact: '',
    national_id: '',
    involvement_level: 'primary'
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) {
      setErr('Suspect name is required.')
      return
    }

    setLoading(true)
    setErr('')

    try {
      const createRes = await suspectAPI.create({
        name: form.name,
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address || null,
        contact: form.contact || null,
        national_id: form.national_id || null
      })

      const suspectId = createRes.data?.data?.suspect_id

      if (!suspectId) {
        throw new Error('Suspect created but ID not returned.')
      }

      await suspectAPI.linkToCase(suspectId, caseId, form.involvement_level)

      setForm({
        name: '',
        dob: '',
        gender: '',
        address: '',
        contact: '',
        national_id: '',
        involvement_level: 'primary'
      })

      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Failed to create and link suspect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Suspect to Case"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : 'Create & Link'}
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

        <div className="form-group">
          <label className="form-label">Involvement Level *</label>
          <select className="form-control" value={form.involvement_level} onChange={set('involvement_level')}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="accomplice">Accomplice</option>
            <option value="person_of_interest">Person of Interest</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-control" value={form.address} onChange={set('address')} rows={2} placeholder="Full address" />
      </div>
    </Modal>
  )
}

function AddSuspectModal({ isOpen, onClose, caseId, suspects, onSuccess }) {
  const [form, setForm] = useState({ suspect_id: '', involvement_level: 'primary' })
  const [err, setErr] = useState('')

  const submit = async () => {
    try {
      await suspectAPI.linkToCase(form.suspect_id, caseId, form.involvement_level)
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Suspect to Case"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Link</button>
        </>
      }
    >
      {err && <Alert type="error" message={err} />}
      <div className="form-group">
        <label className="form-label">Suspect *</label>
        <select
          className="form-control"
          value={form.suspect_id}
          onChange={e => setForm(f => ({ ...f, suspect_id: e.target.value }))}
        >
          <option value="">Select suspect</option>
          {suspects.map(s => (
            <option key={s.suspect_id} value={s.suspect_id}>
              {s.name} — {s.national_id || 'No ID'}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Involvement Level *</label>
        <select
          className="form-control"
          value={form.involvement_level}
          onChange={e => setForm(f => ({ ...f, involvement_level: e.target.value }))}
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="accomplice">Accomplice</option>
          <option value="person_of_interest">Person of Interest</option>
        </select>
      </div>
    </Modal>
  )
}

function AddEvidenceModal({ isOpen, onClose, caseId, officers, onSuccess }) {
  const [form, setForm] = useState({
    type: 'physical',
    description: '',
    collected_by: '',
    date_collected: '',
    storage_location: ''
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    try {
      await evidenceAPI.create({ ...form, case_id: caseId })
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add evidence.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Evidence"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Add</button>
        </>
      }
    >
      {err && <Alert type="error" message={err} />}
      <div className="form-group">
        <label className="form-label">Type *</label>
        <select
          className="form-control"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          {['physical', 'digital', 'documentary', 'forensic', 'testimony'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea
          className="form-control"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Collected By *</label>
          <select
            className="form-control"
            value={form.collected_by}
            onChange={e => setForm(f => ({ ...f, collected_by: e.target.value }))}
          >
            <option value="">Select officer</option>
            {officers.map(o => (
              <option key={o.officer_id} value={o.officer_id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date Collected *</label>
          <input
            className="form-control"
            type="datetime-local"
            value={form.date_collected}
            onChange={e => setForm(f => ({ ...f, date_collected: e.target.value }))}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Storage Location</label>
        <input
          className="form-control"
          value={form.storage_location}
          onChange={e => setForm(f => ({ ...f, storage_location: e.target.value }))}
        />
      </div>
    </Modal>
  )
}

function AddChargeModal({ isOpen, onClose, caseId, suspects, sections, onSuccess }) {
  const [form, setForm] = useState({ suspect_id: '', section_id: '', notes: '' })
  const [err, setErr] = useState('')

  const submit = async () => {
    try {
      await chargeAPI.create({ ...form, case_id: caseId })
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Charge"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>File</button>
        </>
      }
    >
      {err && <Alert type="error" message={err} />}
      <div className="form-group">
        <label className="form-label">Suspect *</label>
        <select
          className="form-control"
          value={form.suspect_id}
          onChange={e => setForm(f => ({ ...f, suspect_id: e.target.value }))}
        >
          <option value="">Select suspect</option>
          {suspects?.map(s => (
            <option key={s.suspect_id} value={s.suspect_id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">IPC Section *</label>
        <select
          className="form-control"
          value={form.section_id}
          onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
        >
          <option value="">Select section</option>
          {sections.map(s => (
            <option key={s.section_id} value={s.section_id}>
              IPC {s.ipc_section} — {s.title}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-control"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
        />
      </div>
    </Modal>
  )
}

function ArrestModal({ isOpen, onClose, suspect, caseId, officers, currentUser, isAdmin, isOfficer, onSuccess }) {
  const [form, setForm] = useState({ officer_id: '', location: '', notes: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMsg({ type: '', text: '' })

      if (isOfficer && currentUser?.officer_id) {
        setForm({
          officer_id: String(currentUser.officer_id),
          location: '',
          notes: ''
        })
      } else {
        setForm({
          officer_id: '',
          location: '',
          notes: ''
        })
      }
    }
  }, [isOpen, isOfficer, currentUser])

  const submit = async () => {
    setLoading(true)
    try {
      const r = await suspectAPI.arrest({
        suspect_id: suspect?.suspect_id,
        officer_id: form.officer_id,
        case_id: caseId,
        location: form.location,
      })

      if (r.data.success) {
        onSuccess()
      } else {
        setMsg({ type: 'error', text: r.data.message })
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Arrest failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Arrest: ${suspect?.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={submit} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Arrest'}
          </button>
        </>
      }
    >
      {msg.text && <Alert type={msg.type} message={msg.text} />}

      <div className="alert alert-warning mb-3">
        This calls <strong>arrest_suspect()</strong> stored procedure with REPEATABLE READ isolation.
      </div>

      {isAdmin ? (
        <div className="form-group">
          <label className="form-label">Arresting Officer *</label>
          <select
            className="form-control"
            value={form.officer_id}
            onChange={e => setForm(f => ({ ...f, officer_id: e.target.value }))}
          >
            <option value="">Select officer</option>
            {officers.map(o => (
              <option key={o.officer_id} value={o.officer_id}>
                {o.name} ({o.rank})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Arresting Officer</label>
          <input
            className="form-control"
            value={currentUser?.officer_name || currentUser?.username || ''}
            readOnly
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Arrest Location</label>
        <input
          className="form-control"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          placeholder="Where was the suspect arrested?"
        />
      </div>
    </Modal>
  )
}

function AddVictimModal({ isOpen, onClose, caseId, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    address: '',
    contact: ''
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) {
      setErr('Victim name is required.')
      return
    }

    setLoading(true)
    setErr('')
    try {
      await caseAPI.addVictim(caseId, {
        name: form.name,
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address || null,
        contact: form.contact || null
      })

      setForm({
        name: '',
        dob: '',
        gender: '',
        address: '',
        contact: ''
      })

      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add victim.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Victim"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Victim'}
          </button>
        </>
      }
    >
      {err && <Alert type="error" message={err} onClose={() => setErr('')} />}

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-control" value={form.name} onChange={set('name')} />
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
          <label className="form-label">Contact</label>
          <input className="form-control" value={form.contact} onChange={set('contact')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} />
      </div>
    </Modal>
  )
}

function AddWitnessModal({ isOpen, onClose, caseId, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    address: '',
    statement: '',
    is_protected: 'false'
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) {
      setErr('Witness name is required.')
      return
    }

    setLoading(true)
    setErr('')
    try {
      await caseAPI.addWitness(caseId, {
        name: form.name,
        contact: form.contact || null,
        address: form.address || null,
        statement: form.statement || null,
        is_protected: form.is_protected === 'true'
      })

      setForm({
        name: '',
        contact: '',
        address: '',
        statement: '',
        is_protected: 'false'
      })

      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add witness.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Witness"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Witness'}
          </button>
        </>
      }
    >
      {err && <Alert type="error" message={err} onClose={() => setErr('')} />}

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-control" value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <input className="form-control" value={form.contact} onChange={set('contact')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} />
      </div>

      <div className="form-group">
        <label className="form-label">Statement</label>
        <textarea className="form-control" rows={3} value={form.statement} onChange={set('statement')} />
      </div>

      <div className="form-group">
        <label className="form-label">Protection Status</label>
        <select className="form-control" value={form.is_protected} onChange={set('is_protected')}>
          <option value="false">Normal Witness</option>
          <option value="true">Protected Witness</option>
        </select>
      </div>
    </Modal>
  )
}