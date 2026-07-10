import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import AnalyticsDashboard from '../../features/analytics-reporting/components/AnalyticsDashboard'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'

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
  // Reuse the same Bookings table UI used by Admin/Agent view,
  // but restrict it to Pending bookings and allow status changes.
  return (
    <div>
      <h5 className="mb-3">Travel Approvals</h5>
      <BookingsManager agentMode={true} approvalMode={true} pendingOnly={true} />
    </div>
  )
}
