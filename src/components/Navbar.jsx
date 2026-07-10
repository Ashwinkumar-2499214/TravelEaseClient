
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
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom fixed-top te-shadow-sm">
      <div className="container-fluid">
        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand fw-bold te-text-purple" style={{ fontSize: '1.4rem' }}>
          <i className="bi bi-globe me-2" style={{ fontSize: '1.5rem' }}></i>
          TravelEase
        </Link>


        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0"
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
            <div className="d-flex align-items-center gap-3 ms-auto">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--te-purple-700)'
                  }}
                >
                  <i className="bi bi-person-fill" style={{ fontSize: '1.1rem' }}></i>
                </div>

                <div>
                  <div className="fw-600 text-dark" style={{ fontSize: '0.95rem' }}>
                    {currentUser.name || 'User'}
                  </div>

                  <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {currentUser.email}
                  </small>
                </div>
              </div>

              <button onClick={handleLogout} className="btn btn-sm btn-primary">
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>

            </div>
          ) : (
            <div className="d-flex gap-2 ms-auto">
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
    </nav>
  )
}