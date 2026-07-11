import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import billingService from '../services/billingService'
import { formatDate } from '../../../utils/date'

// Purple Theme Constants
const PURPLE_PRIMARY = '#6f42c1'
const PURPLE_RGB = [111, 66, 193]
const PURPLE_LIGHT_RGB = [243, 238, 252]

export default function ComplianceManager() {
  const [tab, setTab] = useState('audit')
  return (
    <div className="bg-white p-3 rounded shadow-sm">
      <div 
        className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded-0"
        style={{ backgroundColor: PURPLE_LIGHT_RGB.reduce((acc, c) => acc + c + ',', 'rgba(').slice(0, -1) + ', 0.5)' }}
      >
        <div>
          <h5 className="text-uppercase mb-1 fw-bold" style={{ color: PURPLE_PRIMARY }}>Compliance & Audit</h5>
          <small className="text-muted">Regulatory Management System</small>
        </div>
        <div className="spinner-grow spinner-grow-sm" role="status" style={{ color: PURPLE_PRIMARY }}></div>
      </div>
      
      <ul className="nav mb-4 gap-1">
        {[
          ['audit', 'Audit Logs'],
          ['reports', 'Reports'],
          ['policies', 'Policies']
        ].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button
              className="btn btn-sm rounded-0 text-uppercase border transition-all"
              style={{
                backgroundColor: tab === key ? PURPLE_PRIMARY : 'transparent',
                color: tab === key ? '#fff' : '#6c757d',
                borderColor: tab === key ? PURPLE_PRIMARY : '#dee2e6'
              }}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
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

    doc.setFillColor(...PURPLE_RGB)
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
    doc.setFillColor(50, 50, 50)
    doc.rect(30, y, W - 60, rowH, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PURPLE_RGB)
    let x = 35
    cols.forEach((c, i) => { doc.text(c, x, y + 12); x += colWidths[i] })
    y += rowH

    const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : '-'
    doc.setFont('helvetica', 'normal')
    logs.forEach((l, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 30 }
      doc.setFillColor(idx % 2 === 0 ? 250 : 240, idx % 2 === 0 ? 250 : 240, idx % 2 === 0 ? 250 : 240)
      doc.rect(30, y, W - 60, rowH, 'F')
      doc.setTextColor(60, 60, 60)
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

    doc.setFillColor(...PURPLE_RGB)
    doc.rect(0, doc.internal.pageSize.getHeight() - 25, W, 25, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('TravelEase — Regulatory Management System', W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })

    doc.save('audit-logs.pdf')
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" style={{ color: PURPLE_PRIMARY }} /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {auditPreview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content bg-white border rounded-0">
              <div className="modal-header border-0" style={{ background: PURPLE_PRIMARY }}>
                <h6 className="modal-title text-white text-uppercase fw-bold">
                  <i className="fa-solid fa-scroll me-2" />Audit Log Export Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setAuditPreview(false)} />
              </div>
              <div className="modal-body p-0">
                <table className="table table-striped table-hover table-sm align-middle mb-0">
                  <thead>
                    <tr style={{ background: PURPLE_PRIMARY }}>
                      {['User', 'Action', 'Entity Type', 'IP Address', 'Timestamp', 'New Values', 'Old Values'].map(h => (
                        <th key={h} className="text-uppercase small text-white px-2 py-2 fw-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => {
                      const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : v) : '-'
                      return (
                        <tr key={l.auditLogId}>
                          <td className="text-dark small px-2">{l.userName || '-'}</td>
                          <td className="text-dark small px-2">{l.action || '-'}</td>
                          <td className="text-dark small px-2">{l.entityType || '-'}</td>
                          <td className="text-dark small px-2">{l.ipAddress || '-'}</td>
                          <td className="text-dark small px-2">{formatDate(l.timestamp)}</td>
                          <td className="small px-2" style={{ maxWidth: 160, wordBreak: 'break-all', color: PURPLE_PRIMARY }}>{fmt(l.newValues)}</td>
                          <td className="text-muted small px-2" style={{ maxWidth: 160, wordBreak: 'break-all' }}>{fmt(l.oldValues)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer border-top">
                <small className="text-muted me-auto">{logs.length} record(s)</small>
                <button className="btn btn-outline-secondary btn-sm rounded-0" onClick={() => setAuditPreview(false)}>Close</button>
                <button className="btn btn-sm rounded-0 text-white" style={{ backgroundColor: PURPLE_PRIMARY }} onClick={() => { handleExport(); setAuditPreview(false) }}>
                  <i className="fa-solid fa-file-pdf me-1" />Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex gap-2 justify-content-between mb-3 p-2 bg-light border rounded-0">
        <div className="d-flex gap-2 align-items-center">
          <div className="d-flex align-items-center gap-1">
            <small className="text-muted text-nowrap">Action</small>
            <select className="form-select form-select-sm bg-white text-dark border rounded-0" value={action} onChange={e => setAction(e.target.value)}>
              {ACTION_OPTIONS.map(o => <option key={o} className="bg-white text-dark">{o}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-1">
            <small className="text-muted text-nowrap">Entity</small>
            <select className="form-select form-select-sm bg-white text-dark border rounded-0" value={entityType} onChange={e => setEntityType(e.target.value)}>
              {ENTITY_OPTIONS.map(o => <option key={o} className="bg-white text-dark">{o}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-outline-secondary btn-sm rounded-0" onClick={() => { if (!logs.length) return alert('No audit logs to export.'); setAuditPreview(true) }}>
          <i className="fa-solid fa-file-pdf me-1" />Export
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle rounded-0 border">
          <thead className="text-white" style={{ backgroundColor: PURPLE_PRIMARY }}>
            <tr>
              <th className="text-uppercase small border-0">User</th>
              <th className="text-uppercase small border-0">Action</th>
              <th className="text-uppercase small border-0">Entity Type</th>
              <th className="text-uppercase small border-0">IP Address</th>
              <th className="text-uppercase small border-0">Timestamp</th>
              <th className="text-uppercase small border-0">New Values</th>
              <th className="text-uppercase small border-0">Old Values</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => {
              const fmt = v => v ? (typeof v === 'object' ? JSON.stringify(v) : v) : '-'
              const isExpanded = expandedId === l.auditLogId
              return (
                <tr key={l.auditLogId} className="bg-white">
                  <td className="text-dark">{l.userName || '-'}</td>
                  <td className="text-dark">{l.action || '-'}</td>
                  <td className="text-dark">{l.entityType || '-'}</td>
                  <td className="text-dark">{l.ipAddress || '-'}</td>
                  <td className="text-dark">{formatDate(l.timestamp)}</td>
                  <td>
                    <button className="btn btn-sm rounded-0 border"
                      style={{ color: PURPLE_PRIMARY, borderColor: PURPLE_PRIMARY }}
                      onClick={() => setExpandedId(isExpanded ? null : l.auditLogId)}>
                      <i className={`fa-solid ${isExpanded ? 'fa-eye-slash' : 'fa-eye'} me-1`} />
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-2 bg-light border rounded-0" style={{ maxWidth: 260, wordBreak: 'break-all', fontSize: 11 }}>
                        <span className="fw-medium" style={{ color: PURPLE_PRIMARY }}>{fmt(l.newValues)}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-outline-secondary btn-sm rounded-0"
                      onClick={() => setExpandedId(isExpanded ? null : `old_${l.auditLogId}`)}>
                      <i className={`fa-solid ${expandedId === `old_${l.auditLogId}` ? 'fa-eye-slash' : 'fa-eye'} me-1`} />
                      {expandedId === `old_${l.auditLogId}` ? 'Hide' : 'View'}
                    </button>
                    {expandedId === `old_${l.auditLogId}` && (
                      <div className="mt-2 p-2 bg-light border rounded-0" style={{ maxWidth: 260, wordBreak: 'break-all', fontSize: 11 }}>
                        <span className="text-muted">{fmt(l.oldValues)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted bg-light border-0 py-4">
                  <i className="fa-solid fa-scroll me-2"></i>
                  <span>No audit logs found.</span>
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

    doc.setFillColor(...PURPLE_RGB)
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
      doc.setTextColor(...PURPLE_RGB)
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
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, W - margin, y)
      y += 10
    }

    section('Report Title', r.title)
    section('Generated Date', formatDate(r.generatedDate))
    section('Scope', r.scope)
    section('Key Metrics', r.metrics)
    section('Report Summary', r.reportContent)

    doc.setFillColor(...PURPLE_RGB)
    doc.rect(0, H - 25, W, 25, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('TravelEase — Regulatory Management System', W / 2, H - 8, { align: 'center' })

    doc.save(`${r.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    setPreview(null)
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" style={{ color: PURPLE_PRIMARY }} /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-white border rounded-0">
              <div className="modal-header border-0" style={{ background: PURPLE_PRIMARY }}>
                <h6 className="modal-title text-white text-uppercase fw-bold">
                  <i className="fa-solid fa-file-lines me-2" />Report Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body bg-white text-dark">
                {[['Report Title', preview.title], ['Generated Date', formatDate(preview.generatedDate)], ['Scope', preview.scope], ['Key Metrics', preview.metrics], ['Report Summary', preview.reportContent]].map(([label, val]) => (
                  <div key={label} className="mb-4">
                    <div className="text-uppercase small fw-bold mb-1" style={{ color: PURPLE_PRIMARY }}>{label}</div>
                    <div className="text-dark" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cleanText(val)}</div>
                    <hr className="mt-2" />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-top">
                <button className="btn btn-outline-secondary btn-sm rounded-0" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-sm rounded-0 text-white" style={{ backgroundColor: PURPLE_PRIMARY }} onClick={() => handleDownload(preview)}>
                  <i className="fa-solid fa-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-sm rounded-0 text-uppercase text-white" style={{ backgroundColor: PURPLE_PRIMARY }} onClick={() => setShowAdd(!showAdd)}>
          <i className="fa-solid fa-plus me-2" />New Report
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-3 p-3 bg-light border rounded-0">
          <select className="form-select form-select-sm bg-white text-dark border rounded-0" value={form.title} onChange={e => setForm({ title: e.target.value })} required>
            <option value="" className="bg-white text-dark">Select Report Type</option>
            <option value="Financial Billing Audit" className="bg-white text-dark">Financial Billing Audit</option>
            <option value="Privacy & GDPR Retention Report" className="bg-white text-dark">Privacy & GDPR Retention Report</option>
            <option value="General System Audit" className="bg-white text-dark">General System Audit</option>
          </select>
          <button type="submit" className="btn btn-sm rounded-0 text-white" style={{ backgroundColor: PURPLE_PRIMARY }}>Generate</button>
          <button type="button" className="btn btn-outline-secondary btn-sm rounded-0" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}
      <div className="table-responsive">
        <table className="table table-hover align-middle rounded-0 border">
          <thead className="text-white" style={{ backgroundColor: PURPLE_PRIMARY }}>
            <tr>
              <th className="text-uppercase small border-0">Title</th>
              <th className="text-uppercase small border-0">Generated</th>
              <th className="text-uppercase small border-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.complianceReportId} className="bg-white">
                <td className="text-dark">{r.title}</td>
                <td className="text-dark">{formatDate(r.generatedDate)}</td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-secondary rounded-0" title="Preview" style={{ color: PURPLE_PRIMARY }} onClick={() => setPreview(r)}><i className="fa-solid fa-eye" /></button>
                    <button className="btn btn-outline-secondary rounded-0" title="Download PDF" onClick={() => handleDownload(r)}><i className="fa-solid fa-download" /></button>
                    <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(r.complianceReportId)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted bg-light py-4">
                  <i className="fa-solid fa-file-lines me-2"></i>
                  <span>No reports found.</span>
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

  if (loading) return <div className="text-center py-4"><div className="spinner-border" style={{ color: PURPLE_PRIMARY }} /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle rounded-0 border">
        <thead className="text-white" style={{ backgroundColor: PURPLE_PRIMARY }}>
          <tr>
            <th className="text-uppercase small border-0">Policy</th>
            <th className="text-uppercase small border-0">Value</th>
            <th className="text-uppercase small border-0">Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id} className="bg-white">
              <td className="text-dark">{p.name || p.key}</td>
              <td className="text-dark">
                {editId === p.id
                  ? <input className="form-control form-control-sm bg-white text-dark border rounded-0" value={editValue} onChange={e => setEditValue(e.target.value)} />
                  : p.value}
              </td>
              <td>
                {editId === p.id ? (
                  <div className="btn-group btn-group-sm">
                    <button className="btn rounded-0 text-white" style={{ backgroundColor: PURPLE_PRIMARY }} onClick={() => handleSave(p.id)}>Save</button>
                    <button className="btn btn-outline-secondary rounded-0" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-sm rounded-0 border" style={{ color: PURPLE_PRIMARY, borderColor: PURPLE_PRIMARY }} onClick={() => { setEditId(p.id); setEditValue(p.value) }}>
                    <i className="fa-solid fa-pen" />
                  </button>
                )}
              </td>
            </tr>
          ))}
          {policies.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-muted bg-light py-4">
                <i className="fa-solid fa-shield-halved me-2"></i>
                <span>No policies found.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}