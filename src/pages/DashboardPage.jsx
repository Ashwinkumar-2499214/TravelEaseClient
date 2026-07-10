import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'
import Sidebar from '../components/Sidebar'
import ProtectedRoute from '../components/ProtectedRoute'
import TravelerDashboard from './roles/TravelerDashboard'
import AgentDashboard from './roles/AgentDashboard'
import ManagerDashboard from './roles/ManagerDashboard'
import FinanceDashboard from './roles/FinanceDashboard'
import ComplianceDashboard from './roles/ComplianceDashboard'
import AdminDashboard from './roles/AdminDashboard'

const ROLE_DASHBOARD = {
  Traveler: TravelerDashboard,
  TravelAgent: AgentDashboard,
  CorporateTravelManager: ManagerDashboard,
  FinanceOfficer: FinanceDashboard,
  ComplianceOfficer: ComplianceDashboard,
  Admin: AdminDashboard,
}

export default function DashboardPage() {
  const { currentUser, authReady } = useAuth()

  if (!authReady)
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div
          aria-label="Loading"
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            border: '3px solid rgba(124,58,237,.20)',
            borderTopColor: 'rgba(124,58,237,1)',
            animation: 'teSpin 0.9s linear infinite',
          }}
        />
        <style>{`@keyframes teSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )


  if (!currentUser) return <Navigate to="/login" replace />

  const role = currentUser.role || 'Traveler'
  const RoleDashboard = ROLE_DASHBOARD[role] || TravelerDashboard

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 86px)' }}>
      <Sidebar />
      <div className="flex-grow-1" style={{ padding: 18, background: 'white' }}>


        <ProtectedRoute>
          <Routes>
            <Route path="/*" element={<RoleDashboard />} />
          </Routes>
        </ProtectedRoute>
      </div>
    </div>
  )
}
