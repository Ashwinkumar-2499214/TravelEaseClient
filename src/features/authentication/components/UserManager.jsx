import React, { useEffect, useState } from 'react'
import authService from '../services/authService'

const ROLES = [
  { label: 'Traveler', value: 1 },
  { label: 'TravelAgent', value: 2 },
  { label: 'CorporateTravelManager', value: 3 },
  { label: 'FinanceOfficer', value: 4 },
  { label: 'ComplianceOfficer', value: 5 },
  { label: 'Admin', value: 6 },
]

const EMPTY = { name: '', email: '', phone: '', password: '', role: 1 }

export default function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')

  const load = (term = '') => {
    setLoading(true)
    authService.getUsers(term)
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditUser(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (u) => {
    setEditUser(u)
    setForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: ROLES.find(r => r.label === u.role)?.value ?? 1,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const role = Number(form.role) || 1
      if (editUser) {
        await authService.updateUser(editUser.userId, { name: form.name, email: form.email, phone: form.phone, role })
      } else {
        await authService.registerUser({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role,
        })
      }
      setShowModal(false)
      load(search)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try { await authService.deleteUser(userId); load(search) }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    load(search)
  }

  if (error) return <div className="container-fluid py-4"><div className="alert alert-danger">{error}</div></div>

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-2 te-text-purple" style={{ color: '#6f42c1' }}>
            <i className="bi bi-people-fill me-2" aria-hidden="true"></i>
            User Management
          </h2>
          <p className="text-muted mb-0">System Access Control and Directory Registry</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input 
              className="form-control form-control-sm border-secondary shadow-sm" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)} 
              style={{ width: 220 }} 
            />
            <button 
              type="submit" 
              className="btn btn-outline-secondary btn-sm"
            >
              Search
            </button>
          </form>
          <button 
            className="btn btn-primary btn-sm text-white" 
            style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
            onClick={openCreate}
          >
            <i className="bi bi-person-plus-fill me-2" aria-hidden="true" />
            Register User
          </button>
        </div>
      </div>

      {/* Main Table Content / Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#6f42c1' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small fw-bold text-secondary text-uppercase ps-4">Name</th>
                  <th className="small fw-bold text-secondary text-uppercase">Email</th>
                  <th className="small fw-bold text-secondary text-uppercase">Phone</th>
                  <th className="small fw-bold text-secondary text-uppercase">Role</th>
                  <th className="small fw-bold text-secondary text-uppercase">Status</th>
                  <th className="small fw-bold text-secondary text-uppercase text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td className="ps-4 fw-semibold text-dark">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td className="text-muted">{u.phone}</td>
                    <td>
                      <span className="badge text-white" style={{ backgroundColor: '#6f42c1' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">Active</span>
                      ) : (
                        <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3">Inactive</span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => openEdit(u)}
                          title="Edit User"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(u.userId)}
                          title="Delete User"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted bg-light bg-opacity-50">
                      <i className="bi bi-people me-2 fs-4 d-block mb-2 text-secondary"></i>
                      <span>No users found matching the filter criteria.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Blocks */}
      <div className="row mt-5">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 style={{ color: '#6f42c1' }}>{users.length}</h3>
              <small className="text-muted">Total Registered Users</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success">{users.filter(u => u.isActive).length}</h3>
              <small className="text-muted">Active Profiles</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger">{users.filter(u => !u.isActive).length}</h3>
              <small className="text-muted">Suspended/Inactive Profiles</small>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <form className="modal-content border-0 shadow-lg" onSubmit={handleSubmit}>
                <div className="modal-header text-white" style={{ backgroundColor: '#6f42c1' }}>
                  <div>
                    <h5 className="modal-title fw-bold">
                      <i className={`bi ${editUser ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`}></i>
                      {editUser ? 'Edit User Profile' : 'Register New User'}
                    </h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                      <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="form-label text-muted small fw-bold text-uppercase">Phone Number</label>
                      <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                    </div>
                    {!editUser && (
                      <div>
                        <label className="form-label text-muted small fw-bold text-uppercase">Secure Password</label>
                        <input type="password" className="form-control" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                      </div>
                    )}
                    <div>
                      <label className="form-label text-muted small fw-bold text-uppercase">Assigned System Role</label>
                      <select className="form-select" value={String(form.role)} onChange={e => setForm(p => ({ ...p, role: Number(e.target.value) }))}>
                        {ROLES.map(r => <option key={r.value} value={String(r.value)}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary text-white" style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}>
                    <i className="bi bi-save me-2"></i>{editUser ? 'Save Changes' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}