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
        const currentRole = ROLES.find(r => r.label === editUser.role)?.value
        if (role !== currentRole) {
          await authService.updateRoles(editUser.userId, role)
        }
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
    if (!window.confirm('Delete this user?')) return
    try { await authService.deleteUser(userId); load(search) }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    load(search)
  }

  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="mb-0">User Management</h5>
        <div className="d-flex gap-2">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input className="form-control form-control-sm" placeholder="Search users..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
            <button type="submit" className="btn btn-outline-secondary btn-sm">Search</button>
          </form>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="fa-solid fa-plus me-1" />Register User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><span className="badge bg-secondary">{u.role}</span></td>
                  <td>{u.isActive ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.userId)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{editUser ? 'Edit User' : 'Register User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                </div>
                {!editUser && (
                  <div className="mb-2">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  </div>
                )}
                <div className="mb-2">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={String(form.role)} onChange={e => setForm(p => ({ ...p, role: Number(e.target.value) }))}>
                    {ROLES.map(r => <option key={r.value} value={String(r.value)}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Save Changes' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
