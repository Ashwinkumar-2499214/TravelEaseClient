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

  if (!authReady) return (
    <div className="d-flex justify-content-center align-items-center bg-dark" style={{ minHeight: '60vh' }}>
      <div className="d-flex flex-column align-items-center">
        <div className="spinner-border text-info mb-3" />
        <span className="text-light font-monospace">Loading System...</span>
      </div>
    </div>
  )

  if (!currentUser) return <Navigate to="/login" replace />

  const role = currentUser.role || 'Traveler'
  const RoleDashboard = ROLE_DASHBOARD[role] || TravelerDashboard

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 112px)' }}>
      <Sidebar />
      <div className="flex-grow-1 p-3 bg-dark">
        <ProtectedRoute>
          <Routes>
            <Route path="/*" element={<RoleDashboard />} />
          </Routes>
        </ProtectedRoute>
      </div>
    </div>
  )
}
