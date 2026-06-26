import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authService from '../features/authentication/services/authService'

// ✅ 1. Updated values to match C# Enum integers
const ROLES = [
  { label: 'Traveler', value: 1 },
  { label: 'Travel Agent', value: 2 },
  { label: 'Corporate Travel Manager', value: 3 },
  { label: 'Finance Officer', value: 4 },
  { label: 'Compliance Officer', value: 5 },
  { label: 'Admin', value: 6 },
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 1 // ✅ 2. Default to integer 1 (Traveler)
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(p => ({
      ...p,
      [field]: e.target.value
    }))
  }

  const submit = async (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    setError(null)

    try {
      await authService.registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: Number(form.role) // ✅ 3. Cast the string from the select dropdown back to an integer
      })

      navigate('/login')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card bg-secondary bg-opacity-10 border-secondary rounded-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-header bg-dark border-secondary d-flex align-items-center justify-content-between">
          <div>
            <h5 className="text-white font-monospace text-uppercase mb-1">System Registration</h5>
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
              <label className="form-label text-white font-monospace text-uppercase small">Full Name</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary rounded-0"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
            
            <div>
              <label className="form-label text-white font-monospace text-uppercase small">Email Address</label>
              <input
                type="email"
                className="form-control bg-dark text-white border-secondary rounded-0"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label className="form-label text-white font-monospace text-uppercase small">Phone Number</label>
              <input
                type="tel"
                className="form-control bg-dark text-white border-secondary rounded-0"
                value={form.phone}
                onChange={set('phone')}
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div>
              <label className="form-label text-white font-monospace text-uppercase small">System Role</label>
              <select
                className="form-select bg-dark text-white border-secondary rounded-0"
                value={form.role}
                onChange={set('role')}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value} className="bg-dark text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label text-white font-monospace text-uppercase small">Password</label>
              <input
                type="password"
                className="form-control bg-dark text-white border-secondary rounded-0"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
              />
            </div>
            
            <div>
              <label className="form-label text-white font-monospace text-uppercase small">Confirm Password</label>
              <input
                type="password"
                className="form-control bg-dark text-white border-secondary rounded-0"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
            </div>
            
            <button className="btn btn-outline-info rounded-0 font-monospace text-uppercase" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  <span className="font-monospace">Processing...</span>
                </>
              ) : (
                'Register User'
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <small className="text-light font-monospace">
              Existing User? <Link to="/login" className="text-info text-decoration-none">Sign in</Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  )
}