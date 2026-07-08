import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import billingService from '../services/billingService'
import { formatDate } from '../../../utils/date'

export default function ComplianceManager() {
  const [tab, setTab] = useState('audit')
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">Compliance & Audit</h5>
          <small className="text-light font-monospace">Regulatory Management System</small>
        </div>
        <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
      </div>
      <ul className="nav mb-4 gap-1">
        {[['audit', 'Audit Logs'], ['reports', 'Reports'], ['policies', 'Policies']].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button
              className={`btn btn-sm rounded-0 font-monospace text-uppercase ${tab === key ? 'btn-info text-dark' : 'btn-outline-secondary text-light'}`}
              onClick={() => setTab(key)}
            >{label}</button>
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
const ENTITY_OPTIONS = ['All', 'User']

function AuditLogsPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [action, setAction] = useState('All')
  const [entityType, setEntityType] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [auditPreview, setAuditPreview] = useState(false)

  const buildParams = (a, e) => ({ ...(a !== 'All' && { Action: a }), ...(e !== 'All' && { EntityType: e }) })

  useEffect(() => {
    setLoading(true)
    billingService.compliance.auditLogs(buildParams(action, entityType))
      .then(setLogs).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [action, entityType])

  const handleExport = () => {
    if (!logs.length) return alert('No audit logs to export.')
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
    const W = doc.internal.pageSize.getWidth()

    doc.setFillColor(0, 188, 212)
    doc.rect(0, 0, W, 50, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('TravelEase — Audit Log Report', 40, 32)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - 40, 32, { align: 'right' })

    const cols = ['User', 'Action', 'Entity Type', 'Old Values', 'New Values', 'IP Address', 'Timestamp']
    const colWidths = [90, 70, 90, 140, 140, 100, 100]
    let y = 70
    const rowH = 18

    // Header
    doc.setFillColor(30, 30, 30)
    doc.rect(30, y, W - 60, rowH, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 188, 212)
    let x = 35
    cols.forEach((c, i) => { doc.text(c, x, y + 12); x += colWidths[i] })
    y += rowH

    const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : '-'
    doc.setFont('helvetica', 'normal')
    logs.forEach((l, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 30 }
      doc.setFillColor(idx % 2 === 0 ? 30 : 40, idx % 2 === 0 ? 30 : 40, idx % 2 === 0 ? 30 : 40)
      doc.rect(30, y, W - 60, rowH, 'F')
      doc.setTextColor(180, 180, 180)
      const row = [
        `#${l.auditLogId}`, l.userName || '-', l.action || '-', l.entityType || '-',
        fmt(l.oldValues), fmt(l.newValues), l.ipAddress || '-', formatDate(l.timestamp)
      ]
      x = 35
      row.forEach((val, i) => {
        const truncated = doc.splitTextToSize(val, colWidths[i] - 4)[0] || ''
        doc.text(truncated, x, y + 12)
        x += colWidths[i]
      })
      y += rowH
    })

    doc.setFillColor(0, 188, 212)
    doc.rect(0, doc.internal.pageSize.getHeight() - 25, W, 25, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('TravelEase — Regulatory Management System', W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })

    doc.save('audit-logs.pdf')
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-info" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {auditPreview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content bg-dark border-secondary rounded-0">
              <div className="modal-header border-secondary" style={{ background: '#00bcd4' }}>
                <h6 className="modal-title text-dark font-monospace text-uppercase fw-bold">
                  <i className="fa-solid fa-scroll me-2" />Audit Log Export Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setAuditPreview(false)} />
              </div>
              <div className="modal-body p-0">
                <table className="table table-dark table-sm align-middle mb-0 border-secondary">
                  <thead style={{ background: '#00bcd4' }}>
                    <tr>
                      {['User', 'Action', 'Entity Type', 'IP Address', 'Timestamp', 'New Values', 'Old Values'].map(h => (
                        <th key={h} className="font-monospace text-uppercase small border-secondary text-dark px-2 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => {
                      const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : v) : '-'
                      return (
                        <tr key={l.auditLogId} className="border-secondary">
                          <td className="text-secondary font-monospace border-secondary small px-2">{l.userName || '-'}</td>
                          <td className="text-secondary font-monospace border-secondary small px-2">{l.action || '-'}</td>
                          <td className="text-secondary font-monospace border-secondary small px-2">{l.entityType || '-'}</td>
                          <td className="text-secondary font-monospace border-secondary small px-2">{l.ipAddress || '-'}</td>
                          <td className="text-secondary font-monospace border-secondary small px-2">{formatDate(l.timestamp)}</td>
                          <td className="text-info font-monospace border-secondary small px-2" style={{ maxWidth: 160, wordBreak: 'break-all' }}>{fmt(l.newValues)}</td>
                          <td className="text-secondary font-monospace border-secondary small px-2" style={{ maxWidth: 160, wordBreak: 'break-all' }}>{fmt(l.oldValues)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer border-secondary">
                <small className="text-secondary font-monospace me-auto">{logs.length} record(s)</small>
                <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setAuditPreview(false)}>Close</button>
                <button className="btn btn-info btn-sm rounded-0 font-monospace text-dark" onClick={() => { handleExport(); setAuditPreview(false) }}>
                  <i className="fa-solid fa-file-pdf me-1" />Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex gap-2 justify-content-between mb-3 p-2 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div className="d-flex gap-2 align-items-center">
          <div className="d-flex align-items-center gap-1">
            <small className="text-secondary font-monospace text-nowrap">Action</small>
            <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" value={action} onChange={e => setAction(e.target.value)}>
              {ACTION_OPTIONS.map(o => <option key={o} className="bg-dark text-white">{o}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-1">
            <small className="text-secondary font-monospace text-nowrap">Entity</small>
            <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" value={entityType} onChange={e => setEntityType(e.target.value)}>
              {ENTITY_OPTIONS.map(o => <option key={o} className="bg-dark text-white">{o}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => { if (!logs.length) return alert('No audit logs to export.'); setAuditPreview(true) }}>
          <i className="fa-solid fa-file-pdf me-1" />Export
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">User</th>
              <th className="font-monospace text-uppercase small border-secondary">Action</th>
              <th className="font-monospace text-uppercase small border-secondary">Entity Type</th>
              <th className="font-monospace text-uppercase small border-secondary">IP Address</th>
              <th className="font-monospace text-uppercase small border-secondary">Timestamp</th>
              <th className="font-monospace text-uppercase small border-secondary">New Values</th>
              <th className="font-monospace text-uppercase small border-secondary">Old Values</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => {
              const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : v) : '-'
              const isExpanded = expandedId === l.auditLogId
              return (
                <tr key={l.auditLogId} className="border-secondary bg-dark">
                  <td className="text-secondary font-monospace border-secondary">{l.userName || '-'}</td>
                  <td className="text-secondary font-monospace border-secondary">{l.action || '-'}</td>
                  <td className="text-secondary font-monospace border-secondary">{l.entityType || '-'}</td>
                  <td className="text-secondary font-monospace border-secondary">{l.ipAddress || '-'}</td>
                  <td className="text-secondary font-monospace border-secondary">{formatDate(l.timestamp)}</td>
                  <td className="border-secondary">
                    <button className="btn btn-outline-info btn-sm rounded-0 font-monospace"
                      onClick={() => setExpandedId(isExpanded ? null : l.auditLogId)}>
                      <i className={`fa-solid ${isExpanded ? 'fa-eye-slash' : 'fa-eye'} me-1`} />
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-2 bg-secondary bg-opacity-10 border border-secondary rounded-0" style={{ maxWidth: 260, wordBreak: 'break-all', fontSize: 11 }}>
                        <span className="text-info font-monospace">{fmt(l.newValues)}</span>
                      </div>
                    )}
                  </td>
                  <td className="border-secondary">
                    <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace"
                      onClick={() => setExpandedId(isExpanded ? null : `old_${l.auditLogId}`)}>
                      <i className={`fa-solid ${expandedId === `old_${l.auditLogId}` ? 'fa-eye-slash' : 'fa-eye'} me-1`} />
                      {expandedId === `old_${l.auditLogId}` ? 'Hide' : 'View'}
                    </button>
                    {expandedId === `old_${l.auditLogId}` && (
                      <div className="mt-2 p-2 bg-secondary bg-opacity-10 border border-secondary rounded-0" style={{ maxWidth: 260, wordBreak: 'break-all', fontSize: 11 }}>
                        <span className="text-secondary font-monospace">{fmt(l.oldValues)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-scroll me-2"></i>
                  <span className="font-monospace">No audit logs found.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const cleanText = (text) => {
  if (!text) return '-'
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\{"AverageSpendPerTraveler":([\d.]+),"TotalTravelers":(\d+)\}/g,
      (_, avg, travelers) => `Average spend per traveler: $${parseFloat(avg).toLocaleString()} across ${travelers} traveler(s)`)
    .replace(/\[\{"ItemType":"([^"]+)","Count":(\d+),"TotalAmount":([\d.]+)\}\]/g,
      (_, type, count, total) => `Top booking: ${type} — ${count} booking(s) totalling $${parseFloat(total).toLocaleString()}`)
    .replace(/\[\{.*?\}\]/gs, (match) => {
      try {
        const arr = JSON.parse(match.replace(/&quot;/g, '"'))
        return arr.map(o => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(', ')).join(' | ')
      } catch { return match }
    })
    .replace(/\{.*?\}/gs, (match) => {
      try {
        const obj = JSON.parse(match.replace(/&quot;/g, '"'))
        return Object.entries(obj).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`).join(', ')
      } catch { return match }
    })
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function ReportsPanel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '' })
  const [preview, setPreview] = useState(null)

  const load = () => {
    setLoading(true)
    billingService.compliance.reports.list().then(setReports).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try { await billingService.compliance.reports.create(form); setShowAdd(false); setForm({ title: '' }); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete report?')) return
    try { await billingService.compliance.reports.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDownload = (r) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()
    const margin = 40
    const contentW = W - margin * 2

    doc.setFillColor(0, 188, 212)
    doc.rect(0, 0, W, 55, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('TravelEase — Compliance Report', margin, 35)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${formatDate(r.generatedDate)}`, W - margin, 35, { align: 'right' })

    let y = 75
    const section = (label, value) => {
      if (!value) return
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 188, 212)
      doc.text(label, margin, y)
      y += 18
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(cleanText(value), contentW)
      lines.forEach(line => {
        if (y > H - 50) { doc.addPage(); y = 40 }
        doc.text(line, margin, y)
        y += 14
      })
      y += 10
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, W - margin, y)
      y += 10
    }

    section('Report Title', r.title)
    section('Generated Date', formatDate(r.generatedDate))
    section('Scope', r.scope)
    section('Key Metrics', r.metrics)
    section('Report Summary', r.reportContent)

    doc.setFillColor(0, 188, 212)
    doc.rect(0, H - 25, W, 25, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('TravelEase — Regulatory Management System', W / 2, H - 8, { align: 'center' })

    doc.save(`${r.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    setPreview(null)
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-info" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark border-secondary rounded-0">
              <div className="modal-header border-secondary" style={{ background: '#00bcd4' }}>
                <h6 className="modal-title text-dark font-monospace text-uppercase fw-bold">
                  <i className="fa-solid fa-file-lines me-2" />Report Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body">
                {[['Report Title', preview.title], ['Generated Date', formatDate(preview.generatedDate)], ['Scope', preview.scope], ['Key Metrics', preview.metrics], ['Report Summary', preview.reportContent]].map(([label, val]) => (
                  <div key={label} className="mb-4">
                    <div className="text-info font-monospace text-uppercase small fw-bold mb-1">{label}</div>
                    <div className="text-light" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cleanText(val)}</div>
                    <hr className="border-secondary mt-2" />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-info btn-sm rounded-0 font-monospace text-dark" onClick={() => handleDownload(preview)}>
                  <i className="fa-solid fa-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={() => setShowAdd(!showAdd)}>
          <i className="fa-solid fa-plus me-2" />New Report
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-3 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
          <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" value={form.title} onChange={e => setForm({ title: e.target.value })} required>
            <option value="" className="bg-dark text-white">Select Report Type</option>
            <option value="Financial Billing Audit" className="bg-dark text-white">Financial Billing Audit</option>
            <option value="Privacy & GDPR Retention Report" className="bg-dark text-white">Privacy & GDPR Retention Report</option>
            <option value="General System Audit" className="bg-dark text-white">General System Audit</option>
          </select>
          <button type="submit" className="btn btn-outline-info btn-sm rounded-0 font-monospace">Generate</button>
          <button type="button" className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Title</th>
              <th className="font-monospace text-uppercase small border-secondary">Generated</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.complianceReportId} className="border-secondary bg-dark">
                <td className="text-secondary font-monospace border-secondary">{r.title}</td>
                <td className="text-secondary font-monospace border-secondary">{formatDate(r.generatedDate)}</td>
                <td className="border-secondary">
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-info rounded-0" title="Preview" onClick={() => setPreview(r)}><i className="fa-solid fa-eye" /></button>
                    <button className="btn btn-outline-secondary rounded-0" title="Download PDF" onClick={() => { setPreview(r) }}><i className="fa-solid fa-download" /></button>
                    <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(r.complianceReportId)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-file-lines me-2"></i>
                  <span className="font-monospace">No reports found.</span>
                </td>
              </tr>
            )}
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

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-info" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div className="table-responsive">
      <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
        <thead className="bg-info text-dark">
          <tr>
            <th className="font-monospace text-uppercase small border-secondary">Policy</th>
            <th className="font-monospace text-uppercase small border-secondary">Value</th>
            <th className="font-monospace text-uppercase small border-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id} className="border-secondary bg-dark">
              <td className="text-secondary font-monospace border-secondary">{p.name || p.key}</td>
              <td className="text-secondary font-monospace border-secondary">
                {editId === p.id
                  ? <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" value={editValue} onChange={e => setEditValue(e.target.value)} />
                  : p.value}
              </td>
              <td className="border-secondary">
                {editId === p.id ? (
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-info rounded-0 font-monospace" onClick={() => handleSave(p.id)}>Save</button>
                    <button className="btn btn-outline-secondary rounded-0 font-monospace" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-outline-info btn-sm rounded-0" onClick={() => { setEditId(p.id); setEditValue(p.value) }}>
                    <i className="fa-solid fa-pen" />
                  </button>
                )}
              </td>
            </tr>
          ))}
          {policies.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                <i className="fa-solid fa-shield-halved me-2"></i>
                <span className="font-monospace">No policies found.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
