import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import PartnersManager from '../../features/partners-inventory/components/PartnersManager'
import UserManager from '../../features/authentication/components/UserManager'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import ItinerariesManager from '../../features/itineraries/components/ItinerariesManager'
import InvoicesManager from '../../features/billing-payments/components/InvoicesManager'
import ComplianceManager from '../../features/billing-payments/components/ComplianceManager'
import AnalyticsDashboard from '../../features/analytics-reporting/components/AnalyticsDashboard'
import NotificationsPage from '../NotificationsPage'

const NAV = [
  { path: 'overview', label: 'Overview', icon: 'bi-house-fill' },
  { path: 'partners', label: 'Partners', icon: 'bi-handshake' },
  { path: 'users', label: 'Users', icon: 'bi-people-fill' },
  { path: 'bookings', label: 'Bookings', icon: 'bi-briefcase-fill' },
  { path: 'itineraries', label: 'Itineraries', icon: 'bi-map-fill' },
  { path: 'invoices', label: 'Invoices', icon: 'bi-file-earmark-text-fill' },
  { path: 'compliance', label: 'Compliance', icon: 'bi-shield-fill' },
  { path: 'analytics', label: 'Analytics', icon: 'bi-graph-up' },
  { path: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
]

export default function AdminDashboard() {
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
              <i className="bi bi-sliders" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <h5 className="mb-1" style={{ color: '#7e22ce', fontWeight: 700 }}>
                Admin Console
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                System administration and management panel
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
              to={`/dashboard/${item.path}`}
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
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="partners" element={<PartnersManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="bookings" element={<BookingsManager agentMode={true} />} />
        <Route path="approvals" element={<BookingsManager approvalMode={true} pendingOnly={true} />} />
        <Route path="itineraries" element={<ItinerariesManager />} />
        <Route path="invoices" element={<InvoicesManager />} />
        <Route path="compliance" element={<ComplianceManager />} />
        <Route path="analytics/*" element={<AnalyticsDashboard />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  )
}

function AdminOverview() {
  const cards = [
    { label: 'Partners', desc: 'Manage travel partners and vendors', icon: 'bi-handshake', path: '/dashboard/partners', color: '#3b82f6' },
    { label: 'Users', desc: 'User management and role assignments', icon: 'bi-people-fill', path: '/dashboard/users', color: '#06b6d4' },
    { label: 'Bookings', desc: 'Monitor all system bookings', icon: 'bi-briefcase-fill', path: '/dashboard/bookings', color: '#10b981' },
    { label: 'Itineraries', desc: 'View and manage itineraries', icon: 'bi-map-fill', path: '/dashboard/itineraries', color: '#f59e0b' },
    { label: 'Invoices', desc: 'Billing and invoice management', icon: 'bi-file-earmark-text-fill', path: '/dashboard/invoices', color: '#8b5cf6' },
    { label: 'Compliance', desc: 'Audit logs and policies', icon: 'bi-shield-fill', path: '/dashboard/compliance', color: '#ef4444' },
    { label: 'Analytics', desc: 'System-wide KPIs and trends', icon: 'bi-graph-up', path: '/dashboard/analytics', color: '#6366f1' },
    { label: 'Notifications', desc: 'System alerts and notifications', icon: 'bi-bell-fill', path: '/dashboard/notifications', color: '#ec4899' },
  ]

  return (
    <div className="row g-4">
      {cards.map(card => (
        <div className="col-lg-6 col-xl-4" key={card.path}>
          <NavLink to={card.path} className="text-decoration-none">
            <div
              className="card h-100 border-0 transition-all"
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
                  Access → {card.label}
                </small>
              </div>
            </div>
          </NavLink>
        </div>
      ))}
    </div>
  )
}
