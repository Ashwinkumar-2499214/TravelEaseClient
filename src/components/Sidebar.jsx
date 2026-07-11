import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'

const ROLE_LINKS = {
  Traveler: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/search', label: 'Search', icon: 'bi-search' },
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'bi-briefcase-fill' },
    { to: '/dashboard/itineraries', label: 'Itineraries', icon: 'bi-map-fill' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'bi-file-earmark-text-fill' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ],

  TravelAgent: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/partners', label: 'Partners', icon: 'bi-people-fill' },
    { to: '/dashboard/inventory', label: 'Availability', icon: 'bi-search' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ],

  CorporateTravelManager: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/approvals', label: 'Approvals', icon: 'bi-check-circle-fill' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'bi-graph-up' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ],

  FinanceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'bi-file-earmark-text-fill' },
    { to: '/dashboard/payments', label: 'Payments', icon: 'bi-credit-card-fill' },
    { to: '/dashboard/analytics', label: 'Trends', icon: 'bi-bar-chart-fill' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ],

  ComplianceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/compliance', label: 'Audit & Policies', icon: 'bi-shield-fill' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ],

  Admin: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'bi-house-fill' },
    { to: '/dashboard/partners', label: 'Partners', icon: 'bi-people-fill' },
    { to: '/dashboard/users', label: 'Users', icon: 'bi-people-fill' },
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'bi-briefcase-fill' },
    { to: '/dashboard/itineraries', label: 'Itineraries', icon: 'bi-map-fill' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'bi-file-earmark-text-fill' },
    { to: '/dashboard/compliance', label: 'Compliance', icon: 'bi-shield-fill' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'bi-graph-up' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' }
  ]
}

export default function Sidebar() {
  const { currentUser, authReady } = useAuth()

  if (authReady === false || !currentUser) return null

  const role = currentUser?.role || 'Traveler'
  const links = ROLE_LINKS[role] || ROLE_LINKS.Traveler

  return (
    <aside
      className="sidebar bg-white border-end d-none d-lg-block"
      style={{
        borderRightColor: '#e5e7eb',
        position: 'sticky',
        top: '70px',
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        minWidth: '280px'
      }}
    >
      <div className="p-4">
        <div
          className="sidebar-role-card rounded-3 p-3 mb-4 text-white d-flex align-items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
            boxShadow: 'var(--te-shadow-md)'
          }}
        >
          <div
            className="rounded-circle bg-white d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px'
            }}
          >
            <i
              className="bi bi-person-fill"
              style={{
                color: 'var(--te-purple-700)',
                fontSize: '1.3rem'
              }}
            />
          </div>

          <div>
            <div
              className="fw-bold"
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                lineHeight: 1.2
              }}
            >
              {role}
            </div>

            <small
              style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                lineHeight: 1.2
              }}
            >
              User Account
            </small>
          </div>
        </div>

        <nav className="nav flex-column gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-2 text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? 'var(--te-purple-700)'
                  : 'transparent',
                color: isActive
                  ? 'var(--te-white)'
                  : 'var(--te-gray-700)',
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500
              })}
            >
              <i
                className={`bi ${link.icon}`}
                style={{
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              />

              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}