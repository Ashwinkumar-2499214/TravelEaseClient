import React, { useEffect, useState } from 'react'
import inventoryService from '../services/inventoryService'
import bookingsService from '../../bookings-reservations/services/bookingsService'
import { useAuth } from '../../authentication/AuthProvider'

export default function InventorySearch() {
  const [items, setItems] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookingItem, setBookingItem] = useState(null)
  const [bookForm, setBookForm] = useState({ startDate: '', endDate: '', notes: '' })
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    inventoryService.listAll()
      .then(d => { 
        const dataArray = d.data || d; 
        setItems(dataArray); 
        setFiltered(dataArray); 
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(items.filter(i => 
      (i.description || '').toLowerCase().includes(q) || 
      (i.itemType || '').toLowerCase().includes(q)
    ))
  }, [search, items])

  const { currentUser } = useAuth()

  const handleBook = async (e) => {
    e.preventDefault()
    setBooking(true)
    try {
      await bookingsService.create({
        userId: currentUser?.id,
        partnerId: bookingItem.partnerId,
        inventoryId: bookingItem.inventoryId,
        itemType: bookingItem.itemType,
        bookingDate: new Date(bookForm.startDate).toISOString(),
        status: 1,
        amount: bookingItem.price,
        notes: bookForm.notes,
        startDate: bookForm.startDate,
        endDate: bookForm.endDate,
      })
      alert('Booking created successfully!')
      setBookingItem(null)
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
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
          const isAvailable = Number(item.status) === 1; 

          return (
            <div className="col-md-4" key={item.inventoryId}>
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">{item.description}</h6>
                  <p className="text-muted small mb-1">{item.itemType}</p>
                  <p className="mb-1"><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                  <p className="mb-2"><strong>Capacity:</strong> {item.availability}</p>
                  <span className={`badge ${isAvailable ? 'bg-success' : 'bg-secondary'} mb-2`}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-primary btn-sm w-100" 
                    disabled={!isAvailable} 
                    onClick={() => { 
                      setBookingItem(item); 
                      setBookForm({ startDate: '', endDate: '', notes: '' }) 
                    }}>
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="col"><p className="text-muted">No inventory items found.</p></div>}
      </div>

      {bookingItem && (
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