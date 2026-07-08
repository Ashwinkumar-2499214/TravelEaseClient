import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import authService from '../services/authService'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('login') // 'login' | 'forgot'
  const [fpEmail, setFpEmail] = useState('')
  const [fpPassword, setFpPassword] = useState('')
  const [fpConfirm, setFpConfirm] = useState('')
  const [fpSuccess, setFpSuccess] = useState(null)
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/overview', { replace: true })
    }
  }, [currentUser, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    if (fpPassword !== fpConfirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError(null)
    try {
      await authService.forgotPassword({ email: fpEmail, newPassword: fpPassword })
      setFpSuccess('Password updated successfully. You can now log in.')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to reset password')
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
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-header bg-dark border-secondary d-flex align-items-center justify-content-between">
          <div>
            <h5 className="text-white font-monospace text-uppercase mb-1">
              {view === 'login' ? 'System Access' : 'Reset Password'}
            </h5>
            <small className="text-light font-monospace">TravelEase Terminal v2.1</small>
          </div>
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>

        {view === 'login' ? (
          <form onSubmit={submit} className="card-body p-4">
            {error && (
              <div className="alert alert-danger border-0 rounded-0 bg-danger bg-opacity-10 text-danger py-2 mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>{error}
              </div>
            )}
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-white font-monospace text-uppercase small">Email Address</label>
                <input
                  type="email"
                  className="form-control bg-dark text-light border-secondary rounded-0"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="form-label text-white font-monospace text-uppercase small">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-light border-secondary rounded-0"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button className="btn btn-outline-info rounded-0 font-monospace text-uppercase" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" /><span className="font-monospace">Authenticating...</span></>
                ) : 'Initialize Session'}
              </button>
              <button
                type="button"
                className="btn btn-link text-secondary font-monospace small p-0 text-start"
                onClick={() => { setView('forgot'); setError(null) }}
              >
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitForgot} className="card-body p-4">
            {error && (
              <div className="alert alert-danger border-0 rounded-0 bg-danger bg-opacity-10 text-danger py-2 mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>{error}
              </div>
            )}
            {fpSuccess ? (
              <div className="d-flex flex-column gap-3">
                <div className="alert alert-success border-0 rounded-0 bg-success bg-opacity-10 text-success py-2">
                  <i className="fas fa-check-circle me-2"></i>{fpSuccess}
                </div>
                <button type="button" className="btn btn-outline-info rounded-0 font-monospace text-uppercase" onClick={switchToLogin}>
                  Back to Login
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label text-white font-monospace text-uppercase small">Email Address</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-light border-secondary rounded-0"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-white font-monospace text-uppercase small">New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary rounded-0"
                    value={fpPassword}
                    onChange={e => setFpPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-white font-monospace text-uppercase small">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary rounded-0"
                    value={fpConfirm}
                    onChange={e => setFpConfirm(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-outline-info rounded-0 font-monospace text-uppercase" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                  ) : 'Set New Password'}
                </button>
                <button type="button" className="btn btn-link text-secondary font-monospace small p-0 text-start" onClick={switchToLogin}>
                  Back to login
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
