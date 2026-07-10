
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
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom fixed-top shadow-sm" style={{ borderBottomColor: '#e5e7eb', zIndex: 1030, height: '70px' }}>
      <div className="container-fluid px-4">
        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand fw-bold text-purple d-flex align-items-center gap-2" style={{ fontSize: '1.4rem', minWidth: 'max-content' }}>
          <i className="bi bi-globe" style={{ fontSize: '1.6rem' }}></i>
          <span className="d-none d-sm-inline">TravelEase</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 ms-auto"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ outline: 'none' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Right Side */}
        <div className="collapse navbar-collapse" id="navbarContent">
          <div className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {currentUser ? (
              <>
                {/* User Info */}
                <div className="d-flex align-items-center gap-2 ps-3 border-start border-gray-200">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'var(--te-purple-700)',
                      minWidth: '40px'
                    }}
                  >
                    <i className="bi bi-person-fill" style={{ fontSize: '1.1rem' }}></i>
                  </div>

                  <div className="d-none d-sm-block">
                    <div className="fw-600 text-dark" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>
                      {currentUser.name || 'User'}
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                      {currentUser.email}
                    </small>
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="btn btn-sm btn-primary d-flex align-items-center gap-2 text-nowrap"
                  style={{ backgroundColor: 'var(--te-purple-700)' }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span className="d-none d-sm-inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}