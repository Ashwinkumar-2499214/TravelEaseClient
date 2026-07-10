
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
    { to: '/dashboard/partners', label: 'Partners', icon: 'bi-handshake' },
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
    { to: '/dashboard/partners', label: 'Partners', icon: 'bi-handshake' },
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
  const { currentUser } = useAuth()

  const role = currentUser?.role || 'Traveler'
  const links = ROLE_LINKS[role] || ROLE_LINKS.Traveler

  return (
    <aside className="sidebar bg-white border-end te-border-right te-sidebar">
      <div className="p-4">

        {/* Role Card */}
        <div
          className="sidebar-role-card rounded-3 p-3 mb-4 text-white"
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-white me-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, minWidth: 44 }}>
              <i className="bi bi-person-fill" style={{ color: 'var(--te-purple-700)', fontSize: '1.3rem' }}></i>
            </div>


            <div>
              <div className="fw-bold role-name" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
                {role}
              </div>

              <small className="role-subtitle" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                User Account
              </small>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav flex-column gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-nav-item d-flex align-items-center text-decoration-none rounded-2 px-3 py-2.5 transition-all ${
                isActive
                  ? 'bg-purple-700 text-white fw-600'
                  : 'text-dark-700 hover-bg-gray-50'
              }`}
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--te-purple-700)' : 'transparent',
                color: isActive ? 'var(--te-white)' : 'var(--te-gray-700)',
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              })}
            >

              <i
                className={`bi ${link.icon} me-3`}
                style={{
                  fontSize: '1.1rem'
                }}
              ></i>

              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{link.label}</span>

            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}