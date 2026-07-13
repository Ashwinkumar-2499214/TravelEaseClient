import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authService from '../features/authentication/services/authService'

const ROLES = [
  { label: 'Traveler', value: 1 },
  { label: 'Travel Agent', value: 2 },
  { label: 'Corporate Travel Manager', value: 3 },
  { label: 'Finance Officer', value: 4 },
  { label: 'Compliance Officer', value: 5 },
  { label: 'Admin', value: 6 }
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 1
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  const setField = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const submit = async (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: Number(form.role)
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

        {/* Left Side Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">

          <div
            className="card border-0 shadow-sm"
            style={{
              width: '100%',
              maxWidth: '430px'
            }}
          >
            <div className="card-body p-3">

              <h2
                className="fw-bold mb-1"
                style={{ color: '#6f42c1' }}
              >
                Create Account
              </h2>

              <p className="text-muted mb-3">
                Join TravelEase today.
              </p>

              {error && (
                <div className="alert alert-danger py-2">
                  {error}
                </div>
              )}

              <form onSubmit={submit}>

                <div className="mb-2">
                  <label className="form-label small">
                    Full Name
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.name}
                    onChange={setField('name')}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small">
                    Email Address
                  </label>

                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={form.email}
                    onChange={setField('email')}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    value={form.phone}
                    onChange={setField('phone')}
                    required
                  />
                </div>

                {/* <div className="mb-2">
                  <label className="form-label small">
                    Role
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={form.role}
                    onChange={setField('role')}
                  >
                    {ROLES.map((role) => (
                      <option
                        key={role.value}
                        value={role.value}
                      >
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div> */}

                <div className="mb-2">
                  <label className="form-label small">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={form.password}
                    onChange={setField('password')}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={form.confirmPassword}
                    onChange={setField('confirmPassword')}
                    required
                  />
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
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Already have an account?{' '}
                  </small>

                  <Link
                    to="/login"
                    className="text-decoration-none fw-semibold"
                    style={{ color: '#6f42c1' }}
                  >
                    Sign In
                  </Link>
                </div>

              </form>

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
                Book flights, manage itineraries,
                approve travel requests and simplify
                corporate travel from one platform.
              </p>

              <div className="row g-3 mt-4">

                <div className="col-6">
                  <div className="card bg-white bg-opacity-25 border-0 text-white">
                    <div className="card-body">
                      Flight Booking
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