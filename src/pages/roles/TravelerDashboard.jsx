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
      {/* Header Section */}
      <div className="card card-purple mb-4" style={{ borderLeft: '4px solid var(--te-purple-700)' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'var(--te-purple-700)',
                minWidth: '60px'
              }}
            >
              <i className="bi bi-person-walking" style={{ fontSize: '1.8rem' }}></i>
            </div>
            <div>
              <h4 className="mb-1 text-purple" style={{ fontWeight: 700 }}>
                Traveler Portal
              </h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Manage your travel bookings and itineraries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottomColor: '#e5e7eb', borderBottomWidth: '2px' }}>
        {[
          ['overview', 'Overview', 'bi-house-fill'],
          ['search', 'Search', 'bi-search'],
          ['bookings', 'Bookings', 'bi-briefcase-fill'],
          ['itineraries', 'Itineraries', 'bi-map-fill'],
          ['invoices', 'Invoices', 'bi-file-earmark-text-fill'],
          ['notifications', 'Notifications', 'bi-bell-fill'],
        ].map(([path, label, icon]) => (
          <li className="nav-item" key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--te-purple-700)' : 'var(--te-gray-600)',
                borderBottomColor: isActive ? 'var(--te-purple-700)' : 'transparent',
                borderBottomWidth: '3px',
                paddingBottom: '0.75rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s ease'
              })}
            >
              <i className={`bi ${icon}`}></i>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Routes */}
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
  const cardData = [
    { label: 'Search Inventory', desc: 'Find flights, hotels & more', icon: 'bi-search', path: 'search', color: 'var(--te-status-info)' },
    { label: 'My Bookings', desc: 'View and manage your bookings', icon: 'bi-briefcase-fill', path: 'bookings', color: 'var(--te-status-success)' },
    { label: 'Itineraries', desc: 'Day-by-day travel timeline', icon: 'bi-map-fill', path: 'itineraries', color: 'var(--te-status-warning)' },
    { label: 'Invoices', desc: 'View and pay your invoices', icon: 'bi-file-earmark-text-fill', path: 'invoices', color: 'var(--te-purple-600)' },
    { label: 'Notifications', desc: 'Stay up to date', icon: 'bi-bell-fill', path: 'notifications', color: 'var(--te-status-danger)' },
  ]

  return (
    <div className="row g-4">
      {cardData.map(card => (
        <div className="col-md-6 col-lg-4" key={card.path}>
          <NavLink to={card.path} className="text-decoration-none">
            <div
              className="card h-100 border-0 transition shadow-sm"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--te-shadow-lg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--te-shadow-sm)'
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
                      fontSize: '1.5rem',
                      minWidth: '50px'
                    }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="card-title mb-1 text-gray-900" style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {card.label}
                    </h5>
                    <p className="card-text text-muted small mb-0" style={{ fontSize: '0.875rem' }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-white border-top border-gray-200">
                <small className="fw-600" style={{ color: card.color }}>
                  Go to {card.label} →
                </small>
              </div>
            </div>
          </NavLink>
        </div>
      ))}
    </div>
  )
}
