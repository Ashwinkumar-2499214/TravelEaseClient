import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, authReady } = useAuth()

  if (!authReady) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  if (!currentUser) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
