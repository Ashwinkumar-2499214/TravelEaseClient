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

  // Redirect once currentUser is populated after login
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
      // navigation handled by the useEffect above
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <form onSubmit={submit} className="card p-4 shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <h4 className="mb-1">Sign in to TravelEase</h4>
        <p className="text-muted small mb-3">Enter your credentials to continue</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
