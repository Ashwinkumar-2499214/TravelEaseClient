import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'
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
      <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '60vh' }}>
        <div
          className="spinner-border"
          style={{ color: 'var(--te-purple-700)' }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )

  if (!currentUser) return <Navigate to="/login" replace />

  const role = currentUser.role || 'Traveler'
  const RoleDashboard = ROLE_DASHBOARD[role] || TravelerDashboard

  return (
    <div className="w-100">
      <div className="container-fluid px-3 px-lg-4 py-4" style={{ maxWidth: '1400px' }}>
        <ProtectedRoute>
          <Routes>
            <Route path="/*" element={<RoleDashboard />} />
          </Routes>
        </ProtectedRoute>
      </div>
    </div>
  )
}
