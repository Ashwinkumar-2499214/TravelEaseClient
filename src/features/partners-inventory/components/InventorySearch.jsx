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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Search Inventory</h5>
        <input 
          className="form-control w-auto" 
          placeholder="Search by description or type..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ minWidth: 240 }} 
        />
      </div>
      <div className="row g-3">
        {filtered.map(item => {
          const bookableStatuses = ['Available', 'Limited']
          const isBookable = bookableStatuses.includes(item.status)
          const statusBadgeMap = {
            Available: 'bg-success',
            Limited: 'bg-warning text-dark',
            SoldOut: 'bg-danger',
            Unavailable: 'bg-secondary',
            Maintenance: 'bg-dark border border-secondary',
          }

          return (
            <div className="col-md-4" key={item.inventoryId}>
              <div className="card h-100">
                {(item.media && item.media.length > 0) ? (
                  <MediaSlideshow media={item.media} />
                ) : (
                  <div className="bg-secondary d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                    <div className="text-center">
                      <i className="fa-solid fa-image text-secondary" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted mt-2">No media available</p>
                    </div>
                  </div>
                )}
                <div className="card-body">
                  <p className="card-title">{item.itemType}</p>
                  <h6 className="">{item.description}</h6>
                  <p className="mb-1"><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                  <p className="mb-2"><strong>Capacity:</strong> {item.availability}</p>
                  <span className={`badge ${statusBadgeMap[item.status] ?? 'bg-secondary'} mb-2`}>
                    {item.status}
                  </span>
                  {item.media && item.media.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fa-solid fa-photo-film me-1"></i>{item.media.length} media file{item.media.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-primary btn-sm w-100"
                    disabled={!isBookable || isTravelAgent}
                    onClick={() => { 
                      if (isTravelAgent) return
                      setBookingItem(item);
                      setBookForm({ startDate: '', endDate: '', numberOfGuests: 1, numberOfRooms: 1, roomType: item.itemType || '', notes: '' }) 
                    }}>
                    {isTravelAgent ? 'Booking Disabled' : 'Book Now'}
                  </button>

                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="col"><p className="text-muted">No inventory items found.</p></div>}
      </div>

      {!isTravelAgent && bookingItem && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.8)' }}>

          <div className="modal-dialog">
            <form className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0" onSubmit={handleBook}>
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">Book: {bookingItem.description}</h5>
                  <small className="text-light font-monospace">Inventory Reservation System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {booking && <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>}
                  <button type="button" className="btn-close btn-close-white" onClick={() => setBookingItem(null)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Start Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={bookForm.startDate} onChange={e => setBookForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">End Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={bookForm.endDate} onChange={e => setBookForm(p => ({ ...p, endDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Room Type</label>
                    <input className="form-control bg-dark text-white border-secondary rounded-0" value={bookForm.roomType} onChange={e => setBookForm(p => ({ ...p, roomType: e.target.value }))} required />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-white font-monospace text-uppercase small">Guests</label>
                      <input type="number" min={1} className="form-control bg-dark text-white border-secondary rounded-0" value={bookForm.numberOfGuests} onChange={e => setBookForm(p => ({ ...p, numberOfGuests: Number(e.target.value) }))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white font-monospace text-uppercase small">Rooms</label>
                      <input type="number" min={1} className="form-control bg-dark text-white border-secondary rounded-0" value={bookForm.numberOfRooms} onChange={e => setBookForm(p => ({ ...p, numberOfRooms: Number(e.target.value) }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Notes</label>
                    <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={2} value={bookForm.notes} onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setBookingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase" disabled={booking}>
                  <i className="fa-solid fa-calendar-check me-2"></i>{booking ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}