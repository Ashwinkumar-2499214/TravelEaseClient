import React, { useEffect, useState } from 'react'
import inventoryService from '../services/inventoryService'
import bookingsService from '../../bookings-reservations/services/bookingsService'
import { useAuth } from '../../authentication/AuthProvider'

const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const checkIn = new Date(startDate)
  const checkOut = new Date(endDate)
  return Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)))
}

const BASE = import.meta.env.VITE_API_BASE_URL

function MediaSlideshow({ media }) {
  const [idx, setIdx] = useState(0)
  const prev = () => setIdx(i => (i - 1 + media.length) % media.length)
  const next = () => setIdx(i => (i + 1) % media.length)
  const m = media[idx]

  return (
    <div style={{ position: 'relative', height: 200, background: '#000' }}>
      {m.mediaType === 'image' ? (
        <img src={`${BASE}${m.url}`} alt={m.fileName} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
      ) : (
        <div className="d-flex align-items-center justify-content-center bg-dark" style={{ height: 200 }}>
          <div className="text-center">
            <i className="fa-solid fa-video text-info" style={{ fontSize: '2rem' }} />
            <p className="text-light mt-2 small">{m.fileName}</p>
          </div>
        </div>
      )}
      {media.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', zIndex: 2 }} className="btn btn-dark btn-sm opacity-75 rounded-circle p-1" type="button">
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button onClick={next} style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', zIndex: 2 }} className="btn btn-dark btn-sm opacity-75 rounded-circle p-1" type="button">
            <i className="fa-solid fa-chevron-right" />
          </button>
          <span style={{ position: 'absolute', bottom: 6, right: 8, zIndex: 2 }} className="badge bg-dark bg-opacity-75">{idx + 1} / {media.length}</span>
        </>
      )}
    </div>
  )
}

export default function InventorySearch() {
  const [items, setItems] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookingItem, setBookingItem] = useState(null)
  const [bookForm, setBookForm] = useState({ startDate: '', endDate: '', numberOfGuests: 1, numberOfRooms: 1, roomType: '', notes: '' })
  const [booking, setBooking] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    inventoryService.getByPartner(1)
      .then(d => {
        const dataArray = d.data || d
        setItems(dataArray)
        setFiltered(dataArray)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(items.filter(i =>
      (i.description || '').toLowerCase().includes(q) ||
      (i.itemType || '').toLowerCase().includes(q)
    ))
  }, [search, items])

  const { currentUser } = useAuth()
  const isTravelAgent = currentUser?.role === 'TravelAgent'

  const handleBook = async (e) => {
    if (isTravelAgent) {
      e.preventDefault()
      return alert('Booking is not allowed for TravelAgent role.')
    }

    e.preventDefault()
    const userId = currentUser?.id
    if (!userId || userId <= 0) {
      alert('Unable to identify current user. Please log in again.')
      return
    }
    setBooking(true)
    try {
      await bookingsService.create({
        userId,
        partnerId: bookingItem.partnerId,
        inventoryId: bookingItem.inventoryId,
        itemType: bookingItem.itemType,
        checkInDate: new Date(bookForm.startDate).toISOString(),
        checkOutDate: new Date(bookForm.endDate).toISOString(),
        numberOfGuests: Number(bookForm.numberOfGuests),
        numberOfRooms: Number(bookForm.numberOfRooms),
        roomType: bookForm.roomType || bookingItem.itemType,
        specialRequests: bookForm.notes,
        amount: bookingItem.price * calculateNights(bookForm.startDate, bookForm.endDate) * Number(bookForm.numberOfRooms || 1),
      })
      alert('Booking created successfully!')
      setBookingItem(null)
      load()
    } catch (err) {
      alert(err?.response?.data?.error || err?.response?.data?.message || err.message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div className="container-fluid py-4">

      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>
            Search Inventory
          </h2>
          <p className="text-muted mb-0 small">Browse travel accommodations and active systems registry</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="fa-solid fa-magnifying-glass" />
            </span>
            <input
              className="form-control border-start-0"
              placeholder="Search by description or type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="row g-4">
        {filtered.map(item => {
          const bookableStatuses = ['Available', 'Limited']
          const isBookable = bookableStatuses.includes(item.status)

          const statusBadgeMap = {
            Available: 'bg-success bg-opacity-10 text-success',
            Limited: 'bg-warning bg-opacity-10 text-warning',
            SoldOut: 'bg-danger bg-opacity-10 text-danger',
            Unavailable: 'bg-secondary bg-opacity-10 text-secondary',
            Maintenance: 'bg-dark bg-opacity-10 text-dark',
          }

          return (
            <div className="col-md-6 col-lg-4" key={item.inventoryId}>
              <div className="card h-100 border-0 shadow-sm overflow-hidden">

                {/* Media Section */}
                {(item.media && item.media.length > 0) ? (
                  <MediaSlideshow media={item.media} />
                ) : (
                  <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                    <div className="text-center text-muted">
                      <i className="fa-solid fa-image opacity-50 mb-2" style={{ fontSize: '2rem' }} />
                      <p className="small mb-0">No media preview available</p>
                    </div>
                  </div>
                )}

                {/* Body Content */}
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                    <span className="text-uppercase tracking-wider text-muted fw-bold small" style={{ fontSize: '0.75rem' }}>
                      {item.itemType}
                    </span>
                    <span className={`badge rounded-pill px-3 ${statusBadgeMap[item.status] ?? 'bg-secondary bg-opacity-10 text-secondary'}`}>
                      {item.status}
                    </span>
                  </div>

                  <h5 className="text-dark fw-bold mb-3">{item.description}</h5>

                  <div className="d-flex flex-column gap-2 mt-auto border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Capacity / Units</span>
                      <span className="fw-semibold text-dark">{item.availability}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Rate per Room</span>
                      <span className="fw-bold fs-5" style={{ color: '#6f42c1' }}>${item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {item.media && item.media.length > 0 && (
                    <div className="mt-3">
                      <small className="text-muted small">
                        <i className="fa-solid fa-photo-film me-2" />
                        {item.media.length} media asset{item.media.length !== 1 ? 's' : ''} attached
                      </small>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="card-footer bg-light p-3 border-0">
                  <button
                    className="btn btn-sm w-100 text-white py-2"
                    style={{
                      backgroundColor: isBookable && !isTravelAgent ? '#6f42c1' : '#6c757d',
                      borderColor: isBookable && !isTravelAgent ? '#6f42c1' : '#6c757d',
                      opacity: isBookable && !isTravelAgent ? 1 : 0.65
                    }}
                    disabled={!isBookable || isTravelAgent}
                    onClick={() => {
                      if (isTravelAgent) return
                      setBookingItem(item);
                      setBookForm({ startDate: '', endDate: '', numberOfGuests: 1, numberOfRooms: 1, roomType: item.itemType || '', notes: '' })
                    }}
                  >
                    <i className="fa-solid fa-calendar-check me-2" />
                    {isTravelAgent ? 'Booking Actions Terminated' : 'Book Room Option'}
                  </button>
                </div>

              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="fa-solid fa-folder-open fs-3 d-block mb-2 opacity-50" />
            <span>No available inventory resources matched your request.</span>
          </div>
        )}
      </div>

      {/* Modal: Room Booking Configuration */}
      {!isTravelAgent && bookingItem && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <form className="modal-content border-0 shadow-lg" onSubmit={handleBook}>

              <div className="modal-header text-white" style={{ backgroundColor: '#6f42c1' }}>
                <div>
                  <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                    <i className="fa-solid fa-hotel me-2 text-white" />
                    Reserve Accommodations
                  </h5>
                  <small className="opacity-75 text-white">{bookingItem.description}</small>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {booking && <div className="spinner-border spinner-border-sm text-light" role="status" />}
                  <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setBookingItem(null)} />
                </div>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        min={new Date().toISOString().slice(0, 10)}
                        value={bookForm.startDate}
                        onChange={e => {
                          const startDate = e.target.value
                          setBookForm(p => {
                            // If user moves start forward past the current end, clamp end to start
                            const endDate = p.endDate && p.endDate < startDate ? startDate : p.endDate
                            return { ...p, startDate, endDate }
                          })
                        }}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        min={bookForm.startDate || new Date().toISOString().slice(0, 10)}
                        value={bookForm.endDate}
                        onChange={e => setBookForm(p => ({ ...p, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Room Type Classification</label>
                    <input className="form-control" value={bookForm.roomType} onChange={e => setBookForm(p => ({ ...p, roomType: e.target.value }))} required />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Total Guests</label>
                      <input type="number" min={1} className="form-control" value={bookForm.numberOfGuests} onChange={e => setBookForm(p => ({ ...p, numberOfGuests: Number(e.target.value) }))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Required Rooms</label>
                      <input type="number" min={1} className="form-control" value={bookForm.numberOfRooms} onChange={e => setBookForm(p => ({ ...p, numberOfRooms: Number(e.target.value) }))} required />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Special Requests & Notes</label>
                    <textarea className="form-control" rows={2} value={bookForm.notes} onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))} placeholder="Dietary adjustments, late check-in hours, extra bedding setups..." />
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setBookingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary text-white" style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }} disabled={booking}>
                  <i className="fa-solid fa-circle-check me-2" />
                  {booking ? 'Processing Request...' : 'Confirm System Reservation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}