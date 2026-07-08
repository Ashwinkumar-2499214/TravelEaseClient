import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import analyticsService from '../services/analyticsService'
import { formatDate } from '../../../utils/date'

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('live')
  return (
    <div>
      <ul className="nav mb-4 gap-1">
        {[['live', 'Live Dashboard'], ['trends', 'Trends'], ['kpi', 'KPI Reports']].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button
              className={`btn btn-sm rounded-0 font-monospace text-uppercase ${tab === key ? 'btn-info text-dark' : 'btn-outline-secondary text-light'}`}
              onClick={() => setTab(key)}
            >{label}</button>
          </li>
        ))}
      </ul>
      {tab === 'live' && <LiveDashboard />}
      {tab === 'trends' && <TrendsPanel />}
      {tab === 'kpi' && <KpiReportsPanel />}
    </div>
  )
}

function StatCard({ title, value, sub, icon, color = 'info' }) {
  return (
    <div className="col-md-4 mb-3">
      <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-0 h-100">
        <div className="d-flex align-items-center gap-3">
          <i className={`${icon} fa-2x text-${color}`} />
          <div>
            <div className="text-secondary font-monospace text-uppercase small">{title}</div>
            <div className="fs-4 fw-bold text-white font-monospace">
              {value ?? <span className="spinner-border spinner-border-sm text-info" />}
            </div>
            {sub && <div className="text-secondary font-monospace" style={{ fontSize: 11 }}>{sub}</div>}
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
      <div className="d-flex align-items-center justify-content-between mb-3 p-2 bg-secondary bg-opacity-10 border border-secondary rounded-0">
        <small className="text-secondary font-monospace">Period: <span className="text-info">{loading ? '...' : period}</span></small>
        <div className="d-flex gap-1">
          {['week', 'month'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm rounded-0 font-monospace text-uppercase ${filter === f ? 'btn-info text-dark' : 'btn-outline-secondary text-light'}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="btn-group" role="group">
          {[
            ['overview', 'Overview'],
            ['details', 'Detail View'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm rounded-0 font-monospace text-uppercase ${liveTab === key ? 'btn-info text-dark' : 'btn-outline-secondary text-light'}`}
              onClick={() => setLiveTab(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-info" /></div>
      ) : (
        <>
          {liveTab === 'overview' && (
            <div className="row">
              <StatCard
                title="Total Travel Spend"
                value={errors.spend ? 'N/A' : `$${fmt(data.spend?.totalAmount)}`}
                sub={data.spend ? `${fmtInt(data.spend.totalCount)} booking(s)` : null}
                icon="fa-solid fa-dollar-sign"
                color="success"
              />
              <StatCard
                title="Booking Volume"
                value={errors.volume ? 'N/A' : fmtInt(data.volume?.totalAmount)}
                sub={data.volume ? `${fmtInt(data.volume.totalCount)} confirmed · ${data.volume.data?.confirmationRate ?? 0}% rate` : null}
                icon="fa-solid fa-suitcase"
                color="info"
              />
              <StatCard
                title="Cancellations"
                value={errors.cancel ? 'N/A' : fmtInt(data.cancel?.totalAmount)}
                sub={data.cancel ? `of ${fmtInt(data.cancel.totalCount)} total · ${data.cancel.data?.cancellationRate ?? 0}% rate` : null}
                icon="fa-solid fa-ban"
                color="danger"
              />
              <StatCard
                title="Avg Booking Value"
                value={errors.avg ? 'N/A' : `$${fmt(data.avg?.totalAmount)}`}
                sub={data.avg ? `across ${fmtInt(data.avg.totalCount)} booking(s)` : null}
                icon="fa-solid fa-chart-simple"
                color="warning"
              />
              <StatCard
                title="Top Spenders"
                value={errors.spenders ? 'N/A' : `$${fmt(data.spenders?.totalAmount)}`}
                sub={data.spenders ? `${fmtInt(data.spenders.totalCount)} unique traveler(s)` : null}
                icon="fa-solid fa-crown"
                color="info"
              />
              <StatCard
                title="Revenue by Type"
                value={errors.revenue ? 'N/A' : `$${fmt(data.revenue?.totalAmount)}`}
                sub={data.revenue ? `across ${fmtInt(data.revenue.totalCount)} booking type(s)` : null}
                icon="fa-solid fa-coins"
                color="success"
              />
            </div>
          )}

          {liveTab === 'details' && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="bg-secondary bg-opacity-10 border border-secondary rounded-0">
                  <div className="p-3 border-bottom border-secondary">
                    <h6 className="text-white font-monospace text-uppercase mb-0">
                      <i className="fa-solid fa-crown me-2 text-info" />Top Spenders
                    </h6>
                  </div>
                  <table className="table table-dark table-sm table-hover align-middle mb-0 border-secondary">
                    <thead style={{ background: '#00bcd4' }}>
                      <tr>
                        <th className="font-monospace text-uppercase small border-secondary text-dark px-3">User ID</th>
                        <th className="font-monospace text-uppercase small border-secondary text-dark">Bookings</th>
                        <th className="font-monospace text-uppercase small border-secondary text-dark">Total Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spenders.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-secondary font-monospace border-secondary py-3">No spender data available</td>
                        </tr>
                      ) : (
                        spenders.map((s, i) => (
                          <tr key={i} className="border-secondary">
                            <td className="text-secondary font-monospace border-secondary px-3">#{s.userId}</td>
                            <td className="text-info font-monospace border-secondary">{s.bookingCount}</td>
                            <td className="text-success font-monospace border-secondary">${fmt(s.totalSpend)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-secondary bg-opacity-10 border border-secondary rounded-0">
                  <div className="p-3 border-bottom border-secondary">
                    <h6 className="text-white font-monospace text-uppercase mb-0">
                      <i className="fa-solid fa-coins me-2 text-info" />Revenue by Booking Type
                    </h6>
                  </div>
                  <table className="table table-dark table-sm table-hover align-middle mb-0 border-secondary">
                    <thead style={{ background: '#00bcd4' }}>
                      <tr>
                        <th className="font-monospace text-uppercase small border-secondary text-dark px-3">Type</th>
                        <th className="font-monospace text-uppercase small border-secondary text-dark">Bookings</th>
                        <th className="font-monospace text-uppercase small border-secondary text-dark">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-secondary font-monospace border-secondary py-3">No revenue data available</td>
                        </tr>
                      ) : (
                        revenueRows.map((r, i) => (
                          <tr key={i} className="border-secondary">
                            <td className="text-secondary font-monospace border-secondary px-3">{r.itemType || '-'}</td>
                            <td className="text-info font-monospace border-secondary">{r.count}</td>
                            <td className="text-success font-monospace border-secondary">${fmt(r.revenue)}</td>
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

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-info" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  const spendData = spendTrend?.trendData || {}
  const destData = Array.isArray(destTrend?.trendData) ? destTrend.trendData : []

  return (
    <div className="row">
      <div className="col-md-5 mb-3">
        <div className="bg-secondary bg-opacity-10 border border-secondary rounded-0 h-100">
          <div className="p-3 border-bottom border-secondary">
            <h6 className="text-white font-monospace text-uppercase mb-0">
              <i className="fa-solid fa-user-tie me-2 text-info" />Spend Per Traveler
            </h6>
            <small className="text-secondary font-monospace">{spendTrend?.trendType} · {formatDate(spendTrend?.period)}</small>
          </div>
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-dark border border-secondary rounded-0">
              <span className="text-secondary font-monospace small text-uppercase">Avg Spend / Traveler</span>
              <span className="text-success fw-bold font-monospace">
                ${Number(spendData.averageSpendPerTraveler ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center p-2 bg-dark border border-secondary rounded-0">
              <span className="text-secondary font-monospace small text-uppercase">Total Travelers</span>
              <span className="text-info fw-bold font-monospace">{spendData.totalTravelers ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-7 mb-3">
        <div className="bg-secondary bg-opacity-10 border border-secondary rounded-0 h-100">
          <div className="p-3 border-bottom border-secondary">
            <h6 className="text-white font-monospace text-uppercase mb-0">
              <i className="fa-solid fa-map-location-dot me-2 text-info" />Top Destinations
            </h6>
            <small className="text-secondary font-monospace">{destTrend?.trendType} · {formatDate(destTrend?.period)}</small>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-sm table-hover align-middle mb-0 rounded-0 border-secondary">
              <thead style={{ background: '#00bcd4' }}>
                <tr>
                  <th className="font-monospace text-uppercase small border-secondary text-dark">Item Type</th>
                  <th className="font-monospace text-uppercase small border-secondary text-dark">Bookings</th>
                  <th className="font-monospace text-uppercase small border-secondary text-dark">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {destData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                      <span className="font-monospace">No destination data available.</span>
                    </td>
                  </tr>
                ) : destData.map((d, i) => (
                  <tr key={i} className="border-secondary bg-dark">
                    <td className="text-secondary font-monospace border-secondary">{d.itemType || '-'}</td>
                    <td className="text-info font-monospace border-secondary">{d.count}</td>
                    <td className="text-success font-monospace border-secondary">${Number(d.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

  doc.setFillColor(0, 188, 212)
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
    doc.setTextColor(0, 188, 212)
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
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, W - margin, y)
    y += 10
  }

  section('Report Title', r.title)
  section('Generated Date', formatDate(r.generatedDate))
  section('Scope', r.scope)
  section('Key Metrics', r.metrics)
  section('Report Content', r.reportContent)

  doc.setFillColor(0, 188, 212)
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
    if (!window.confirm('Delete KPI report?')) return
    try { await analyticsService.kpiReports.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const openPreview = async (r) => {
    try {
      const full = await analyticsService.kpiReports.getById(r.kpiReportId)
      setPreview(full)
    } catch { setPreview(r) }
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
                  <i className="fa-solid fa-chart-line me-2" />KPI Report Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body">
                {[['Report Title', preview.title], ['Generated Date', formatDate(preview.generatedDate)], ['Scope', preview.scope], ['Key Metrics', preview.metrics], ['Report Content', preview.reportContent]].map(([label, val]) => (
                  <div key={label} className="mb-4">
                    <div className="text-info font-monospace text-uppercase small fw-bold mb-1">{label}</div>
                    <div className="text-light" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{val || '-'}</div>
                    <hr className="border-secondary mt-2" />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-info btn-sm rounded-0 font-monospace text-dark" onClick={() => { downloadKpiPdf(preview); setPreview(null) }}>
                  <i className="fa-solid fa-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={() => setShowAdd(!showAdd)}>
          <i className="fa-solid fa-plus me-2" />New KPI Report
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-3 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
          <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" value={form.title} onChange={e => setForm({ title: e.target.value })} required>
            <option value="" className="bg-dark text-white">Select Report Type</option>
            {KPI_TITLES.map((t) => <option key={t} value={t} className="bg-dark text-white">{t}</option>)}
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
            {reports.map((r) => (
              <tr key={r.kpiReportId} className="border-secondary bg-dark">
                <td className="text-secondary font-monospace border-secondary">{r.title}</td>
                <td className="text-secondary font-monospace border-secondary">{formatDate(r.generatedDate)}</td>
                <td className="border-secondary">
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-info rounded-0" title="Preview" onClick={() => openPreview(r)}><i className="fa-solid fa-eye" /></button>
                    <button className="btn btn-outline-secondary rounded-0" title="Download PDF" onClick={() => openPreview(r)}><i className="fa-solid fa-download" /></button>
                    <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(r.kpiReportId)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-chart-line me-2" />
                  <span className="font-monospace">No KPI reports generated.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
