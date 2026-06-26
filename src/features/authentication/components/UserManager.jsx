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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">User Management</h5>
          <small className="text-light font-monospace">System Access Control</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input className="form-control form-control-sm bg-dark text-light border-secondary rounded-0" placeholder="Search users..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
            <button type="submit" className="btn btn-outline-info btn-sm rounded-0 font-monospace">Search</button>
          </form>
          <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2" />Register User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
            <thead className="bg-info text-dark">
              <tr>
                <th className="font-monospace text-uppercase small border-secondary">Name</th>
                <th className="font-monospace text-uppercase small border-secondary">Email</th>
                <th className="font-monospace text-uppercase small border-secondary">Phone</th>
                <th className="font-monospace text-uppercase small border-secondary">Role</th>
                <th className="font-monospace text-uppercase small border-secondary">Active</th>
                <th className="font-monospace text-uppercase small border-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} className="border-secondary bg-dark">
                  <td className="text-light font-monospace border-secondary bg-darker">{u.name}</td>
                  <td className="text-light font-monospace border-secondary bg-darker">{u.email}</td>
                  <td className="text-light font-monospace border-secondary bg-darker">{u.phone}</td>
                  <td className="border-secondary bg-darker"><span className="badge bg-secondary font-monospace">{u.role}</span></td>
                  <td className="border-secondary bg-darker">{u.isActive ? <span className="badge bg-success font-monospace">Active</span> : <span className="badge bg-danger font-monospace">Inactive</span>}</td>
                  <td className="border-secondary bg-darker">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(u)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(u.userId)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                    <i className="fa-solid fa-users me-2"></i>
                    <span className="font-monospace">No users found in system registry.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.8)' }}>
          <div className="modal-dialog">
            <form className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0" onSubmit={handleSubmit}>
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editUser ? 'Edit User' : 'Register User'}</h5>
                  <small className="text-light font-monospace">System Access Control</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Name</label>
                    <input className="form-control bg-dark text-white border-secondary rounded-0" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Email</label>
                    <input type="email" className="form-control bg-dark text-white border-secondary rounded-0" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Phone</label>
                    <input className="form-control bg-dark text-white border-secondary rounded-0" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                  </div>
                  {!editUser && (
                    <div>
                      <label className="form-label text-white font-monospace text-uppercase small">Password</label>
                      <input type="password" className="form-control bg-dark text-white border-secondary rounded-0" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                    </div>
                  )}
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">System Role</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={String(form.role)} onChange={e => setForm(p => ({ ...p, role: Number(e.target.value) }))}>
                      {ROLES.map(r => <option key={r.value} value={String(r.value)} className="bg-dark text-white">{r.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-user-plus me-2"></i>{editUser ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
