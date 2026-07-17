import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import authService from '../services/authService'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [view, setView] = useState('login')
  const [fpEmail, setFpEmail] = useState('')
  const [fpPassword, setFpPassword] = useState('')
  const [fpConfirm, setFpConfirm] = useState('')
  const [fpSuccess, setFpSuccess] = useState(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { login, currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/overview', { replace: true })
    }
  }, [currentUser, navigate])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const submit = async (e) => {
    e.preventDefault()

    // Frontend validation: valid email like ****@gmail.com and non-empty password.
    if (!emailRegex.test(String(email).trim())) {
      setError('Please enter a valid Email Address (example: ****@gmail.com)')
      return
    }

    if (!password || password.length < 1) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login({
        email,
        password
      })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }


  const submitForgot = async (e) => {
    e.preventDefault()

    if (fpPassword !== fpConfirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.forgotPassword({
        email: fpEmail,
        newPassword: fpPassword
      })

      setFpSuccess(
        'Password updated successfully. You can now login.'
      )
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        'Reset password failed'
      )
    } finally {
      setLoading(false)
    }
  }

  const switchToLogin = () => {
    setView('login')
    setError(null)
    setFpSuccess(null)
    setFpEmail('')
    setFpPassword('')
    setFpConfirm('')
  }

  return (
    <div
      className="container-fluid"
      style={{
        height: 'calc(100vh - 130px)',
        marginTop: '70px',
        marginBottom: '60px',
        backgroundColor: '#f8f9fa'
      }}
    >
      <div className="row h-100">
        {/* Left Section */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
          <div
            className="card border-0 shadow-sm"
            style={{
              width: '100%',
              maxWidth: '450px'
            }}
          >
            <div className="card-body p-4">
              <h2
                className="fw-bold mb-1"
                style={{ color: '#6f42c1' }}
              >
                Welcome Back
              </h2>

              <p className="text-muted mb-4">
                Sign in to your TravelEase account
              </p>

              {error && (
                <div className="alert alert-danger py-2">
                  {error}
                </div>
              )}

              {view === 'login' ? (
                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label">
                      Email Address
                    </label>

                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Password
                    </label>

                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        required
                      />

                      <span
                        className="input-group-text bg-white"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() =>
                          setShowPassword(true)
                        }
                        onMouseLeave={() =>
                          setShowPassword(false)
                        }
                      >
                        <i
                          className={`fas ${
                            showPassword
                              ? 'fa-eye-slash'
                              : 'fa-eye'
                          }`}
                        ></i>
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                      />

                      <label className="form-check-label">
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      style={{ color: '#6f42c1' }}
                      onClick={() => {
                        setView('forgot')
                        setError(null)
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn text-white w-100"
                    style={{
                      backgroundColor: '#6f42c1'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  <div className="text-center mt-3">
                    <small className="text-muted">
                      Don't have an account?{' '}
                    </small>

                    <Link
                      to="/register"
                      className="fw-semibold text-decoration-none"
                      style={{ color: '#6f42c1' }}
                    >
                      Sign Up
                    </Link>
                  </div>
                </form>
              ) : fpSuccess ? (
                <>
                  <div className="alert alert-success">
                    {fpSuccess}
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={switchToLogin}
                  >
                    Back To Login
                  </button>
                </>
              ) : (
                <form onSubmit={submitForgot}>
                  <h5
                    className="mb-3"
                    style={{ color: '#6f42c1' }}
                  >
                    Reset Password
                  </h5>

                  <div className="mb-3">
                    <label className="form-label">
                      Email Address
                    </label>

                    <input
                      type="email"
                      className="form-control"
                      value={fpEmail}
                      onChange={(e) =>
                        setFpEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      New Password
                    </label>

                    <div className="input-group">
                      <input
                        type={
                          showNewPassword
                            ? 'text'
                            : 'password'
                        }
                        className="form-control"
                        value={fpPassword}
                        onChange={(e) =>
                          setFpPassword(
                            e.target.value
                          )
                        }
                        required
                      />

                      <span
                        className="input-group-text bg-white"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() =>
                          setShowNewPassword(true)
                        }
                        onMouseLeave={() =>
                          setShowNewPassword(false)
                        }
                      >
                        <i
                          className={`fas ${
                            showNewPassword
                              ? 'fa-eye-slash'
                              : 'fa-eye'
                          }`}
                        ></i>
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Confirm Password
                    </label>

                    <div className="input-group">
                      <input
                        type={
                          showConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        className="form-control"
                        value={fpConfirm}
                        onChange={(e) =>
                          setFpConfirm(
                            e.target.value
                          )
                        }
                        required
                      />

                      <span
                        className="input-group-text bg-white"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() =>
                          setShowConfirmPassword(
                            true
                          )
                        }
                        onMouseLeave={() =>
                          setShowConfirmPassword(
                            false
                          )
                        }
                      >
                        <i
                          className={`fas ${
                            showConfirmPassword
                              ? 'fa-eye-slash'
                              : 'fa-eye'
                          }`}
                        ></i>
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn text-white w-100 mb-3"
                    style={{
                      backgroundColor: '#6f42c1'
                    }}
                  >
                    {loading
                      ? 'Processing...'
                      : 'Update Password'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ color: '#6f42c1' }}
                    onClick={switchToLogin}
                  >
                    Back To Login
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Travel Panel */}
        <div className="col-lg-6 d-none d-lg-block p-0 position-relative">
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: 'rgba(111,66,193,0.65)'
            }}
          >
            <div className="text-center text-white px-5">
              <i
                className="fas fa-plane-departure mb-4"
                style={{
                  fontSize: '4rem'
                }}
              ></i>

              <h1 className="display-4 fw-bold mb-3">
                TravelEase
              </h1>

              <p className="lead">
                Book Hotels, manage itineraries,
                approve travel requests and simplify
                corporate travel from one platform.
              </p>

              <div className="row g-3 mt-4">
                <div className="col-6">
                  <div className="card bg-white bg-opacity-25 border-0 text-white">
                    <div className="card-body">
                      Hotel Booking
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card bg-white bg-opacity-25 border-0 text-white">
                    <div className="card-body">
                      Itineraries
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card bg-white bg-opacity-25 border-0 text-white">
                    <div className="card-body">
                      Approvals
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card bg-white bg-opacity-25 border-0 text-white">
                    <div className="card-body">
                      Expenses
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}