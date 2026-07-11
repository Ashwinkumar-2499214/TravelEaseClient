import React, { useEffect, useState } from 'react'
import { useAuth } from '../../authentication/AuthProvider'
import partnersService from '../services/partnersService'
import inventoryService from '../services/inventoryService'

const PARTNER_TYPES = [
  { value: 1, label: 'Hotel' },
  { value: 2, label: 'Transport Provider' },
  { value: 3, label: 'Tour Operator' }
]
const PARTNER_STATUSES = [
  { value: 1, label: 'Active' },
  { value: 2, label: 'Inactive' }
]

const getTypeLabel = (val) => PARTNER_TYPES.find(t => t.value === Number(val))?.label ?? val
const getStatusLabel = (val) => PARTNER_STATUSES.find(s => s.value === Number(val))?.label ?? val
const getPartnerId = (p) => p?.id || p?.PartnerId || p?.partnerId || p?._id || ''

const EMPTY_PARTNER_FORM = { name: '', type: '', status: 1, contactEmail: '', contactPhone: '', address: '' }

export default function PartnersManager({ agentMode = false }) {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const hideActions = isAdmin && !agentMode

  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editPartner, setEditPartner] = useState(null)
  const [form, setForm] = useState(EMPTY_PARTNER_FORM)
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

  const openCreate = () => {
    setEditPartner(null)
    setForm(EMPTY_PARTNER_FORM)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditPartner(p)
    setForm({
      name: p.name || '',
      type: p.type || '',
      status: p.status || 1,
      contactEmail: p.contactEmail || '',
      contactPhone: p.contactPhone || '',
      address: p.address || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const partnerId = getPartnerId(editPartner)
      editPartner ? await partnersService.update(partnerId, form) : await partnersService.create(form)
      setShowModal(false)
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return
    try {
      await partnersService.remove(id)
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const toggleStatus = async (p) => {
    const partnerId = getPartnerId(p)
    const currentStatus = Number(p.status)
    const next = currentStatus === 1 ? 2 : 1
    try {
      await partnersService.patchStatus(partnerId, next)
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#6f42c1' }} role="status" />
      </div>
    )
  }

  if (error) return <div className="alert alert-danger m-4 shadow-sm border-0">{error}</div>

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#fdfbfe', minHeight: '100vh' }}>

      {/* Header Card */}
      <div className="d-flex justify-content-between align-items-center mb-4 px-4 py-3 bg-white rounded shadow-sm border-start border-4" style={{ borderColor: '#6f42c1' }}>
        <div>
          <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.25rem' }}>
            <i className="fa-solid fa-handshake me-2" style={{ color: '#6f42c1' }} />Partners & Vendors Directory
          </h5>
          <span className="text-muted fw-medium small text-uppercase tracking-wider">
            Manage your service providers and inventory
          </span>
        </div>
        {!hideActions && (
          <button className="btn text-white btn-sm px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: '#6f42c1', borderRadius: '6px' }} onClick={openCreate}>
            <i className="text-white fa-solid fa-plus small" /> Add Partner
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white rounded">
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white text-muted border-end-0"><i className="fa-solid fa-magnifying-glass" /></span>
            <input
              type="text"
              className="form-control form-control-sm border-start-0 ps-0 text-dark fw-normal"
              placeholder="Search partners by name or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-sm btn-outline-secondary px-4 text-nowrap">Search</button>
          {searchInput && (
            <button type="button" className="btn btn-sm btn-light px-3 border" onClick={handleClearSearch}>Clear</button>
          )}
        </form>
      </div>

      {/* Main Partners Table Wrapper with Rounded Border Radius */}
      <div className="card border shadow-sm rounded-3 overflow-hidden bg-white mb-4" style={{ borderColor: '#e9ecef' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light border-bottom border-secondary-subtle">
              <tr>
                <th className="ps-4 py-3 small fw-bold text-dark text-uppercase">Partner Name</th>
                <th className="py-3 small fw-bold text-dark text-uppercase">Type</th>
                <th className="py-3 small fw-bold text-dark text-uppercase">Email Address</th>
                <th className="py-3 small fw-bold text-dark text-uppercase">Phone Number</th>
                <th className="py-3 small fw-bold text-dark text-uppercase">Status</th>
                {!hideActions && <th className="pe-4 py-3 small fw-bold text-dark text-uppercase text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {partners.map(p => {
                const partnerId = getPartnerId(p)
                const isExpanded = expandedId === partnerId
                return (
                  <React.Fragment key={partnerId}>
                    <tr className={isExpanded ? 'bg-light bg-opacity-50' : ''} style={{ borderBottom: '1px solid #f3effb' }}>
                      <td className="ps-4 fw-semibold text-dark">
                        <button className="btn btn-link btn-sm p-0 me-2 text-decoration-none" style={{ color: '#6f42c1' }} onClick={() => setExpandedId(isExpanded ? null : partnerId)}>
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                        </button>
                        {p.name}
                      </td>
                      <td>
                        <span className="badge px-2 py-1.5 fw-semibold text-white" style={{ backgroundColor: '#6f42c1', fontSize: '0.75rem' }}>{getTypeLabel(p.type)}</span>
                      </td>
                      <td className="text-dark fw-normal">{p.contactEmail || '—'}</td>
                      <td className="text-dark fw-normal">{p.contactPhone || '—'}</td>
                      <td>
                        <span className={`badge px-2.5 py-1.5 rounded fw-semibold ${Number(p.status) === 1 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-muted border border-secondary-subtle'}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      {!hideActions && (
                        <td className="pe-4 text-end">
                          <div className="btn-group shadow-sm border rounded bg-white">
                            <button className="btn btn-white btn-sm border-0 px-2.5 text-secondary" onClick={() => toggleStatus(p)} title="Toggle Status"><i className="fa-solid fa-toggle-on" /></button>
                            <button className="btn btn-white btn-sm border-0 border-start px-2.5 text-primary" onClick={() => openEdit(p)} title="Edit"><i className="fa-solid fa-pen" /></button>
                            <button className="btn btn-white btn-sm border-0 border-start px-2.5 text-danger" onClick={() => handleDelete(partnerId)} title="Delete"><i className="fa-solid fa-trash" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <PartnerInventoryRow partnerId={partnerId} isAdmin={hideActions} />
                    )}
                  </React.Fragment>
                )
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={hideActions ? 5 : 6} className="text-center py-5 text-muted">
                    <i className="fa-solid fa-circle-info fs-5 d-block mb-2 text-muted" />
                    No partners found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm py-3 px-4 text-center bg-white rounded">
            <span className="fw-bold text-dark h4 mb-1">{partners.length}</span>
            <div className="text-muted fw-semibold small text-uppercase tracking-wider">Total Partners</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm py-3 px-4 text-center bg-white rounded">
            <span className="fw-bold text-success h4 mb-1">{partners.filter(p => Number(p.status) === 1).length}</span>
            <div className="text-muted fw-semibold small text-uppercase tracking-wider">Active Partners</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm py-3 px-4 text-center bg-white rounded">
            <span className="fw-bold text-secondary h4 mb-1">{partners.filter(p => Number(p.status) !== 1).length}</span>
            <div className="text-muted fw-semibold small text-uppercase tracking-wider">Inactive Partners</div>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg bg-white rounded" onSubmit={handleSubmit}>
              <div className="modal-header border-bottom text-white px-4 py-3" style={{ backgroundColor: '#6f42c1' }}>
                <h6 className="modal-title fw-bold text-white">{editPartner ? 'Edit Partner Details' : 'Add New Partner'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4 text-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-dark small fw-bold text-uppercase">Partner Name</label>
                    <input className="form-control text-dark fw-normal" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-dark small fw-bold text-uppercase">Partner Type</label>
                    <select className="form-select text-dark fw-normal" value={form.type} onChange={e => setForm(p => ({ ...p, type: Number(e.target.value) }))} required>
                      <option value="">-- Select Partner Type --</option>
                      {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-dark small fw-bold text-uppercase">Status</label>
                    <select className="form-select text-dark fw-normal" value={form.status} onChange={e => setForm(p => ({ ...p, status: Number(e.target.value) }))}>
                      {PARTNER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  {[{ key: 'contactEmail', label: 'Email Address', type: 'email' }, { key: 'contactPhone', label: 'Phone Number', type: 'text' }, { key: 'address', label: 'Physical Address', type: 'text' }].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="form-label text-dark small fw-bold text-uppercase">{label}</label>
                      <input type={type} className="form-control text-dark fw-normal" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light px-4 py-3 border-top">
                <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm text-white px-4 shadow-sm" style={{ backgroundColor: '#6f42c1' }}>Save Changes</button>
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

  const EMPTY_INV_FORM = { itemType: '', description: '', price: '', availability: '', status: 'Available' }
  const [form, setForm] = useState(EMPTY_INV_FORM)

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
      return
    }
    setLoading(true)
    partnersService.listInventory(partnerId)
      .then(setInventory)
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadInv() }, [partnerId])

  const addItem = async (e) => {
    e.preventDefault()
    try {
      await partnersService.createInventory(partnerId, form)
      setForm(EMPTY_INV_FORM)
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
    try {
      await partnersService.updateInventory(partnerId, editItem.inventoryId, form)
      setShowEdit(false)
      setEditItem(null)
      setForm(EMPTY_INV_FORM)
      loadInv()
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
    setInventory(items => items.map(i => i.inventoryId === inventoryId ? { ...i, status: newStatus } : i))
    try {
      await partnersService.patchInventoryStatus(partnerId, inventoryId, prev?.availability ?? 0, newStatus)
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
      loadInv()
    }
  }

  return (
    <tr style={{ backgroundColor: '#faf8fd' }}>
      <td colSpan={6} className="p-4 border-top border-bottom">
        <div className="card shadow-sm border rounded-3 overflow-hidden bg-white p-3">
          <div className="d-flex align-items-center mb-3 pb-2 border-bottom">
            <h6 className="fw-bold mb-0 text-dark small text-uppercase tracking-wider">
              <i className="fa-solid fa-boxes-stacked me-2" style={{ color: '#6f42c1' }} /> Partner Inventory List
            </h6>
          </div>

          {loading ? (
            <div className="text-secondary py-2 small fw-normal">
              <div className="spinner-border spinner-border-sm me-2" style={{ color: '#6f42c1' }} />
              Loading inventory items...
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light text-dark small">
                    <tr>
                      <th className="py-2 text-dark fw-bold">Item Type</th>
                      <th className="py-2 text-dark fw-bold">Description</th>
                      <th className="py-2 text-dark fw-bold">Price</th>
                      <th className="py-2 text-dark fw-bold">Quantity</th>
                      <th className="py-2 text-dark fw-bold">Status</th>
                      {!hideActions && <th className="py-2 text-dark fw-bold text-end pe-3">Controls</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(i => (
                      <React.Fragment key={i.inventoryId}>
                        <tr style={{ borderBottom: '1px solid #f9f8fc' }}>
                          <td className="fw-semibold text-dark">{i.itemType}</td>
                          <td className="text-dark fw-semibold">{i.description}</td>
                          <td className="text-dark fw-semibold">${Number(i.price).toFixed(2)}</td>
                          <td className="text-dark fw-semibold">{i.availability}</td>
                          <td>
                            <select
                              className="form-select form-select-sm w-auto border-secondary-subtle text-dark fw-normal"
                              value={i.status}
                              onChange={e => handleStatusChange(i.inventoryId, e.target.value)}
                            >
                              {INVENTORY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </td>
                          {!hideActions && (
                            <td className="text-end pe-3">
                              <div className="btn-group shadow-sm border rounded bg-white">
                                <button className="btn btn-sm text-primary px-2.5 py-1" onClick={() => openEditItem(i)} title="Edit"><i className="fa-solid fa-pen small" /></button>
                                <button className="btn btn-sm text-secondary border-start px-2.5 py-1" onClick={() => setMediaManager({ showMedia: true, itemId: i.inventoryId })} title="Media Gallery"><i className="fa-solid fa-images small" /></button>
                                <button className="btn btn-sm text-danger border-start px-2.5 py-1" onClick={() => handleDeleteItem(i.inventoryId)} title="Delete"><i className="fa-solid fa-trash small" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                        {mediaManager.showMedia && mediaManager.itemId === i.inventoryId && (
                          <tr>
                            <td colSpan={6} className="p-2 bg-light border-0">
                              <InventoryMediaManager partnerId={partnerId} inventoryId={i.inventoryId} onClose={() => setMediaManager({ showMedia: false, itemId: null })} onUpdated={loadInv} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {inventory.length === 0 && (
                      <tr>
                        <td colSpan={hideActions ? 5 : 6} className="text-center text-muted py-3 small">
                          No inventory items configured for this partner.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!showAdd && !showEdit ? (
                !hideActions && (
                  <button className="btn btn-sm mt-3 px-3 fw-semibold text-white" style={{ backgroundColor: '#6f42c1', fontSize: '0.75rem' }} onClick={() => setShowAdd(true)}>
                    <i className="fa-solid fa-plus me-1" /> Add Inventory Item
                  </button>
                )
              ) : (
                <form onSubmit={showAdd ? addItem : updateItem} className="mt-3 p-3 border rounded d-flex gap-2 flex-wrap bg-light border-secondary-subtle">
                  <input type="text" className="form-control form-control-sm text-dark fw-normal flex-fill" placeholder="Item Type" value={form.itemType} onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))} required />
                  <input type="text" className="form-control form-control-sm text-dark fw-normal flex-fill" placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
                  <input type="number" step="0.01" className="form-control form-control-sm text-dark fw-semibold" style={{ width: 100 }} placeholder="Price ($)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
                  <input type="number" className="form-control form-control-sm text-dark fw-semibold" style={{ width: 90 }} placeholder="Qty" value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} required />
                  <select className="form-select form-select-sm text-dark fw-normal w-auto" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} required>
                    {INVENTORY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button type="submit" className="btn btn-sm text-white px-3 fw-semibold" style={{ backgroundColor: '#6f42c1' }}>{showEdit ? 'Update' : 'Add'}</button>
                  <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => { setShowAdd(false); setShowEdit(false); setForm(EMPTY_INV_FORM); }}>Cancel</button>
                </form>
              )}
            </>
          )}
        </div>
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
    if (!selectedFile) return alert('Please select an asset to upload.')
    setUploading(true)
    try {
      await inventoryService.uploadMedia(partnerId, inventoryId, selectedFile)
      setSelectedFile(null)
      loadMedia()
      onUpdated?.()
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Media upload failed.')
    } finally { setUploading(false) }
  }

  const handleDelete = async (mediaId) => {
    if (!window.confirm('Delete this media asset?')) return
    try {
      const tokenObj = localStorage.getItem('te_auth') ? JSON.parse(localStorage.getItem('te_auth')) : null
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/inventory/${inventoryId}/media/${mediaId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${tokenObj ? tokenObj.token : ''}` }
        }
      )
      if (!response.ok) throw new Error('Delete request rejected by server.')
      loadMedia()
      onUpdated?.()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="bg-white p-3 border rounded border-secondary-subtle mt-2">
      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
        <span className="small text-dark fw-semibold"><i className="fa-solid fa-photo-film me-2" style={{ color: '#6f42c1' }} />Media Assets Gallery</span>
        <button type="button" className="btn-close small" style={{ fontSize: '0.75rem' }} onClick={onClose} />
      </div>

      {loading ? (
        <p className="text-secondary small fw-normal">Loading media files...</p>
      ) : (
        <div>
          <div className="d-flex gap-2 flex-wrap mb-3">
            {media.map((m) => (
              <div key={m.id || m.mediaId} className="position-relative border rounded overflow-hidden shadow-sm" style={{ width: 80, height: 80, backgroundColor: '#f8f9fa' }}>
                <img src={m.url || m.fileUrl} alt="Asset preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 px-1 rounded-0" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(m.id || m.mediaId)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
            {media.length === 0 && <p className="text-muted small align-self-center mb-0 ps-1">No media assets uploaded yet.</p>}
          </div>

          <form onSubmit={handleUpload} className="d-flex gap-2 align-items-center" style={{ maxWidth: '400px' }}>
            <input type="file" className="form-control form-control-sm text-dark fw-normal" onChange={e => setSelectedFile(e.target.files[0])} disabled={uploading} />
            <button type="submit" className="btn btn-sm text-white px-3 fw-semibold text-nowrap" style={{ backgroundColor: '#6f42c1' }} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}