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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Itineraries</h5>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="fa-solid fa-plus me-1" />New Itinerary
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr><th>Title</th><th>Start</th><th>End</th><th>Status</th><th>Change Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {itins.map(i => (
              <React.Fragment key={i.id}>
                <tr>
                  <td>
                    <button className="btn btn-link btn-sm p-0 me-2 text-decoration-none" onClick={() => setExpandedId(expandedId === i.id ? null : i.id)}>
                      <i className={`fa-solid ${expandedId === i.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    {i.title || i.id}
                  </td>
                  <td>{formatDate(i.startDate)}</td>
                  <td>{formatDate(i.endDate)}</td>
                  <td>{statusBadge(i.status)}</td>
                  <td>
                    <select className="form-select form-select-sm" style={{ width: 130 }} value={i.status}
                      onChange={e => handleStatus(i.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Export" onClick={() => handleExport(i.id)}><i className="fa-solid fa-download" /></button>
                    <button className="btn btn-sm btn-outline-info me-1" title="Share" onClick={() => { setShareModal(i.id); setShareEmail('') }}><i className="fa-solid fa-share-nodes" /></button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(i)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(i.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
                {expandedId === i.id && <ItineraryBookingsRow itineraryId={i.id} />}
              </React.Fragment>
            ))}
            {itins.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No itineraries found.</td></tr>}
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
    <tr className="table-light">
      <td colSpan={6} className="ps-5">
        <strong className="d-block mb-2">Linked Bookings</strong>
        {loading ? <div className="spinner-border spinner-border-sm" /> : (
          <>
            <ul className="list-group list-group-flush mb-2">
              {bookings.map(b => (
                <li key={b.id} className="list-group-item d-flex justify-content-between align-items-center py-1">
                  <span>{b.reference || b.id} — <span className="text-muted small">{b.status}</span></span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeBooking(b.id)}><i className="fa-solid fa-minus" /></button>
                </li>
              ))}
              {bookings.length === 0 && <li className="list-group-item text-muted">No linked bookings.</li>}
            </ul>
            <form onSubmit={addBooking} className="d-flex gap-2 mt-2 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
              <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" style={{ width: 220 }} placeholder="Booking ID to link" value={bookingId} onChange={e => setBookingId(e.target.value)} required />
              <button type="submit" className="btn btn-info btn-sm rounded-0 font-monospace">Link</button>
            </form>
          </>
        )}
      </td>
    </tr>
  )
}