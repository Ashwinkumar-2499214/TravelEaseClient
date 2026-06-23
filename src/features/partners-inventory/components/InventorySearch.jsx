import React, { useEffect, useState } from 'react'
import inventoryService from '../services/inventoryService'
import bookingsService from '../../bookings-reservations/services/bookingsService'

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
      .then(d => { setItems(d); setFiltered(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(items.filter(i => (i.name || '').toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q)))
  }, [search, items])

  const handleBook = async (e) => {
    e.preventDefault()
    setBooking(true)
    try {
      await bookingsService.create({ inventoryId: bookingItem.id, ...bookForm })
      alert('Booking created successfully!')
      setBookingItem(null)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
    finally { setBooking(false) }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Search Inventory</h5>
        <input className="form-control w-auto" placeholder="Search by name or type..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 240 }} />
      </div>
      <div className="row g-3">
        {filtered.map(item => (
          <div className="col-md-4" key={item.id}>
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">{item.name}</h6>
                <p className="text-muted small mb-1">{item.type}</p>
                <p className="mb-1"><strong>Price:</strong> ${item.price}</p>
                <p className="mb-2"><strong>Capacity:</strong> {item.capacity}</p>
                <span className={`badge ${item.isAvailable ? 'bg-success' : 'bg-secondary'} mb-2`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary btn-sm w-100" disabled={!item.isAvailable} onClick={() => { setBookingItem(item); setBookForm({ startDate: '', endDate: '', notes: '' }) }}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col"><p className="text-muted">No inventory items found.</p></div>}
      </div>

      {bookingItem && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleBook}>
              <div className="modal-header">
                <h5 className="modal-title">Book: {bookingItem.name}</h5>
                <button type="button" className="btn-close" onClick={() => setBookingItem(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={bookForm.startDate} onChange={e => setBookForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={bookForm.endDate} onChange={e => setBookForm(p => ({ ...p, endDate: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={bookForm.notes} onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBookingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={booking}>{booking ? 'Booking...' : 'Confirm Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
