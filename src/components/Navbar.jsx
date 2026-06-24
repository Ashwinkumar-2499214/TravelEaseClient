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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">TravelEase</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>
          </ul>
          <div className="d-flex align-items-center text-white">
            {currentUser ? (
              <>
                <span className="me-3">{currentUser.name || currentUser.email}</span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link className="btn btn-outline-light btn-sm" to="/register">Register</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
