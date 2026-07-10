import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import AnalyticsDashboard from '../../features/analytics-reporting/components/AnalyticsDashboard'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'

const NAV = [
  { path: 'overview', label: 'Overview', icon: 'bi-house-fill' },
  { path: 'approvals', label: 'Travel Approvals', icon: 'bi-check-circle-fill' },
  { path: 'analytics', label: 'Spend Analysis', icon: 'bi-graph-up' },
  { path: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
]

export default function ManagerDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="card card-purple-accent mb-4 border-left" style={{ borderLeft: '4px solid #7e22ce' }}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
              style={{ width: '50px', height: '50px', backgroundColor: '#7e22ce' }}
            >
              <i className="bi bi-building" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <h5 className="mb-1" style={{ color: '#7e22ce', fontWeight: 700 }}>
                Corporate Travel Manager
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Travel approvals and spend analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottomColor: '#e5e7eb' }}>
        {NAV.map(item => (
          <li className="nav-item" key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                color: isActive ? '#7e22ce' : '#6b7280',
                borderBottomColor: isActive ? '#7e22ce' : 'transparent',
                borderBottomWidth: '3px',
                fontWeight: isActive ? 600 : 500,
                paddingBottom: '0.75rem'
              })}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Routes */}
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
  const cards = [
    { label: 'Travel Approvals', desc: 'Approve or reject employee requests', icon: 'bi-check-circle-fill', path: 'approvals', color: '#f59e0b' },
    { label: 'Spend Analysis', desc: 'Company-wide travel analytics', icon: 'bi-graph-up', path: 'analytics', color: '#3b82f6' },
    { label: 'Notifications', desc: 'Pending alerts and updates', icon: 'bi-bell-fill', path: 'notifications', color: '#ef4444' },
  ]

  return (
    <div className="row g-4">
      {cards.map(card => (
        <div className="col-lg-6 col-xl-4" key={card.path}>
          <NavLink to={card.path} className="text-decoration-none">
            <div
              className="card h-100 border-0"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div className="card-body">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: card.color,
                      fontSize: '1.5rem'
                    }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <div>
                    <h5 className="card-title mb-1" style={{ color: '#111827', fontWeight: 700 }}>
                      {card.label}
                    </h5>
                    <p className="card-text text-muted small mb-0">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-transparent border-0">
                <small className="text-primary fw-600" style={{ color: card.color }}>
                  Access →
                </small>
              </div>
            </div>
          </NavLink>
        </div>
      ))}
    </div>
  )
}

function TravelApprovalsPanel() {
  return (
    <div>
      <BookingsManager agentMode={true} approvalMode={true} pendingOnly={true} />
    </div>
  )
}
