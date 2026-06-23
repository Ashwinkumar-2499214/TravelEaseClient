import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import BookingsManager from '../../features/bookings-reservations/components/BookingsManager'
import InventorySearch from '../../features/partners-inventory/components/InventorySearch'
import ItinerariesManager from '../../features/itineraries/components/ItinerariesManager'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'

export default function AgentDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-headset me-2 text-success" />Agent Console</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['inventory', 'Check Availability'],
          ['bookings', 'Manage Bookings'],
          ['itineraries', 'Itineraries'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<AgentOverview />} />
        <Route path="overview" element={<AgentOverview />} />
        <Route path="inventory" element={<InventorySearch />} />
        <Route path="bookings" element={<BookingsManager agentMode={true} />} />
        <Route path="itineraries" element={<ItinerariesManager />} />
        <Route path="notifications" element={<NotificationsPanel />} />
      </Routes>
    </div>
  )
}

function AgentOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Check Availability', desc: 'Live partner inventory search', icon: 'fa-solid fa-magnifying-glass', path: 'inventory', color: 'primary' },
        { label: 'Manage Bookings', desc: 'Create & modify bookings for travelers', icon: 'fa-solid fa-suitcase', path: 'bookings', color: 'success' },
        { label: 'Itineraries', desc: 'Build and track travel plans', icon: 'fa-solid fa-route', path: 'itineraries', color: 'info' },
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
