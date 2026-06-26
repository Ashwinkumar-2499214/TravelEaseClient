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
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  ],
  TravelAgent: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/inventory', label: 'Availability', icon: 'fa-solid fa-magnifying-glass' },
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'fa-solid fa-suitcase' },
    { to: '/dashboard/itineraries', label: 'Itineraries', icon: 'fa-solid fa-route' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  ],
  CorporateTravelManager: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/approvals', label: 'Approvals', icon: 'fa-solid fa-check-circle' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  ],
  FinanceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/invoices', label: 'Invoices', icon: 'fa-solid fa-file-invoice-dollar' },
    { to: '/dashboard/payments', label: 'Payments', icon: 'fa-solid fa-credit-card' },
    { to: '/dashboard/analytics', label: 'Trends', icon: 'fa-solid fa-chart-bar' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  ],
  ComplianceOfficer: [
    { to: '/dashboard/overview', label: 'Overview', icon: 'fa-solid fa-house' },
    { to: '/dashboard/compliance', label: 'Audit & Policies', icon: 'fa-solid fa-shield-halved' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
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
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  ],
}

export default function Sidebar() {
  const { currentUser } = useAuth()
  const role = currentUser?.role || 'Traveler'
  const links = ROLE_LINKS[role] || ROLE_LINKS.Traveler

  return (
    <div className="bg-secondary bg-opacity-10 border-end border-secondary" style={{ width: 220, minHeight: 'calc(100vh - 112px)', flexShrink: 0 }}>
      <div className="p-2">
        <div className="bg-dark border-secondary rounded-0 p-2 mb-3">
          <div className="text-info font-monospace text-uppercase fw-bold small d-flex align-items-center">
            <div className="spinner-grow spinner-grow-sm text-info me-2" role="status"></div>
            {role}
          </div>
        </div>
        <ul className="nav flex-column gap-1">
          {links.map(l => (
            <li className="nav-item" key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) => `nav-link py-2 px-3 rounded-0 font-monospace small text-uppercase ${isActive ? 'bg-info text-dark fw-bold' : 'text-white border-secondary'}`}
              >
                <i className={`${l.icon} me-2`} />{l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
