import React, { useEffect, useState } from 'react'
import analyticsService from '../services/analyticsService'
import { formatDate } from '../../../utils/date'

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('live')
  return (
    <div>
      <h5 className="mb-3">Analytics & Reporting</h5>
      <ul className="nav nav-tabs mb-3">
        {[['live', 'Live Dashboard'], ['trends', 'Trends'], ['kpi', 'KPI Reports']].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          </li>
        ))}
      </ul>
      {tab === 'live' && <LiveDashboard />}
      {tab === 'trends' && <TrendsPanel />}
      {tab === 'kpi' && <KpiReportsPanel />}
    </div>
  )
}

function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <div className="col-md-4">
      <div className={`card border-${color} mb-3`}>
        <div className="card-body d-flex align-items-center gap-3">
          <i className={`${icon} fa-2x text-${color}`} />
          <div>
            <div className="text-muted small">{title}</div>
            <div className="fs-4 fw-bold">{value ?? <span className="spinner-border spinner-border-sm" />}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveDashboard() {
  const [spend, setSpend] = useState(null)
  const [volume, setVolume] = useState(null)
  const [cancellations, setCancellations] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    analyticsService.dashboards.travelSpend().then(setSpend).catch(() => setError('Failed to load travel spend'))
    analyticsService.dashboards.bookingVolume().then(setVolume).catch(() => {})
    analyticsService.dashboards.cancellations().then(setCancellations).catch(() => {})
  }, [])

  return (
    <div>
      {error && <div className="alert alert-warning">{error}</div>}
      <div className="row">
        <StatCard title="Total Travel Spend" value={spend?.total ? `$${spend.total}` : spend !== null ? '$0' : null} icon="fa-solid fa-dollar-sign" color="success" />
        <StatCard title="Booking Volume" value={volume?.count ?? (volume !== null ? 0 : null)} icon="fa-solid fa-suitcase" color="primary" />
        <StatCard title="Cancellations" value={cancellations?.count ?? (cancellations !== null ? 0 : null)} icon="fa-solid fa-ban" color="danger" />
      </div>
    </div>
  )
}

function TrendsPanel() {
  const [spendData, setSpendData] = useState([])
  const [destData, setDestData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsService.trends.spendPerTraveler(), analyticsService.trends.destinations()])
      .then(([s, d]) => { setSpendData(s); setDestData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-border" />

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0">
          <div className="card-header bg-dark border-secondary">
            <h6 className="text-white font-monospace text-uppercase mb-0">Spend Per Traveler</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-dark table-sm mb-0 rounded-0">
                <thead className="bg-info text-dark">
                  <tr>
                    <th className="font-monospace text-uppercase small border-secondary">Traveler</th>
                    <th className="font-monospace text-uppercase small border-secondary">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {spendData.map((s, i) => (
                    <tr key={i} className="border-secondary bg-dark">
                      <td className="text-secondary font-monospace border-secondary bg-darker">{s.traveler || s.travelerId}</td>
                      <td className="text-secondary font-monospace border-secondary bg-darker">${s.spend || s.amount}</td>
                    </tr>
                  ))}
                  {spendData.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                        <span className="font-monospace">No data available.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0">
          <div className="card-header bg-dark border-secondary">
            <h6 className="text-white font-monospace text-uppercase mb-0">Top Destinations</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-dark table-sm mb-0 rounded-0">
                <thead className="bg-info text-dark">
                  <tr>
                    <th className="font-monospace text-uppercase small border-secondary">Destination</th>
                    <th className="font-monospace text-uppercase small border-secondary">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {destData.map((d, i) => (
                    <tr key={i} className="border-secondary bg-dark">
                      <td className="text-secondary font-monospace border-secondary bg-darker">{d.destination || d.name}</td>
                      <td className="text-secondary font-monospace border-secondary bg-darker">{d.count}</td>
                    </tr>
                  ))}
                  {destData.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                        <span className="font-monospace">No data available.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiReportsPanel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', period: '' })

  const load = () => {
    setLoading(true)
    analyticsService.kpiReports.list().then(setReports).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try { await analyticsService.kpiReports.create(form); setShowAdd(false); setForm({ title: '', period: '' }); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete report?')) return
    try { await analyticsService.kpiReports.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDownload = async (id) => {
    try {
      const blob = await analyticsService.kpiReports.download(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `kpi-report-${id}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="spinner-border" />
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={() => setShowAdd(!showAdd)}>
          <i className="fa-solid fa-plus me-2" />New KPI Report
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="d-flex gap-2 mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
          <input className="form-control form-control-sm bg-dark text-light border-secondary rounded-0" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          <input className="form-control form-control-sm bg-dark text-light border-secondary rounded-0" placeholder="Period (e.g. Q1 2025)" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} />
          <button type="submit" className="btn btn-info btn-sm rounded-0 font-monospace">Create</button>
          <button type="button" className="btn btn-secondary btn-sm rounded-0 font-monospace" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Title</th>
              <th className="font-monospace text-uppercase small border-secondary">Period</th>
              <th className="font-monospace text-uppercase small border-secondary">Created</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-secondary bg-dark">
                <td className="text-secondary font-monospace border-secondary bg-darker">{r.title}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">{r.period}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(r.createdAt)}</td>
                <td className="border-secondary bg-darker">
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-info rounded-0" onClick={() => handleDownload(r.id)}><i className="fa-solid fa-download" /></button>
                    <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-chart-line me-2"></i>
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
