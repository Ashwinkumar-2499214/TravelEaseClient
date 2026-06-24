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
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <form onSubmit={submit} className="card p-4 shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        
        <h4 className="mb-1">Create an account</h4>
        <p className="text-muted small mb-3">
          Fill in the details below to register
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* Name */}
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
        </div>

        {/* Phone */}
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-control"
            value={form.phone}
            onChange={set('phone')}
            placeholder="Enter phone number"
            required
          />
        </div>

        {/* Role */}
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={form.role}
            onChange={set('role')}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
          />
        </div>

        {/* Submit */}
        <button className="btn btn-success w-100" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Registering...
            </>
          ) : (
            'Create Account'
          )}
        </button>

        <p className="text-center text-muted small mt-3 mb-0">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

      </form>
    </div>
  )
}