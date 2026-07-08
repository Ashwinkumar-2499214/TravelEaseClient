import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import InventorySearch from '../../features/partners-inventory/components/InventorySearch'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import ItinerariesManager from '../../features/itineraries/components/ItinerariesManager'
import InvoicesManager from '../../features/billing-payments/components/InvoicesManager'
import NotificationsPage from '../NotificationsPage'

export default function TravelerDashboard() {
  return (
    <div>
      <div className="d-flex align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <i className="fa-solid fa-person-walking-luggage me-3 text-info fa-2x" />
        <div>
          <h4 className="text-white font-monospace text-uppercase mb-1">Traveler Portal</h4>
          <small className="text-light font-monospace">Travel Management System v2.1</small>
        </div>
        <div className="ms-auto">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>
      </div>
      <ul className="nav nav-pills mb-4 flex-wrap gap-2">
        {[
          ['overview', 'Overview'],
          ['search', 'Search'],
          ['bookings', 'Bookings'],
          ['itineraries', 'Itineraries'],
          ['invoices', 'Invoices'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link rounded-0 font-monospace text-uppercase small ${isActive ? 'bg-info text-dark fw-bold' : 'text-white border-secondary bg-secondary bg-opacity-10'}`}>{label}</NavLink>
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
        <Route path="notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  )
}

function TravelerOverview() {
  return (
    <div className="row g-4">
      {[
        { label: 'Search Inventory', desc: 'Find flights, hotels & more', icon: 'fa-solid fa-magnifying-glass', path: 'search' },
        { label: 'My Bookings', desc: 'View and manage your bookings', icon: 'fa-solid fa-suitcase', path: 'bookings' },
        { label: 'Itineraries', desc: 'Day-by-day travel timeline', icon: 'fa-solid fa-route', path: 'itineraries' },
        { label: 'Invoices', desc: 'View and pay your invoices', icon: 'fa-solid fa-file-invoice-dollar', path: 'invoices' },
        { label: 'Notifications', desc: 'Stay up to date', icon: 'fa-solid fa-bell', path: 'notifications' },
      ].map(card => (
        <div className="col-md-4" key={card.path}>
          <NavLink to={card.path} className="text-decoration-none">
            <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0 h-100">
              <div className="card-header bg-dark border-secondary d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className={`${card.icon} text-info me-2`} />
                  <span className="text-white font-monospace text-uppercase small">{card.label}</span>
                </div>
                <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
              </div>
              <div className="card-body">
                <p className="text-light font-monospace small mb-0">{card.desc}</p>
              </div>
            </div>
          </NavLink>
        </div>
      ))}
    </div>
  )
}
