import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg bg-dark border-bottom border-secondary">
      <div className="container-fluid">
        <Link className="navbar-brand text-info font-monospace text-uppercase fw-bold" to="/dashboard">
          <i className="fas fa-terminal me-2"></i>TravelEase
        </Link>
        <button className="navbar-toggler border-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-white font-monospace" to="/dashboard">
                <i className="fas fa-chart-line me-2"></i>Dashboard
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center">
            {currentUser ? (
              <>
                <span className="text-white font-monospace me-3">
                  <i className="fas fa-user me-1"></i>{currentUser.name || currentUser.email}
                </span>
                <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={handleLogout}>
                  <i className="fas fa-power-off me-1"></i>Logout
                </button>
              </>
            ) : (
              <Link className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" to="/register">
                <i className="fas fa-user-plus me-1"></i>Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
