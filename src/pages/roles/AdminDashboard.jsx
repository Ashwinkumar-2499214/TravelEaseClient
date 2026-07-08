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
  ['overview', 'Overview'],
  ['partners', 'Partners'],
  ['users', 'Users'],
  ['bookings', 'Bookings'],
  ['itineraries', 'Itineraries'],
  ['invoices', 'Invoices'],
  ['compliance', 'Compliance'],
  ['analytics', 'Analytics'],
  ['notifications', 'Notifications'],
]

export default function AdminDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-gear me-2 text-secondary" />Admin Console</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {NAV.map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={`/dashboard/${path}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="partners" element={<PartnersManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="bookings" element={<BookingsManager agentMode={true} />} />
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
  return (
    <div className="row g-3">
      {[
        { label: 'Partners', desc: 'CRUD partner registry & inventory', icon: 'fa-solid fa-handshake', path: '/dashboard/partners', color: 'primary' },
        { label: 'Users', desc: 'Manage users & role assignments', icon: 'fa-solid fa-users', path: '/dashboard/users', color: 'info' },
        { label: 'Bookings', desc: 'Global bookings oversight', icon: 'fa-solid fa-suitcase', path: '/dashboard/bookings', color: 'success' },
        { label: 'Itineraries', desc: 'View and manage all itineraries', icon: 'fa-solid fa-route', path: '/dashboard/itineraries', color: 'warning' },
        { label: 'Invoices', desc: 'Central billing registry', icon: 'fa-solid fa-file-invoice-dollar', path: '/dashboard/invoices', color: 'danger' },
        { label: 'Compliance', desc: 'Audit logs and policies', icon: 'fa-solid fa-shield-halved', path: '/dashboard/compliance', color: 'dark' },
        { label: 'Analytics', desc: 'System-wide KPI & trends', icon: 'fa-solid fa-chart-line', path: '/dashboard/analytics', color: 'secondary' },
        { label: 'Notifications', desc: 'System notifications & alerts', icon: 'fa-solid fa-bell', path: '/dashboard/notifications', color: 'warning' },
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
