import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import InventorySearch from '../../features/partners-inventory/components/InventorySearch'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import ItinerariesManager from '../../features/itineraries/components/ItinerariesManager'
import InvoicesManager from '../../features/billing-payments/components/InvoicesManager'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'

export default function TravelerDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-person-walking-luggage me-2 text-primary" />Traveler Portal</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['search', 'Search'],
          ['bookings', 'Bookings'],
          ['itineraries', 'Itineraries'],
          ['invoices', 'Invoices'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<TravelerOverview />} />
        <Route path="overview" element={<TravelerOverview />} />
        <Route path="search" element={<InventorySearch />} />
        <Route path="bookings" element={<BookingsManager />} />
        <Route path="itineraries" element={<ItinerariesManager />} />
        <Route path="invoices" element={<InvoicesManager />} />
        <Route path="notifications" element={<NotificationsPanel />} />
      </Routes>
    </div>
  )
}

function TravelerOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Search Inventory', desc: 'Find flights, hotels & more', icon: 'fa-solid fa-magnifying-glass', path: 'search', color: 'primary' },
        { label: 'My Bookings', desc: 'View and manage your bookings', icon: 'fa-solid fa-suitcase', path: 'bookings', color: 'success' },
        { label: 'Itineraries', desc: 'Day-by-day travel timeline', icon: 'fa-solid fa-route', path: 'itineraries', color: 'info' },
        { label: 'Invoices', desc: 'View and pay your invoices', icon: 'fa-solid fa-file-invoice-dollar', path: 'invoices', color: 'warning' },
        { label: 'Notifications', desc: 'Stay up to date', icon: 'fa-solid fa-bell', path: 'notifications', color: 'danger' },
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
