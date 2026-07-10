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
      <div className="card card-purple-accent mb-4 border-left" style={{ borderLeft: '4px solid #7e22ce' }}>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#7e22ce'
                }}
              >
                <i className="bi bi-person-walking" style={{ fontSize: '1.8rem' }}></i>
              </div>
            </div>
            <div className="col">
              <h4 className="mb-1" style={{ color: '#7e22ce', fontWeight: 700 }}>
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
      <ul className="nav nav-tabs mb-4 border-bottom" style={{ borderBottomColor: '#e5e7eb' }}>
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
                color: isActive ? '#7e22ce' : '#6b7280',
                borderBottomColor: isActive ? '#7e22ce' : 'transparent',
                borderBottomWidth: '3px',
                paddingBottom: '0.75rem',
                fontWeight: isActive ? 600 : 500
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
    { label: 'Search Inventory', desc: 'Find flights, hotels & more', icon: 'bi-search', path: 'search', color: '#3b82f6' },
    { label: 'My Bookings', desc: 'View and manage your bookings', icon: 'bi-briefcase-fill', path: 'bookings', color: '#10b981' },
    { label: 'Itineraries', desc: 'Day-by-day travel timeline', icon: 'bi-map-fill', path: 'itineraries', color: '#f59e0b' },
    { label: 'Invoices', desc: 'View and pay your invoices', icon: 'bi-file-earmark-text-fill', path: 'invoices', color: '#8b5cf6' },
    { label: 'Notifications', desc: 'Stay up to date', icon: 'bi-bell-fill', path: 'notifications', color: '#ef4444' },
  ]

  return (
    <div className="row g-4">
      {cardData.map(card => (
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
