import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-header bg-dark border-secondary d-flex align-items-center justify-content-between">
          <div>
            <h5 className="text-white font-monospace text-uppercase mb-1">System Access</h5>
            <small className="text-light font-monospace">TravelEase Terminal v2.1</small>
          </div>
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>
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
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  <span className="font-monospace">Authenticating...</span>
                </>
              ) : (
                'Initialize Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
