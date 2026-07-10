import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/authentication/AuthProvider'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm fixed-top">
      <div className="container">

        {/* Brand */}
        <Link
          to="/dashboard"
          className="navbar-brand fw-bold fs-3 text-decoration-none"
          style={{ color: '#6f42c1' }}
        >
          TravelEase
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Right Side */}
        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarContent"
        >
          {currentUser ? (
            <div className="d-flex align-items-center gap-3">

              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#6f42c1'
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>

                <div>
                  <div className="fw-semibold text-dark">
                    {currentUser.name || 'User'}
                  </div>

                  <small className="text-muted">
                    {currentUser.email}
                  </small>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn text-white"
                style={{
                  backgroundColor: '#6f42c1',
                  borderColor: '#6f42c1'
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>

            </div>
          ) : (
            <div className="d-flex gap-2">

              <Link
                to="/login"
                className="btn"
                style={{
                  color: '#6f42c1',
                  border: '1px solid #6f42c1'
                }}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="btn text-white"
                style={{
                  backgroundColor: '#6f42c1',
                  borderColor: '#6f42c1'
                }}
              >
                Register
              </Link>

            </div>
          )}
        </div>

      </div>
    </nav>
  )
}