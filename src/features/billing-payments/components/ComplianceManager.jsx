import React, { useEffect, useState } from 'react'
import billingService from '../services/billingService'
import { formatDate } from '../../../utils/date'

export default function ComplianceManager() {
  const [tab, setTab] = useState('audit')
  return (
    <div>
      <h5 className="mb-3">Compliance & Audit</h5>
      <ul className="nav nav-tabs mb-3">
        {[['audit', 'Audit Logs'], ['reports', 'Reports'], ['policies', 'Policies']].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          </li>
        ))}
      </ul>
      {tab === 'audit' && <AuditLogsPanel />}
      {tab === 'reports' && <ReportsPanel />}
      {tab === 'policies' && <PoliciesPanel />}
    </div>
  )
}

const ACTION_OPTIONS = ['All', 'Create', 'Update', 'Delete', 'Login', 'Logout']
const ENTITY_OPTIONS = ['All', 'Invoice', 'Payment', 'User', 'Policy', 'Report']

function AuditLogsPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [action, setAction] = useState('All')
  const [entityType, setEntityType] = useState('All')

  const buildParams = (a, e) => ({ Action: a === 'All' ? ACTION_OPTIONS[1] : a, EntityType: e === 'All' ? ENTITY_OPTIONS[1] : e })

  useEffect(() => {
    setLoading(true)
    billingService.compliance.auditLogs(buildParams(action, entityType))
      .then(setLogs).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [action, entityType])

  const handleExport = async () => {
    try {
      const blob = await billingService.compliance.exportAudit(buildParams(action, entityType))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="spinner-border" />
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex gap-2 justify-content-between mb-2">
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={action} onChange={e => setAction(e.target.value)}>
            {ACTION_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="form-select form-select-sm" value={entityType} onChange={e => setEntityType(e.target.value)}>
            {ENTITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={handleExport}><i className="fa-solid fa-download me-1" />Export CSV</button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-bordered align-middle">
          <thead className="table-dark"><tr><th>Event</th><th>User</th><th>IP</th><th>Date</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>{l.event || l.action}</td>
                <td>{l.userId || l.user}</td>
                <td>{l.ipAddress || '-'}</td>
                <td>{formatDate(l.createdAt || l.timestamp)}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No audit logs.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportsPanel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', type: '' })

  const load = () => {
    setLoading(true)
    billingService.compliance.reports.list().then(setReports).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try { await billingService.compliance.reports.create(form); setShowAdd(false); setForm({ title: '', type: '' }); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete report?')) return
    try { await billingService.compliance.reports.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDownload = async (id) => {
    try {
      const blob = await billingService.compliance.reports.download(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `report-${id}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="spinner-border" />
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(!showAdd)}><i className="fa-solid fa-plus me-1" />New Report</button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-3">
          <input className="form-control form-control-sm" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          <input className="form-control form-control-sm" placeholder="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
          <button type="submit" className="btn btn-sm btn-success">Create</button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}
      <div className="table-responsive">
        <table className="table table-sm table-bordered align-middle">
          <thead className="table-dark"><tr><th>Title</th><th>Type</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.title}</td><td>{r.type}</td><td>{formatDate(r.createdAt)}</td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleDownload(r.id)}><i className="fa-solid fa-download" /></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No reports.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PoliciesPanel() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    billingService.compliance.policies.list().then(setPolicies).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const handleSave = async (id) => {
    try {
      await billingService.compliance.policies.update(id, { value: editValue })
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, value: editValue } : p))
      setEditId(null)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="spinner-border" />
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div className="table-responsive">
      <table className="table table-sm table-bordered align-middle">
        <thead className="table-dark"><tr><th>Policy</th><th>Value</th><th>Actions</th></tr></thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id}>
              <td>{p.name || p.key}</td>
              <td>
                {editId === p.id
                  ? <input className="form-control form-control-sm" value={editValue} onChange={e => setEditValue(e.target.value)} />
                  : p.value}
              </td>
              <td>
                {editId === p.id ? (
                  <>
                    <button className="btn btn-sm btn-success me-1" onClick={() => handleSave(p.id)}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-outline-primary" onClick={() => { setEditId(p.id); setEditValue(p.value) }}><i className="fa-solid fa-pen" /></button>
                )}
              </td>
            </tr>
          ))}
          {policies.length === 0 && <tr><td colSpan={3} className="text-center text-muted">No policies.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
