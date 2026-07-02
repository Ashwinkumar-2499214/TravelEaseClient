import React, { useEffect, useState } from 'react'
import itinerariesService from '../services/itinerariesService'
import { formatDate } from '../../../utils/date'

const STATUSES = ['Draft', 'Active', 'Completed', 'Cancelled']
const EMPTY = { title: '', description: '', startDate: '', endDate: '' }

export default function ItinerariesManager() {
  const [itins, setItins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItin, setEditItin] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)
  const [shareModal, setShareModal] = useState(null)
  const [shareEmail, setShareEmail] = useState('')

  const load = () => {
    setLoading(true)
    itinerariesService.list()
      .then(setItins)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { 
    setEditItin(null)
    setForm(EMPTY)
    setShowModal(true) 
  }
  
  const openEdit = (i) => {
    setEditItin(i)
    setForm({ 
      title: i.title || '', 
      description: i.description || '', 
      // Safe string conversion fallback before calling .slice()
      startDate: String(i.startDate || '').slice(0, 10), 
      endDate: String(i.endDate || '').slice(0, 10) 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      editItin ? await itinerariesService.update(editItin.id, form) : await itinerariesService.create(form)
      setShowModal(false)
      load()
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete itinerary?')) return
    try { 
      await itinerariesService.remove(id)
      if (expandedId === id) setExpandedId(null) // Clean up expanded row state
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleStatus = async (id, status) => {
    try { 
      await itinerariesService.patchStatus(id, status)
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleExport = async (id) => {
    try {
      const blob = await itinerariesService.export(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `itinerary-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleShare = async (e) => {
    e.preventDefault()
    try {
      await itinerariesService.share(shareModal, { email: shareEmail })
      alert('Itinerary shared!')
      setShareModal(null)
      setShareEmail('')
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const statusBadge = (s) => {
    const map = { Active: 'bg-success', Draft: 'bg-warning text-dark', Completed: 'bg-info', Cancelled: 'bg-danger' }
    return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">Itineraries</h5>
          <small className="text-light font-monospace">Travel Planning System</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2" />New Itinerary
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Title</th>
              <th className="font-monospace text-uppercase small border-secondary">Start</th>
              <th className="font-monospace text-uppercase small border-secondary">End</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {itins.map(i => (
              <React.Fragment key={i.id}>
                <tr className="border-secondary bg-dark">
                  <td className="text-muted font-monospace border-secondary bg-darker">
                    <button className="btn btn-link btn-sm p-0 me-2 text-info text-decoration-none" onClick={() => setExpandedId(expandedId === i.id ? null : i.id)}>
                      <i className={`fa-solid ${expandedId === i.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    <span className="text-secondary">{i.title || i.id}</span>
                  </td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(i.startDate)}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(i.endDate)}</td>
                  <td className="border-secondary bg-darker">{statusBadge(i.status)}</td>
                  <td className="border-secondary bg-darker">
                    <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" style={{ width: 130 }} value={i.status}
                      onChange={e => handleStatus(i.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} className="bg-dark text-white">{s}</option>)}
                    </select>
                  </td>
                  <td className="border-secondary bg-darker">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary rounded-0" title="Export" onClick={() => handleExport(i.id)}><i className="fa-solid fa-download" /></button>
                      <button className="btn btn-outline-warning rounded-0" title="Share" onClick={() => { setShareModal(i.id); setShareEmail('') }}><i className="fa-solid fa-share-nodes" /></button>
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(i)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(i.id)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === i.id && <ItineraryBookingsRow itineraryId={i.id} />}
              </React.Fragment>
            ))}
            {itins.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-map me-2"></i>
                  <span className="font-monospace">No itineraries found in system registry.</span>
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
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editItin ? 'Edit Itinerary' : 'New Itinerary'}</h5>
                  <small className="text-light font-monospace">Travel Planning System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Title</label>
                    <input className="form-control bg-dark text-white border-secondary rounded-0" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Description</label>
                    <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Start Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">End Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-save me-2"></i>Save Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.8)' }}>
          <div className="modal-dialog modal-sm">
            <form className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0" onSubmit={handleShare}>
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">Share Itinerary</h5>
                  <small className="text-light font-monospace">Collaboration System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShareModal(null)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div>
                  <label className="form-label text-white font-monospace text-uppercase small">Recipient Email</label>
                  <input className="form-control bg-dark text-white border-secondary rounded-0" type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShareModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-share-nodes me-2"></i>Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ItineraryBookingsRow({ itineraryId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState('')

  const load = () => {
    setLoading(true)
    itinerariesService.bookings.list(itineraryId)
      .then(setBookings)
      .catch((err) => {
        alert(err?.response?.data?.message || "Failed to load linked bookings.")
      })
      .finally(() => setLoading(false))
  }
  
  useEffect(() => { load() }, [itineraryId])

  const addBooking = async (e) => {
    e.preventDefault()
    try { 
      await itinerariesService.bookings.add(itineraryId, { bookingId })
      setBookingId('')
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const removeBooking = async (bId) => {
    try { 
      await itinerariesService.bookings.remove(itineraryId, bId)
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  return (
    <tr className="bg-secondary bg-opacity-25 border-secondary">
      <td colSpan={6} className="ps-5 border-secondary">
        <div className="d-flex align-items-center mb-3">
          <i className="fa-solid fa-link text-info me-2"></i>
          <strong className="text-white font-monospace text-uppercase">Linked Bookings</strong>
          <div className="ms-auto spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center text-light font-monospace">
            <div className="spinner-border spinner-border-sm me-2" />
            <span>Loading linked bookings...</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-dark table-sm rounded-0 border-secondary">
                <thead className="bg-info text-dark">
                  <tr>
                    <th className="font-monospace text-uppercase small border-secondary">Item Type</th>
                    <th className="font-monospace text-uppercase small border-secondary">Status</th>
                    <th className="font-monospace text-uppercase small border-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-secondary bg-dark">
                      <td className="text-secondary font-monospace border-secondary bg-darker">{b.itemType || b.reference || '-'}</td>
                      <td className="border-secondary bg-darker"><span className="badge bg-info text-dark font-monospace">{b.status}</span></td>
                      <td className="border-secondary bg-darker">
                        <button className="btn btn-outline-danger btn-sm rounded-0" onClick={() => removeBooking(b.id)}><i className="fa-solid fa-minus" /></button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                        <i className="fa-solid fa-clipboard me-2"></i>
                        <span className="font-monospace">No linked bookings on record.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <form onSubmit={addBooking} className="d-flex gap-2 mt-2 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
              <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" style={{ width: 220 }} placeholder="Booking ID to link" value={bookingId} onChange={e => setBookingId(e.target.value)} required />
              <button type="submit" className="btn btn-outline-info btn-sm rounded-0 font-monospace">Link</button>
            </form>
          </>
        )}
      </td>
    </tr>
  )
}