import React, { useEffect, useState } from 'react'
import { useAuth } from '../../authentication/AuthProvider'
import partnersService from '../services/partnersService'
import inventoryService from '../services/inventoryService'

const PARTNER_TYPES = [{ value: 1, label: 'Hotel' }, { value: 2, label: 'Transport Provider' }, { value: 3, label: 'Tour Operator' }]
const PARTNER_STATUSES = [{ value: 1, label: 'Active' }, { value: 2, label: 'Inactive' }]

const getTypeLabel = (val) => PARTNER_TYPES.find(t => t.value === Number(val))?.label ?? val
const getStatusLabel = (val) => PARTNER_STATUSES.find(s => s.value === Number(val))?.label ?? val

const EMPTY = { name: '', type: '', status: 1, contactEmail: '', contactPhone: '', address: '' }

export default function PartnersManager({ agentMode = false }) {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const hideActions = isAdmin && !agentMode
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editPartner, setEditPartner] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  const load = (searchVal = searchInput) => {
    setLoading(true)
    setError(null)

    const queryParams = {}
    const finalSearch = searchVal.trim()

    queryParams.SearchTerm = finalSearch === '' ? 'a' : finalSearch

    partnersService.list(queryParams)
      .then(setPartners)
      .catch(e => setError(e.response?.data?.title || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    load(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    load('')
  }

  const openCreate = () => { setEditPartner(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (p) => {
    setEditPartner(p)
    setForm({ name: p.name || '', type: p.type || '', status: p.status || 1, contactEmail: p.contactEmail || '', contactPhone: p.contactPhone || '', address: p.address || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const partnerId = editPartner ? (editPartner.id || editPartner.PartnerId || editPartner.partnerId || editPartner._id) : null
      editPartner ? await partnersService.update(partnerId, form) : await partnersService.create(form)
      setShowModal(false); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete partner?')) return
    try { await partnersService.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const toggleStatus = async (p) => {
    const partnerId = p.id || p.PartnerId || p.partnerId || p._id
    const currentStatus = Number(p.status)
    const next = currentStatus === 1 ? 2 : 1
    try { await partnersService.patchStatus(partnerId, next); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger m-3">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">Partners Registry</h5>
          <small className="text-light font-monospace">Vendor Management System</small>
        </div>
        {!hideActions && (
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
            <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2" />Add Partner
            </button>
          </div>
        )}
        {hideActions && (
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="d-flex gap-2 mb-4 p-2 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <input
          type="text"
          className="form-control form-control-sm bg-dark text-light border-secondary rounded-0"
          placeholder="Type search here..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-info btn-sm rounded-0 font-monospace">Search</button>
        {searchInput !== 'a' && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-0 font-monospace"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        )}
      </form>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Name</th>
              <th className="font-monospace text-uppercase small border-secondary">Type</th>
              <th className="font-monospace text-uppercase small border-secondary">Contact Email</th>
              <th className="font-monospace text-uppercase small border-secondary">Contact Phone</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              {!hideActions && <th className="font-monospace text-uppercase small border-secondary">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <React.Fragment key={p.id || p.PartnerId || p.partnerId || p._id}>
                <tr className="border-secondary bg-dark">
                  <td className="text-muted font-monospace border-secondary bg-darker">
                    <button className="btn btn-link btn-sm p-0 me-2 text-info text-decoration-none" onClick={() => setExpandedId(expandedId === (p.id || p.PartnerId || p.partnerId || p._id) ? null : (p.id || p.PartnerId || p.partnerId || p._id))}>
                      <i className={`fa-solid ${expandedId === (p.id || p.PartnerId || p.partnerId || p._id) ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    <span className="text-secondary">{p.name}</span>
                  </td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{getTypeLabel(p.type)}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{p.contactEmail}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{p.contactPhone}</td>
                  <td className="border-secondary bg-darker"><span className={`badge ${getStatusLabel(p.status) === 'Active' ? 'bg-success' : 'bg-secondary'} font-monospace`}>{getStatusLabel(p.status)}</span></td>
                  {!hideActions && (
                    <td className="border-secondary bg-darker">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-warning rounded-0" onClick={() => toggleStatus(p)} title="Toggle status"><i className="fa-solid fa-toggle-on" /></button>
                        <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                        <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(p.id || p.PartnerId || p.partnerId || p._id)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </td>
                  )}
                </tr>
                {expandedId === (p.id || p.PartnerId || p.partnerId || p._id) && (
                  <PartnerInventoryRow partnerId={p.id || p.PartnerId || p.partnerId || p._id} isAdmin={hideActions} />
                )}
              </React.Fragment>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={!hideActions ? 6 : 5} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-handshake me-2"></i>
                  <span className="font-monospace">No partners found in registry.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.8)' }}>
          <div className="modal-dialog">
            <form className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0" onSubmit={handleSubmit}>
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editPartner ? 'Edit Partner' : 'Add Partner'}</h5>
                  <small className="text-light font-monospace">Partner Management System</small>
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
                    <label className="form-label text-white font-monospace text-uppercase small">Type</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.type} onChange={e => setForm(p => ({ ...p, type: Number(e.target.value) }))} required>
                      <option value="" className="bg-dark text-white">-- Select Type --</option>
                      {PARTNER_TYPES.map(t => <option key={t.value} value={t.value} className="bg-dark text-white">{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Status</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.status} onChange={e => setForm(p => ({ ...p, status: Number(e.target.value) }))}>
                      {PARTNER_STATUSES.map(s => <option key={s.value} value={s.value} className="bg-dark text-white">{s.label}</option>)}
                    </select>
                  </div>
                  {[{ key: 'contactEmail', label: 'Contact Email' }, { key: 'contactPhone', label: 'Contact Phone' }, { key: 'address', label: 'Address' }].map(({ key, label }) => (
                    <div key={key}>
                      <label className="form-label text-white font-monospace text-uppercase small">{label}</label>
                      <input className="form-control bg-dark text-white border-secondary rounded-0" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-save me-2"></i>Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PartnerInventoryRow({ partnerId, isAdmin: hideActions }) {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [mediaManager, setMediaManager] = useState({ showMedia: false, itemId: null })
  const [form, setForm] = useState({ itemType: '', description: '', price: '', availability: '', status: 'Available' })

  const INVENTORY_STATUSES = [
    { value: 'Available', label: 'Available' },
    { value: 'Limited', label: 'Limited' },
    { value: 'SoldOut', label: 'Sold Out' },
    { value: 'Unavailable', label: 'Unavailable' },
    { value: 'Maintenance', label: 'Maintenance' },
  ]

  const loadInv = () => {
    if (!partnerId) {
      setLoading(false)
      return Promise.resolve([])
    }
    return partnersService.listInventory(partnerId).then(setInventory).catch(() => { }).finally(() => setLoading(false))
  }
  useEffect(() => { loadInv() }, [partnerId])

  const addItem = async (e) => {
    e.preventDefault()
    if (!partnerId) {
      alert('Partner ID is missing. Cannot add inventory item.')
      return
    }
    try {
      await partnersService.createInventory(partnerId, form)
      setForm({ itemType: '', description: '', price: '', availability: '', status: 'Available' })
      setShowAdd(false)
      loadInv()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const openEditItem = (item) => {
    setEditItem(item)
    setForm({
      itemType: item.itemType || '',
      description: item.description || '',
      price: item.price || '',
      availability: item.availability || '',
      status: item.status ?? 'Available',
    })
    setShowEdit(true)
  }

  const updateItem = async (e) => {
    e.preventDefault()
    if (!partnerId || !editItem) {
      alert('Partner ID or item information is missing.')
      return
    }
    try {
      await partnersService.updateInventory(partnerId, editItem.inventoryId, form)
      setShowEdit(false)
      setEditItem(null)
      setForm({ itemType: '', description: '', price: '', availability: '', status: 'Available' })
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDeleteItem = async (inventoryId) => {
    if (!window.confirm('Delete this inventory item?')) return
    try {
      await partnersService.deleteInventory(partnerId, inventoryId)
      loadInv()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleStatusChange = async (inventoryId, newStatus) => {
    const prev = inventory.find(i => i.inventoryId === inventoryId)
    setInventory(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, status: newStatus } : i))
    try {
      await partnersService.patchInventoryStatus(partnerId, inventoryId, prev?.availability ?? 0, newStatus)
    } catch (err) {
      setInventory(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, status: prev?.status } : i))
      alert(err?.response?.data?.message || err.message)
      loadInv()
    }
  }

  const handleOpenMediaManager = (item) => {
    setMediaManager({ showMedia: true, itemId: item.inventoryId })
  }

  return (
    <tr className="bg-secondary bg-opacity-25 border-secondary">
      <td colSpan={6} className="ps-5 border-secondary">
        <div className="d-flex align-items-center mb-3">
          <i className="fa-solid fa-boxes-stacked text-info me-2"></i>
          <strong className="text-white font-monospace text-uppercase">Inventory Items</strong>
          <div className="ms-auto spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center text-light font-monospace">
            <div className="spinner-border spinner-border-sm me-2" />
            <span>Loading inventory data...</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-dark table-sm rounded-0 border-secondary">
                <thead className="bg-info text-dark">
                  <tr>
                    <th className="font-monospace text-uppercase small border-secondary">Name</th>
                    <th className="font-monospace text-uppercase small border-secondary">Description</th>
                    <th className="font-monospace text-uppercase small border-secondary">Price</th>
                    <th className="font-monospace text-uppercase small border-secondary">Availability</th>
                    <th className="font-monospace text-uppercase small border-secondary">Status</th>
                    {!hideActions && <th className="font-monospace text-uppercase small border-secondary">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(i => (
                    <React.Fragment key={i.inventoryId}>
                      <tr className="border-secondary bg-dark">
                        <td className="text-secondary font-monospace border-secondary bg-darker">{i.itemType}</td>
                        <td className="text-secondary font-monospace border-secondary bg-darker">{i.description}</td>
                        <td className="text-secondary font-monospace border-secondary bg-darker">${i.price}</td>
                        <td className="text-secondary font-monospace border-secondary bg-darker">{i.availability}</td>
                        <td className="border-secondary bg-darker">
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary rounded-0"
                            style={{ width: 100 }}
                            value={i.status}
                            onChange={e => handleStatusChange(i.inventoryId, e.target.value)}
                          >
                            {INVENTORY_STATUSES.map(s => (
                              <option key={s.value} value={s.value} className="bg-dark text-white">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        {!hideActions && (
                          <td className="border-secondary bg-darker">
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-warning rounded-0" onClick={() => openEditItem(i)} title="Edit">
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button className="btn btn-outline-secondary rounded-0" onClick={() => handleOpenMediaManager(i)} title="Media">
                                <i className="fa-solid fa-images" />
                              </button>
                              <button className="btn btn-outline-danger rounded-0" onClick={() => handleDeleteItem(i.inventoryId)} title="Delete">
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {mediaManager.showMedia && mediaManager.itemId === i.inventoryId && (
                        <InventoryMediaManager partnerId={partnerId} inventoryId={i.inventoryId} onClose={() => setMediaManager({ showMedia: false, itemId: null })} onUpdated={loadInv} />
                      )}
                    </React.Fragment>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={!hideActions ? 6 : 5} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                        <i className="fa-solid fa-warehouse me-2"></i>
                        <span className="font-monospace">No inventory items on record.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!showAdd && !showEdit ? (
              !hideActions && (
                <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase mt-2" onClick={() => setShowAdd(true)}>
                  <i className="fa-solid fa-plus me-2" />Add Item
                </button>
              )
            ) : showAdd ? (
              <form onSubmit={addItem} className="d-flex gap-2 flex-wrap mt-2 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary rounded-0"
                  style={{ width: 140 }}
                  placeholder="Name"
                  value={form.itemType}
                  onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))}
                  required
                />
                <textarea
                  className="form-control form-control-sm bg-dark text-white border-secondary rounded-0"
                  style={{ width: 180 }}
                  placeholder="Description"
                  rows={1}
                  value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm bg-dark text-white border-secondary rounded-0"
                  style={{ width: 100 }}
                  placeholder="Price"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  className="form-control form-control-sm bg-dark text-white border-secondary rounded-0"
                  style={{ width: 100 }}
                  placeholder="Availability"
                  value={form.availability}
                  onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
                  required
                />
                <select
                  className="form-select form-select-sm bg-dark text-white border-secondary rounded-0"
                  style={{ width: 140 }}
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  required
                >
                  {INVENTORY_STATUSES.map(s => (
                    <option key={s.value} value={s.value} className="bg-dark text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-info btn-sm rounded-0 font-monospace">Add</button>
                <button type="button" className="btn btn-secondary btn-sm rounded-0 font-monospace" onClick={() => setShowAdd(false)}>Cancel</button>
              </form>
            ) : (
              <form onSubmit={updateItem} className="d-flex gap-2 flex-wrap mt-2 p-3 bg-warning bg-opacity-10 border-warning rounded-0">
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-warning rounded-0"
                  style={{ width: 140 }}
                  placeholder="Name"
                  value={form.itemType}
                  onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))}
                  required
                />
                <textarea
                  className="form-control form-control-sm bg-dark text-white border-warning rounded-0"
                  style={{ width: 180 }}
                  placeholder="Description"
                  rows={1}
                  value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm bg-dark text-white border-warning rounded-0"
                  style={{ width: 100 }}
                  placeholder="Price"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  className="form-control form-control-sm bg-dark text-white border-warning rounded-0"
                  style={{ width: 100 }}
                  placeholder="Availability"
                  value={form.availability}
                  onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
                  required
                />
                <select
                  className="form-select form-select-sm bg-dark text-white border-warning rounded-0"
                  style={{ width: 140 }}
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  required
                >
                  {INVENTORY_STATUSES.map(s => (
                    <option key={s.value} value={s.value} className="bg-dark text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-warning btn-sm rounded-0 font-monospace">Update</button>
                <button type="button" className="btn btn-secondary btn-sm rounded-0 font-monospace" onClick={() => { setShowEdit(false); setEditItem(null) }}>Cancel</button>
              </form>
            )}
          </>
        )}
      </td>
    </tr>
  )
}

function InventoryMediaManager({ partnerId, inventoryId, onClose, onUpdated }) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const loadMedia = () => {
    setLoading(true)
    // Fetch media - the API returns inventory with media array
    partnersService.listInventory(partnerId)
      .then(items => {
        const item = items.find(i => i.inventoryId === inventoryId)
        setMedia(item?.media || [])
      })
      .catch(() => setMedia([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMedia() }, [partnerId, inventoryId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    try {
      await inventoryService.uploadMedia(partnerId, inventoryId, selectedFile)
      setSelectedFile(null)
      alert('Media uploaded successfully!')
      loadMedia()
      onUpdated?.()
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId) => {
    if (!window.confirm('Delete this media?')) return
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/inventory/${inventoryId}/media/${mediaId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('te_auth') ? JSON.parse(localStorage.getItem('te_auth')).token : ''}`
          }
        }
      )


      if (!response.ok) throw new Error('Delete failed')

      alert('Media deleted successfully!')
      loadMedia()
      onUpdated?.()
    } catch (err) {
      alert(err.message || 'Failed to delete media')
    }
  }

  return (
    <div className="container-fluid py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2
            className="fw-bold mb-2"
            style={{ color: "#6f42c1" }}
          >
            <i className="bi bi-building-fill me-2"></i>
            Partner Management
          </h2>

          <p className="text-muted mb-0">
            Vendor Registry & Inventory Management
          </p>
        </div>

        {!hideActions && (
          <button
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: "#6f42c1",
              borderColor: "#6f42c1"
            }}
            onClick={openCreate}
          >
            <i className="bi bi-plus-circle-fill me-2"></i>
            Add Partner
          </button>
        )}
      </div>

      {/* Search */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="d-flex gap-2"
        >
          <input
            type="text"
            className="form-control form-control-sm shadow-sm"
            placeholder="Search partners..."
            style={{ width: 250 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-outline-secondary btn-sm"
          >
            Search
          </button>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: "#6f42c1" }}
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Name</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>

                  {!hideActions && (
                    <th className="text-end pe-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {partners.map((p) => {
                  const partnerId =
                    p.id ||
                    p.PartnerId ||
                    p.partnerId ||
                    p._id

                  return (
                    <React.Fragment key={partnerId}>
                      <tr>
                        <td className="ps-4 fw-semibold">

                          <button
                            className="btn btn-link btn-sm text-decoration-none"
                            onClick={() =>
                              setExpandedId(
                                expandedId === partnerId
                                  ? null
                                  : partnerId
                              )
                            }
                          >
                            <i
                              className={`bi ${expandedId === partnerId
                                  ? "bi-chevron-down"
                                  : "bi-chevron-right"
                                }`}
                            />
                          </button>

                          {p.name}
                        </td>

                        <td>
                          <span
                            className="badge text-white"
                            style={{
                              backgroundColor:
                                "#6f42c1"
                            }}
                          >
                            {getTypeLabel(p.type)}
                          </span>
                        </td>

                        <td>{p.contactEmail}</td>

                        <td>{p.contactPhone}</td>

                        <td>
                          {Number(p.status) === 1 ? (
                            <span className="badge bg-success">
                              Active
                            </span>
                          ) : (
                            <span className="badge bg-danger">
                              Inactive
                            </span>
                          )}
                        </td>

                        {!hideActions && (
                          <td className="text-end pe-4">
                            <div className="d-flex gap-2 justify-content-end">

                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  toggleStatus(p)
                                }
                              >
                                <i className="bi bi-toggle-on" />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  openEdit(p)
                                }
                              >
                                <i className="bi bi-pencil" />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  handleDelete(
                                    partnerId
                                  )
                                }
                              >
                                <i className="bi bi-trash" />
                              </button>

                            </div>
                          </td>
                        )}
                      </tr>

                      {expandedId === partnerId && (
                        <PartnerInventoryRow
                          partnerId={partnerId}
                          isAdmin={hideActions}
                        />
                      )}
                    </React.Fragment>
                  )
                })}

                {partners.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        hideActions ? 5 : 6
                      }
                      className="text-center py-5 text-muted"
                    >
                      <i className="bi bi-building fs-4 d-block mb-2"></i>
                      No partners found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="row mt-5">

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3
                style={{
                  color: "#6f42c1"
                }}
              >
                {partners.length}
              </h3>

              <small className="text-muted">
                Total Partners
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success">
                {
                  partners.filter(
                    (p) =>
                      Number(p.status) === 1
                  ).length
                }
              </h3>

              <small className="text-muted">
                Active Partners
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger">
                {
                  partners.filter(
                    (p) =>
                      Number(p.status) !== 1
                  ).length
                }
              </h3>

              <small className="text-muted">
                Inactive Partners
              </small>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
