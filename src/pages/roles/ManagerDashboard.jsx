import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import bookingsService from '../../features/bookings-reservations/services/bookingsService'
import AnalyticsDashboard from '../../features/analytics-reporting/components/AnalyticsDashboard'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'
import { formatDate } from '../../utils/date'

export default function ManagerDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-building-user me-2 text-warning" />Corporate Travel Manager</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['approvals', 'Travel Approvals'],
          ['analytics', 'Spend Analysis'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<ManagerOverview />} />
        <Route path="overview" element={<ManagerOverview />} />
        <Route path="approvals" element={<TravelApprovalsPanel />} />
        <Route path="analytics/*" element={<AnalyticsDashboard />} />
        <Route path="notifications" element={<NotificationsPanel />} />
      </Routes>
    </div>
  )
}

function ManagerOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Travel Approvals', desc: 'Approve or reject employee requests', icon: 'fa-solid fa-check-circle', path: 'approvals', color: 'warning' },
        { label: 'Spend Analysis', desc: 'Company-wide travel analytics', icon: 'fa-solid fa-chart-line', path: 'analytics', color: 'primary' },
        { label: 'Notifications', desc: 'Pending alerts and updates', icon: 'fa-solid fa-bell', path: 'notifications', color: 'danger' },
      ].map(card => (
        <div className="col-md-4" key={card.path}>
          <NavLink to={card.path} className="text-decoration-none">
            <div className={`card border-${card.color} h-100`}>
              <div className="card-body d-flex align-items-center gap-3">
                <i className={`${card.icon} fa-2x text-${card.color}`} />
                <div>
                  <div className="fw-bold">{card.label}</div>
                  <div className="text-muted small">{card.desc}</div>
                </div>
              </div>
            </div>
          </NavLink>
        </div>
      ))}
    </div>
  )
}

function TravelApprovalsPanel() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    bookingsService.list()
      .then(data => setBookings(data.filter(b => b.status === 'Pending')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAction = async (id, status) => {
    try { await bookingsService.patchStatus(id, status); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <h5 className="mb-3">Pending Travel Requests</h5>
      {bookings.length === 0 ? (
        <div className="alert alert-success"><i className="fa-solid fa-check me-2" />No pending requests.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr><th>Reference</th><th>Traveler</th><th>Start</th><th>End</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.reference || b.id}</td>
                  <td>{b.travelerId || '-'}</td>
                  <td>{formatDate(b.startDate)}</td>
                  <td>{formatDate(b.endDate)}</td>
                  <td className="text-muted small">{b.notes || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-success me-1" onClick={() => handleAction(b.id, 'Confirmed')}>
                      <i className="fa-solid fa-check me-1" />Approve
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleAction(b.id, 'Cancelled')}>
                      <i className="fa-solid fa-xmark me-1" />Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
