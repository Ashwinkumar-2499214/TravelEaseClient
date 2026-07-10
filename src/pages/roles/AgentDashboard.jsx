import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import InventorySearch from '../../features/partners-inventory/components/InventorySearch'
import NotificationsPage from '../NotificationsPage'
import PartnersManager from '../../features/partners-inventory/components/PartnersManager'

const NAV = [
  { path: 'overview', label: 'Overview', icon: 'bi-house-fill' },
  { path: 'inventory', label: 'Availability', icon: 'bi-search' },
  { path: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
]

export default function AgentDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="card card-purple-accent mb-4 border-left" style={{ borderLeft: '4px solid #7e22ce' }}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
              style={{ width: '50px', height: '50px', backgroundColor: '#7e22ce' }}
            >
              <i className="bi bi-headset" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <h5 className="mb-1" style={{ color: '#7e22ce', fontWeight: 700 }}>
                Travel Agent Portal
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Partner management and inventory overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottomColor: '#e5e7eb' }}>
        {NAV.map(item => (
          <li className="nav-item" key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                color: isActive ? '#7e22ce' : '#6b7280',
                borderBottomColor: isActive ? '#7e22ce' : 'transparent',
                borderBottomWidth: '3px',
                fontWeight: isActive ? 600 : 500,
                paddingBottom: '0.75rem'
              })}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Routes */}
      <Routes>
        <Route index element={<AgentOverview />} />
        <Route path="overview" element={<AgentOverview />} />
        <Route path="partners" element={<PartnersManager agentMode={true} />} />
        <Route path="inventory" element={<InventorySearch />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  )
}

function AgentOverview() {
  return (
    <div className="row g-4">
      <div className="col-lg-6 col-xl-4">
        <NavLink to="inventory" className="text-decoration-none">
          <div
            className="card h-100 border-0"
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
                    backgroundColor: '#3b82f6',
                    fontSize: '1.5rem'
                  }}
                >
                  <i className="bi bi-search"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1" style={{ color: '#111827', fontWeight: 700 }}>
                    Check Availability
                  </h5>
                  <p className="card-text text-muted small mb-0">
                    Live partner inventory search
                  </p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <small className="text-primary fw-600" style={{ color: '#3b82f6' }}>
                Search Inventory →
              </small>
            </div>
          </div>
        </NavLink>
      </div>
    </div>
  )
}
