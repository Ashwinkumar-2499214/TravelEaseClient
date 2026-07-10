import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import InventorySearch from '../../features/partners-inventory/components/InventorySearch'
import NotificationsPage from '../NotificationsPage'
import PartnersManager from '../../features/partners-inventory/components/PartnersManager'


export default function AgentDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-headset me-2 text-success" />Agent Console</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['inventory', 'Check Availability'],
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
        <Route path="partners" element={<PartnersManager agentMode={true} />} />
        <Route path="inventory" element={<InventorySearch />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  )
}

function AgentOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Check Availability', desc: 'Live partner inventory search', icon: 'fa-solid fa-magnifying-glass', path: 'inventory', color: 'primary' },
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
