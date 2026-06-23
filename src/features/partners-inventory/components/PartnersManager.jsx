import React, { useEffect, useState } from 'react'
import partnersService from '../services/partnersService'

const EMPTY = { name: '', type: '', contactEmail: '', contactPhone: '', address: '' }

export default function PartnersManager() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editPartner, setEditPartner] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)

  const load = () => {
    setLoading(true)
    partnersService.list().then(setPartners).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditPartner(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (p) => {
    setEditPartner(p)
    setForm({ name: p.name || '', type: p.type || '', contactEmail: p.contactEmail || '', contactPhone: p.contactPhone || '', address: p.address || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      editPartner ? await partnersService.update(editPartner.id, form) : await partnersService.create(form)
      setShowModal(false); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete partner?')) return
    try { await partnersService.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const toggleStatus = async (p) => {
    const next = p.status === 'Active' ? 'Inactive' : 'Active'
    try { await partnersService.patchStatus(p.id, next); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Partners Registry</h5>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><i className="fa-solid fa-plus me-1" />Add Partner</button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr><th>Name</th><th>Type</th><th>Contact Email</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <React.Fragment key={p.id}>
                <tr>
                  <td>
                    <button className="btn btn-link btn-sm p-0 me-2 text-decoration-none" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                      <i className={`fa-solid ${expandedId === p.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    {p.name}
                  </td>
                  <td>{p.type}</td>
                  <td>{p.contactEmail}</td>
                  <td><span className={`badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{p.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => toggleStatus(p)} title="Toggle status"><i className="fa-solid fa-toggle-on" /></button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
                {expandedId === p.id && <PartnerInventoryRow partnerId={p.id} />}
              </React.Fragment>
            ))}
            {partners.length === 0 && <tr><td colSpan={5} className="text-center text-muted">No partners.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{editPartner ? 'Edit Partner' : 'Add Partner'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'type', label: 'Type' },
                  { key: 'contactEmail', label: 'Contact Email' },
                  { key: 'contactPhone', label: 'Contact Phone' },
                  { key: 'address', label: 'Address' },
                ].map(({ key, label, required }) => (
                  <div className="mb-2" key={key}>
                    <label className="form-label">{label}</label>
                    <input className="form-control" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={!!required} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PartnerInventoryRow({ partnerId }) {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', type: '', price: '', capacity: '' })

  const loadInv = () => partnersService.listInventory(partnerId).then(setInventory).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { loadInv() }, [partnerId])

  const addItem = async (e) => {
    e.preventDefault()
    try {
      await partnersService.createInventory(partnerId, form)
      setForm({ name: '', type: '', price: '', capacity: '' })
      setShowAdd(false)
      loadInv()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  return (
    <tr className="table-light">
      <td colSpan={5} className="ps-5">
        <strong className="d-block mb-2">Inventory Items</strong>
        {loading ? <div className="spinner-border spinner-border-sm" /> : (
          <>
            <table className="table table-sm table-bordered mb-2">
              <thead className="table-secondary">
                <tr><th>Name</th><th>Type</th><th>Price</th><th>Capacity</th><th>Available</th></tr>
              </thead>
              <tbody>
                {inventory.map(i => (
                  <tr key={i.id}>
                    <td>{i.name}</td><td>{i.type}</td><td>{i.price}</td><td>{i.capacity}</td>
                    <td><span className={`badge ${i.isAvailable ? 'bg-success' : 'bg-danger'}`}>{i.isAvailable ? 'Yes' : 'No'}</span></td>
                  </tr>
                ))}
                {inventory.length === 0 && <tr><td colSpan={5} className="text-muted text-center">No inventory items.</td></tr>}
              </tbody>
            </table>
            {!showAdd ? (
              <button className="btn btn-sm btn-outline-success" onClick={() => setShowAdd(true)}><i className="fa-solid fa-plus me-1" />Add Item</button>
            ) : (
              <form onSubmit={addItem} className="d-flex gap-2 flex-wrap">
                {['name', 'type', 'price', 'capacity'].map(f => (
                  <input key={f} className="form-control form-control-sm" style={{ width: 120 }} placeholder={f} value={form[f]}
                    onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} required />
                ))}
                <button type="submit" className="btn btn-sm btn-success">Add</button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              </form>
            )}
          </>
        )}
      </td>
    </tr>
  )
}
