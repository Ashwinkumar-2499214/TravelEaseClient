import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'

const ROLE_LINKS = {
  Traveler: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/search', label: 'Search', icon: 'fa-solid fa-magnifying-glass' },
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'fa-solid fa-suitcase' },
    { to: '/dashboard/itineraries', label: 'Itineraries', icon: 'fa-solid fa-route' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'fa-solid fa-file-invoice-dollar' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ],

  TravelAgent: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/partners', label: 'Partners', icon: 'fa-solid fa-handshake' },
    { to: '/dashboard/inventory', label: 'Availability', icon: 'fa-solid fa-magnifying-glass' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ],

  CorporateTravelManager: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/approvals', label: 'Approvals', icon: 'fa-solid fa-check-circle' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ],

  FinanceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'fa-solid fa-file-invoice-dollar' },
    { to: '/dashboard/payments', label: 'Payments', icon: 'fa-solid fa-credit-card' },
    { to: '/dashboard/analytics', label: 'Trends', icon: 'fa-solid fa-chart-bar' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ],

  ComplianceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/compliance', label: 'Audit & Policies', icon: 'fa-solid fa-shield-halved' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ],

  Admin: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/partners', label: 'Partners', icon: 'fa-solid fa-handshake' },
    { to: '/dashboard/users', label: 'Users', icon: 'fa-solid fa-users' },
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'fa-solid fa-suitcase' },
    { to: '/dashboard/itineraries', label: 'Itineraries', icon: 'fa-solid fa-route' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'fa-solid fa-file-invoice-dollar' },
    { to: '/dashboard/compliance', label: 'Compliance', icon: 'fa-solid fa-shield-halved' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
  ]
}

export default function Sidebar() {
  const { currentUser } = useAuth()

  const role = currentUser?.role || 'Traveler'
  const links = ROLE_LINKS[role] || ROLE_LINKS.Traveler

  return (
    <aside
      className="bg-white border-end shadow-sm position-fixed"
      style={{
        width: '250px',
        top: '70px',
        bottom: '60px',
        left: 0,
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      <div className="p-3">

        {/* Role Card */}
        <div
          className="rounded-3 p-3 mb-4 text-white"
          style={{
            backgroundColor: '#6f42c1'
          }}
        >
          <div className="d-flex align-items-center">

            <div
              className="rounded-circle bg-white me-3 d-flex align-items-center justify-content-center"
              style={{
                width: '42px',
                height: '42px'
              }}
            >
              <i
                className="fa-solid fa-user"
                style={{ color: '#6f42c1' }}
              ></i>
            </div>

            <div>
              <div className="fw-bold">
                {role}
              </div>

              <small className="text-white-50">
                TravelEase User
              </small>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <ul className="nav flex-column gap-2">

          {links.map((link) => (
            <li key={link.to} className="nav-item">

              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center rounded-3 px-3 py-2 ${
                    isActive
                      ? 'text-white'
                      : 'text-dark'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? '#6f42c1'
                    : 'transparent',
                  transition: 'all 0.2s ease'
                })}
              >
                <i
                  className={`${link.icon} me-3`}
                  style={{
                    width: '20px'
                  }}
                ></i>

                <span>{link.label}</span>
              </NavLink>

            </li>
          ))}

        </ul>

      </div>
    </aside>
  )
}