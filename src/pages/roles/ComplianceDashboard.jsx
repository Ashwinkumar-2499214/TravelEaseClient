import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import ComplianceManager from '../../features/billing-payments/components/ComplianceManager'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'

export default function ComplianceDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-shield-halved me-2 text-danger" />Compliance Dashboard</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['compliance', 'Audit & Policies'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<ComplianceOverview />} />
        <Route path="overview" element={<ComplianceOverview />} />
        <Route path="compliance" element={<ComplianceManager />} />
        <Route path="notifications" element={<NotificationsPanel />} />
      </Routes>
    </div>
  )
}

function ComplianceOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Audit & Policies', desc: 'Audit logs, reports & retention policies', icon: 'fa-solid fa-clipboard-list', path: 'compliance', color: 'danger' },
        { label: 'Notifications', desc: 'System alerts', icon: 'fa-solid fa-bell', path: 'notifications', color: 'secondary' },
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
