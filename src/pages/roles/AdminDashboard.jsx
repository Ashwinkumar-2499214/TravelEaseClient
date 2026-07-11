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

export default function AdminDashboard() {
  return (
    <div>
      {/* Header */}
      <div
        className="card card-purple mb-4"
        style={{ borderLeft: '4px solid var(--te-purple-700)' }}
      >
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'var(--te-purple-700)',
                minWidth: '50px'
              }}
            >
              <i
                className="bi bi-sliders"
                style={{ fontSize: '1.5rem' }}
              ></i>
            </div>

            <div>
              <h5
                className="mb-1 text-purple"
                style={{ fontWeight: 700 }}
              >
                Admin Console
              </h5>

              <p
                className="text-muted mb-0"
                style={{ fontSize: '0.9rem' }}
              >
                System administration and management panel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="partners" element={<PartnersManager />} />
        <Route path="users" element={<UserManager />} />
        <Route
          path="bookings"
          element={<BookingsManager agentMode={true} />}
        />
        <Route
          path="approvals"
          element={
            <BookingsManager
              approvalMode={true}
              pendingOnly={true}
            />
          }
        />
        <Route
          path="itineraries"
          element={<ItinerariesManager />}
        />
        <Route path="invoices" element={<InvoicesManager />} />
        <Route path="compliance" element={<ComplianceManager />} />
        <Route
          path="analytics/*"
          element={<AnalyticsDashboard />}
        />
        <Route
          path="notifications"
          element={<NotificationsPage />}
        />
      </Routes>
    </div>
  )
}

function AdminOverview() {
  const cards = [
    {
      label: 'Partners',
      desc: 'Manage travel partners and vendors',
      icon: 'bi-handshake',
      path: '/dashboard/partners',
      color: 'var(--te-status-info)'
    },
    {
      label: 'Users',
      desc: 'User management and role assignments',
      icon: 'bi-people-fill',
      path: '/dashboard/users',
      color: '#06b6d4'
    },
    {
      label: 'Bookings',
      desc: 'Monitor all system bookings',
      icon: 'bi-briefcase-fill',
      path: '/dashboard/bookings',
      color: 'var(--te-status-success)'
    },
    {
      label: 'Itineraries',
      desc: 'View and manage itineraries',
      icon: 'bi-map-fill',
      path: '/dashboard/itineraries',
      color: 'var(--te-status-warning)'
    },
    {
      label: 'Invoices',
      desc: 'Billing and invoice management',
      icon: 'bi-file-earmark-text-fill',
      path: '/dashboard/invoices',
      color: 'var(--te-purple-600)'
    },
    {
      label: 'Compliance',
      desc: 'Audit logs and policies',
      icon: 'bi-shield-fill',
      path: '/dashboard/compliance',
      color: 'var(--te-status-danger)'
    },
    {
      label: 'Analytics',
      desc: 'System-wide KPIs and trends',
      icon: 'bi-graph-up',
      path: '/dashboard/analytics',
      color: '#6366f1'
    },
    {
      label: 'Notifications',
      desc: 'System alerts and notifications',
      icon: 'bi-bell-fill',
      path: '/dashboard/notifications',
      color: '#ec4899'
    }
  ]

  return (
    <div className="row g-4">
      {cards.map(card => (
        <div
          className="col-md-6 col-lg-4"
          key={card.path}
        >
          <NavLink
            to={card.path}
            className="text-decoration-none"
          >
            <div
              className="card h-100 border-0 shadow-sm"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform =
                  'translateY(-4px)'
                e.currentTarget.style.boxShadow =
                  'var(--te-shadow-lg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform =
                  'translateY(0)'
                e.currentTarget.style.boxShadow =
                  'var(--te-shadow-sm)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: card.color,
                      minWidth: '50px',
                      fontSize: '1.5rem'
                    }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>

                  <div className="flex-grow-1">
                    <h5
                      className="card-title mb-1 text-gray-900"
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}
                    >
                      {card.label}
                    </h5>

                    <p
                      className="card-text text-muted small mb-0"
                      style={{ fontSize: '0.875rem' }}
                    >
                      {card.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer bg-white border-top border-gray-200">
                <small
                  className="fw-600"
                  style={{ color: card.color }}
                >
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