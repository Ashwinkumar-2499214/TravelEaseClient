import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import InvoicesManager from '../../features/billing-payments/components/InvoicesManager'
import AnalyticsDashboard from '../../features/analytics-reporting/components/AnalyticsDashboard'
import NotificationsPanel from '../../features/notifications/components/NotificationsPanel'
import PaymentsPanel from './sub/PaymentsPanel'

export default function FinanceDashboard() {
  return (
    <div>
      <h4 className="mb-3"><i className="fa-solid fa-coins me-2 text-warning" />Finance Officer</h4>
      <ul className="nav nav-pills mb-3 flex-wrap gap-1">
        {[
          ['overview', 'Overview'],
          ['invoices', 'Invoices'],
          ['payments', 'Payments'],
          ['analytics', 'Financial Trends'],
          ['notifications', 'Notifications'],
        ].map(([path, label]) => (
          <li className="nav-item" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-secondary border'}`}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <Routes>
        <Route index element={<FinanceOverview />} />
        <Route path="overview" element={<FinanceOverview />} />
        <Route path="invoices" element={<InvoicesManager />} />
        <Route path="payments" element={<PaymentsPanel />} />
        <Route path="analytics/*" element={<AnalyticsDashboard />} />
        <Route path="notifications" element={<NotificationsPanel />} />
      </Routes>
    </div>
  )
}

function FinanceOverview() {
  return (
    <div className="row g-3">
      {[
        { label: 'Invoices', desc: 'Generate and manage invoices', icon: 'fa-solid fa-file-invoice-dollar', path: 'invoices', color: 'primary' },
        { label: 'Payments', desc: 'Track and process payments', icon: 'fa-solid fa-credit-card', path: 'payments', color: 'success' },
        { label: 'Financial Trends', desc: 'Spend analysis & KPI reports', icon: 'fa-solid fa-chart-bar', path: 'analytics', color: 'warning' },
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
