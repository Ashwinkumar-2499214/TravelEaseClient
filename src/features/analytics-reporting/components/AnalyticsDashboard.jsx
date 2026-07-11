import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import analyticsService from '../services/analyticsService'
import { formatDate } from '../../../utils/date'

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('live')
  
  return (
    <div className="bg-white text-dark p-4 rounded shadow-sm border border-light">
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        {[
          ['live', 'Live Dashboard', 'fa-bolt'], 
          ['trends', 'Trends', 'fa-chart-line'], 
          ['kpi', 'KPI Reports', 'fa-file-invoice-dollar']
        ].map(([key, label, icon]) => (
          <li className="nav-item" key={key}>
            <button
              className={`btn btn-sm rounded px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${
                tab === key 
                  ? 'btn-purple text-white shadow-sm' 
                  : 'btn-outline-purple bg-light text-purple border-0'
              }`}
              onClick={() => setTab(key)}
            >
              <i className={`fa-solid ${icon}`} />
              {label}
            </button>
          </li>
        ))}
      </ul>
      
      {tab === 'live' && <LiveDashboard />}
      {tab === 'trends' && <TrendsPanel />}
      {tab === 'kpi' && <KpiReportsPanel />}
      
      {/* Scope-contained Custom CSS for Purple Theme Overrides */}
      <style>{`
        .btn-purple {
          background-color: #6f42c1 !important;
          border-color: #6f42c1 !important;
          color: #fff !important;
        }
        .btn-purple:hover {
          background-color: #59339e !important;
          border-color: #59339e !important;
        }
        .text-purple {
          color: #6f42c1 !important;
        }
        .btn-outline-purple {
          color: #6f42c1 !important;
          background-color: transparent;
          border: 1px solid #6f42c1;
        }
        .btn-outline-purple:hover {
          background-color: #f3ebff !important;
          color: #59339e !important;
        }
        .bg-purple-light {
          background-color: #f8f5fe !important;
        }
        .border-purple-light {
          border-color: #e8dff5 !important;
        }
        .table-purple-header th {
          background-color: #6f42c1 !important;
          color: #ffffff !important;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color = 'primary' }) {
  // Map standard colors to purple-friendly accent pairs
  const colorMap = {
    success: { text: 'text-success', bg: 'rgba(40, 167, 69, 0.1)' },
    danger: { text: 'text-danger', bg: 'rgba(220, 53, 69, 0.1)' },
    warning: { text: 'text-warning', bg: 'rgba(255, 193, 7, 0.15)' },
    info: { text: 'text-purple', bg: '#f3ebff' },
    primary: { text: 'text-purple', bg: '#f3ebff' }
  }
  const theme = colorMap[color] || colorMap.primary

  return (
    <div className="col-md-4 mb-4">
      <div className="p-4 bg-white border border-purple-light rounded shadow-sm h-100 transition-all hover-shadow">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: theme.bg, width: 56, height: 56 }}>
            <i className={`${icon} fa-xl ${theme.text}`} />
          </div>
          <div className="flex-grow-1">
            <div className="text-muted fw-medium small text-uppercase tracking-wider mb-1">{title}</div>
            <div className="fs-3 fw-bold text-dark">
              {value ?? <div className="spinner-border spinner-border-sm text-purple" />}
            </div>
            {sub && <div className="text-muted mt-1 small">{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveDashboard() {
  const [filter, setFilter] = useState('month')
  const [liveTab, setLiveTab] = useState('overview')
  const [data, setData] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData({})
    setErrors({})
    const setValue = (key) => (val) => setData((prev) => ({ ...prev, [key]: val }))
    const setError = (key) => () => setErrors((prev) => ({ ...prev, [key]: true }))

    Promise.allSettled([
      analyticsService.dashboards.travelSpend(filter).then(setValue('spend')).catch(setError('spend')),
      analyticsService.dashboards.bookingVolume(filter).then(setValue('volume')).catch(setError('volume')),
      analyticsService.dashboards.cancellations(filter).then(setValue('cancel')).catch(setError('cancel')),
      analyticsService.dashboards.avgBookingValue(filter).then(setValue('avg')).catch(setError('avg')),
      analyticsService.dashboards.topSpenders(filter).then(setValue('spenders')).catch(setError('spenders')),
      analyticsService.dashboards.revenueByType(filter).then(setValue('revenue')).catch(setError('revenue')),
    ]).finally(() => setLoading(false))
  }, [filter])

  const period = data.spend?.period || data.volume?.period || data.cancel?.period || '—'
  const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n) => Number(n ?? 0).toLocaleString()

  const spenders = Array.isArray(data.spenders?.data) ? data.spenders.data : []
  const revenueRows = Array.isArray(data.revenue?.data) ? data.revenue.data : []

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 p-3 bg-purple-light border border-purple-light rounded">
        <span className="text-muted fw-medium">Active Period: <strong className="text-purple">{loading ? 'Loading...' : period}</strong></span>
        <div className="btn-group rounded shadow-sm">
          {['week', 'month'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm px-3 fw-semibold text-uppercase ${filter === f ? 'btn-purple' : 'btn-white bg-white border text-muted'}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="nav nav-tabs border-bottom-0 gap-1">
          {[
            ['overview', 'Overview Visuals'],
            ['details', 'Tabular Breakdowns'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`nav-link border-0 px-3 py-2 fw-semibold rounded-top ${liveTab === key ? 'bg-purple-light text-purple border-bottom border-2 border-purple' : 'text-muted bg-transparent'}`}
              onClick={() => setLiveTab(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-purple" /></div>
      ) : (
        <>
          {liveTab === 'overview' && (
            <div className="row">
              <StatCard
                title="Total Travel Spend"
                value={errors.spend ? 'N/A' : `$${fmt(data.spend?.totalAmount)}`}
                sub={data.spend ? `${fmtInt(data.spend.totalCount)} booking(s)` : null}
                icon="fa-solid fa-wallet"
                color="success"
              />
              <StatCard
                title="Booking Volume"
                value={errors.volume ? 'N/A' : fmtInt(data.volume?.totalAmount)}
                sub={data.volume ? `${fmtInt(data.volume.totalCount)} confirmed · ${data.volume.data?.confirmationRate ?? 0}% rate` : null}
                icon="fa-solid fa-passport"
                color="info"
              />
              <StatCard
                title="Cancellations"
                value={errors.cancel ? 'N/A' : fmtInt(data.cancel?.totalAmount)}
                sub={data.cancel ? `of ${fmtInt(data.cancel.totalCount)} total · ${data.cancel.data?.cancellationRate ?? 0}% rate` : null}
                icon="fa-solid fa-rectangle-xmark"
                color="danger"
              />
              <StatCard
                title="Avg Booking Value"
                value={errors.avg ? 'N/A' : `$${fmt(data.avg?.totalAmount)}`}
                sub={data.avg ? `across ${fmtInt(data.avg.totalCount)} booking(s)` : null}
                icon="fa-solid fa-calculator"
                color="warning"
              />
              <StatCard
                title="Top Spenders Value"
                value={errors.spenders ? 'N/A' : `$${fmt(data.spenders?.totalAmount)}`}
                sub={data.spenders ? `${fmtInt(data.spenders.totalCount)} unique traveler(s)` : null}
                icon="fa-solid fa-award"
                color="info"
              />
              <StatCard
                title="Revenue By Type"
                value={errors.revenue ? 'N/A' : `$${fmt(data.revenue?.totalAmount)}`}
                sub={data.revenue ? `across ${fmtInt(data.revenue.totalCount)} categories` : null}
                icon="fa-solid fa-pie-chart"
                color="success"
              />
            </div>
          )}

          {liveTab === 'details' && (
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="bg-white border border-purple-light rounded shadow-sm overflow-hidden">
                  <div className="p-3 bg-purple-light border-bottom border-purple-light">
                    <h6 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-users text-purple" /> Top Spenders Summary
                    </h6>
                  </div>
                  <table className="table align-middle mb-0">
                    <thead className="table-purple-header">
                      <tr>
                        <th className="px-3 py-2 small">User Identifier</th>
                        <th className="py-2 small">Bookings</th>
                        <th className="py-2 small text-end px-3">Total Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spenders.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">No data metrics available</td>
                        </tr>
                      ) : (
                        spenders.map((s, i) => (
                          <tr key={i} className="border-bottom border-light">
                            <td className="text-dark fw-medium px-3">User #{s.userId}</td>
                            <td className="text-muted">{s.bookingCount} items</td>
                            <td className="text-purple fw-bold text-end px-3">${fmt(s.totalSpend)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div className="bg-white border border-purple-light rounded shadow-sm overflow-hidden">
                  <div className="p-3 bg-purple-light border-bottom border-purple-light">
                    <h6 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-tags text-purple" /> Revenue by Booking Option
                    </h6>
                  </div>
                  <table className="table align-middle mb-0">
                    <thead className="table-purple-header">
                      <tr>
                        <th className="px-3 py-2 small">Category Option</th>
                        <th className="py-2 small">Bookings</th>
                        <th className="py-2 small text-end px-3">Revenue Segment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">No data metrics available</td>
                        </tr>
                      ) : (
                        revenueRows.map((r, i) => (
                          <tr key={i} className="border-bottom border-light">
                            <td className="text-dark fw-medium px-3 text-capitalize">{r.itemType || '-'}</td>
                            <td className="text-muted">{r.count} global</td>
                            <td className="text-purple fw-bold text-end px-3">${fmt(r.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TrendsPanel() {
  const [spendTrend, setSpendTrend] = useState(null)
  const [destTrend, setDestTrend] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      analyticsService.trends.spendPerTraveler(),
      analyticsService.trends.destinations(),
    ])
      .then(([s, d]) => {
        setSpendTrend(s)
        setDestTrend(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-purple" /></div>
  if (error) return <div className="alert alert-danger my-3">{error}</div>

  const spendData = spendTrend?.trendData || {}
  const destData = Array.isArray(destTrend?.trendData) ? destTrend.trendData : []

  return (
    <div className="row">
      <div className="col-md-5 mb-4">
        <div className="bg-white border border-purple-light rounded shadow-sm h-100 overflow-hidden">
          <div className="p-3 bg-purple-light border-bottom border-purple-light">
            <h6 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fa-solid fa-chart-bar text-purple" /> Spend Per Individual
            </h6>
            <small className="text-muted">{spendTrend?.trendType} Segment · {formatDate(spendTrend?.period)}</small>
          </div>
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded border border-light">
              <span className="text-muted small fw-semibold text-uppercase">Average Outlay</span>
              <span className="text-purple fw-bold fs-5">
                ${Number(spendData.averageSpendPerTraveler ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded border border-light">
              <span className="text-muted small fw-semibold text-uppercase">Total Profile Base</span>
              <span className="text-dark fw-bold fs-5">{spendData.totalTravelers ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-7 mb-4">
        <div className="bg-white border border-purple-light rounded shadow-sm h-100 overflow-hidden">
          <div className="p-3 bg-purple-light border-bottom border-purple-light">
            <h6 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fa-solid fa-globe text-purple" /> Leading Global Destinations
            </h6>
            <small className="text-muted">{destTrend?.trendType} Segment · {formatDate(destTrend?.period)}</small>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-purple-header">
                <tr>
                  <th className="px-3 py-2 small">Target Hub</th>
                  <th className="py-2 small">Volume</th>
                  <th className="py-2 small text-end px-3">Accumulated Total</th>
                </tr>
              </thead>
              <tbody>
                {destData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-4">No destination metrics available</td>
                  </tr>
                ) : destData.map((d, i) => (
                  <tr key={i} className="border-bottom border-light">
                    <td className="text-dark fw-medium px-3 text-capitalize">{d.itemType || '-'}</td>
                    <td className="text-muted">{d.count} actions</td>
                    <td className="text-purple fw-bold text-end px-3">${Number(d.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const KPI_TITLES = [
  'Travel Spend Overview',
  'Booking Performance Report',
  'Cancellation Rate Analysis',
]

function downloadKpiPdf(r) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = W - margin * 2

  // Purple primary brand header matching application (#6f42c1 -> RGB 111, 66, 193)
  doc.setFillColor(111, 66, 193)
  doc.rect(0, 0, W, 55, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('TravelEase — KPI Report', margin, 35)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${formatDate(r.generatedDate)}`, W - margin, 35, { align: 'right' })

  let y = 75
  const section = (label, value) => {
    if (!value) return
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(111, 66, 193)
    doc.text(label, margin, y)
    y += 18
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(String(value), contentW)
    lines.forEach((line) => {
      if (y > H - 50) { doc.addPage(); y = 40 }
      doc.text(line, margin, y)
      y += 14
    })
    y += 10
    doc.setDrawColor(230, 220, 245)
    doc.line(margin, y, W - margin, y)
    y += 10
  }

  section('Report Title', r.title)
  section('Generated Date', formatDate(r.generatedDate))
  section('Scope', r.scope)
  section('Key Metrics', r.metrics)
  section('Report Content', r.reportContent)

  doc.setFillColor(111, 66, 193)
  doc.rect(0, H - 25, W, 25, 'F')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('TravelEase — Analytics & Reporting', W / 2, H - 8, { align: 'center' })

  doc.save(`kpi-report-${r.kpiReportId}.pdf`)
}

function KpiReportsPanel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '' })
  const [preview, setPreview] = useState(null)

  const load = () => {
    setLoading(true)
    analyticsService.kpiReports.list().then(setReports).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await analyticsService.kpiReports.create({ title: form.title })
      setShowAdd(false)
      setForm({ title: '' })
      load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this metric entry permanently?')) return
    try { await analyticsService.kpiReports.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const openPreview = async (r) => {
    try {
      const full = await analyticsService.kpiReports.getById(r.kpiReportId)
      setPreview(full)
    } catch { setPreview(r) }
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-purple" /></div>
  if (error) return <div className="alert alert-danger my-3">{error}</div>

  return (
    <div>
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(25, 15, 40, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content bg-white border-0 shadow-lg rounded">
              <div className="modal-header text-white" style={{ background: '#6f42c1' }}>
                <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="fa-solid fa-file-invoice" /> KPI Comprehensive Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body p-4">
                {[
                  ['Report Title', preview.title], 
                  ['Generated Date', formatDate(preview.generatedDate)], 
                  ['Scope Context', preview.scope], 
                  ['Primary Metrics', preview.metrics], 
                  ['Report Content Breakdown', preview.reportContent]
                ].map(([label, val]) => (
                  <div key={label} className="mb-4">
                    <div className="text-purple small fw-bold text-uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-dark" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{val || 'No information provided'}</div>
                    <hr className="text-muted opacity-25 mt-3" />
                  </div>
                ))}
              </div>
              <div className="modal-footer bg-light border-top-0">
                <button className="btn btn-sm btn-outline-secondary px-3" onClick={() => setPreview(null)}>Dismiss</button>
                <button className="btn btn-sm btn-purple px-3 d-flex align-items-center gap-2" onClick={() => { downloadKpiPdf(preview); setPreview(null) }}>
                  <i className="fa-solid fa-file-arrow-down" /> Export Document File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-purple btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm" onClick={() => setShowAdd(!showAdd)}>
          <i className="fa-solid fa-plus-circle" /> Initialize KPI Generation
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-4 p-3 bg-purple-light border border-purple-light rounded shadow-sm">
          <select className="form-select form-select-sm border-purple-light bg-white text-dark" value={form.title} onChange={e => setForm({ title: e.target.value })} required>
            <option value="">Choose Target Analysis Document Variant</option>
            {KPI_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit" className="btn btn-purple btn-sm px-3 fw-semibold text-nowrap">Compile</button>
          <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={() => setShowAdd(false)}>Abort</button>
        </form>
      )}

      <div className="bg-white border border-purple-light rounded shadow-sm overflow-hidden">
        <table className="table align-middle mb-0">
          <thead className="table-purple-header">
            <tr>
              <th className="px-3 py-3 small">Document Summary Title</th>
              <th className="py-3 small">Compilation Timestamp</th>
              <th className="py-3 small text-center" style={{ width: 140 }}>Control Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.kpiReportId} className="border-bottom border-light">
                <td className="text-dark fw-medium px-3">{r.title}</td>
                <td className="text-muted">{formatDate(r.generatedDate)}</td>
                <td>
                  <div className="d-flex justify-content-center gap-1">
                    <button className="btn btn-sm btn-outline-purple border-0 rounded-circle" style={{ width: 32, height: 32, p: 0 }} title="Preview Data View" onClick={() => openPreview(r)}>
                      <i className="fa-solid fa-eye" />
                    </button>
                    <button className="btn btn-sm btn-outline-purple border-0 rounded-circle" style={{ width: 32, height: 32, p: 0 }} title="Download Raw PDF" onClick={() => openPreview(r)}>
                      <i className="fa-solid fa-file-arrow-down" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" style={{ width: 32, height: 32, p: 0 }} title="Remove Entry" onClick={() => handleDelete(r.kpiReportId)}>
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-5 bg-purple-light bg-opacity-25">
                  <div className="mb-2"><i className="fa-solid fa-folder-open fa-2x text-purple opacity-50" /></div>
                  <span className="small">No active KPI metrics reports have been successfully generated yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}