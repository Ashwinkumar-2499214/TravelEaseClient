import React, { useEffect, useState } from 'react'
import bookingsService from '../services/bookingsService'
import inventoryService from '../../partners-inventory/services/inventoryService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'

const STATUS_MAP = { 1: 'Pending', 2: 'Confirmed', 3: 'Cancelled', 4: 'Completed' }
const STATUS_REVERSE = { Pending: 1, Confirmed: 2, Cancelled: 3, Completed: 4 }
const STATUSES = [1, 2, 3, 4]
const EMPTY = { inventoryId: '', bookingDate: '', status: 1 }

export default function BookingsManager({ agentMode = false }) {
  const { currentUser } = useAuth()
  const isAdminOrFinance = ['Admin', 'FinanceOfficer'].includes(currentUser?.role)

  const [bookings, setBookings] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editBooking, setEditBooking] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)

  const load = () => {
    setLoading(true); setError(null)
    const req = isAdminOrFinance
      ? bookingsService.list()
      : bookingsService.get(currentUser?.id)
    req
      .then(data => setBookings(data ? (Array.isArray(data) ? data : [data]) : []))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (currentUser) {
      load()
      inventoryService.listAll().then(data => setInventory(Array.isArray(data) ? data : [])).catch(() => {})
    }
  }, [currentUser])

  const openCreate = () => { setEditBooking(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (b) => {
    setEditBooking(b)
    setForm({ 
      inventoryId: b.inventoryId || '', 
      bookingDate: b.bookingDate?.slice(0, 16) || '', 
      status: b.status || 'Pending' 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedItem = inventory.find(i => i.inventoryId === Number(form.inventoryId) || i.id === Number(form.inventoryId))
      const payload = {
        userId: currentUser.id,
        partnerId: selectedItem?.partnerId,
        inventoryId: Number(form.inventoryId),
        itemType: selectedItem?.itemType || selectedItem?.type,
        bookingDate: new Date(form.bookingDate).toISOString(),
        status: form.status
      }
      editBooking ? await bookingsService.update(editBooking.bookingId ?? editBooking.id, payload) : await bookingsService.create(payload)
      setShowModal(false); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete booking?')) return
    try { await bookingsService.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleStatus = async (id, status) => {
    try { await bookingsService.patchStatus(id, status); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const statusBadge = (s) => {
    const label = STATUS_MAP[Number(s)] || s
    const map = { Confirmed: 'bg-success', Pending: 'bg-warning text-dark', Cancelled: 'bg-danger', Completed: 'bg-info' }
    return <span className={`badge ${map[label] || 'bg-secondary'}`}>{label}</span>
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">{agentMode ? 'Bookings (Agent View)' : 'My Bookings'}</h5>
          <small className="text-light font-monospace">Reservation Management System</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2" />New Booking
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Item Type</th>
              <th className="font-monospace text-uppercase small border-secondary">Booking Date</th>
              <th className="font-monospace text-uppercase small border-secondary">Amount</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const bid = b.bookingId ?? b.id
              return (
              <React.Fragment key={bid}>
                <tr className="border-secondary bg-dark">
                  <td className="text-muted font-monospace border-secondary bg-darker">
                    <button className="btn btn-link btn-sm p-0 me-2 text-info text-decoration-none" onClick={() => setExpandedId(expandedId === bid ? null : bid)}>
                      <i className={`fa-solid ${expandedId === bid ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    <span className="text-secondary">{b.itemType || '-'}</span>
                  </td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(b.bookingDate)}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">${Number(b.amount || 0).toFixed(2)}</td>
                  <td className="border-secondary bg-darker">{statusBadge(b.status)}</td>
                  <td className="border-secondary bg-darker">
                    <select className="form-select form-select-sm bg-dark text-secondary border-secondary rounded-0" style={{ width: 130 }} value={Number(b.status) || 1}
                      onChange={e => handleStatus(bid, Number(e.target.value))}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-dark text-secondary">{STATUS_MAP[s]}</option>)}
                    </select>
                  </td>
                  <td className="border-secondary bg-darker">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(b)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(bid)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === bid && <ReservationsRow bookingId={bid} booking={b} />}
              </React.Fragment>
            )})}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-database me-2"></i>
                  <span className="font-monospace">No bookings found in system registry.</span>
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
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editBooking ? 'Edit Booking' : 'New Booking'}</h5>
                  <small className="text-light font-monospace">Reservation Management System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Select Inventory Item</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.inventoryId} onChange={e => setForm(p => ({ ...p, inventoryId: e.target.value }))} required>
                      <option value="" className="bg-dark text-white">-- Select an item --</option>
                      {inventory.map(item => {
                        const id = item.inventoryId ?? item.id
                        return (
                          <option key={id} value={id} className="bg-dark text-white">
                            [{item.itemType || item.type}] {item.name || item.title || `Item #${id}`}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Booking Date & Time</label>
                    <input type="datetime-local" className="form-control bg-dark text-white border-secondary rounded-0" value={form.bookingDate} onChange={e => setForm(p => ({ ...p, bookingDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Status</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.status} onChange={e => setForm(p => ({ ...p, status: Number(e.target.value) }))}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-dark text-white">{STATUS_MAP[s]}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-save me-2"></i>Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ReservationsRow({ bookingId, booking }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ seatNumber: '', specialRequests: '' })

  const load = () => bookingsService.reservations.forBooking(bookingId).then(setReservations).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [bookingId])

  const addRes = async (e) => {
    e.preventDefault()
    try {
      await bookingsService.reservations.createForBooking(bookingId, form)
      setShowAdd(false); setForm({ seatNumber: '', specialRequests: '' }); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const patchStatus = async (id, status) => {
    try { await bookingsService.reservations.patchStatus(id, status); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  return (
    <tr className="bg-secondary bg-opacity-25 border-secondary">
      <td colSpan={5} className="ps-5 border-secondary">
        <div className="d-flex align-items-center mb-3">
          <i className="fa-solid fa-list-check text-info me-2"></i>
          <strong className="text-white font-monospace text-uppercase">Reservations</strong>
          <div className="ms-auto spinner-grow spinner-grow-sm text-info" role="status"></div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center text-light font-monospace">
            <div className="spinner-border spinner-border-sm me-2" />
            <span>Loading reservation data...</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-dark table-sm rounded-0 border-secondary">
                <thead className="bg-info text-dark">
                  <tr>
                    <th className="font-monospace text-uppercase small border-secondary">Seat</th>
                    <th className="font-monospace text-uppercase small border-secondary">Status</th>
                    <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-secondary bg-dark">
                      <td className="text-secondary font-monospace border-secondary bg-darker">{r.seatNumber || '-'}</td>
                      <td className="border-secondary bg-darker"><span className="badge bg-info text-dark font-monospace">{r.status}</span></td>
                      <td className="border-secondary bg-darker">
                        <select className="form-select form-select-sm bg-dark text-secondary border-secondary rounded-0" style={{ width: 130 }} value={r.status}
                          onChange={e => patchStatus(r.id, e.target.value)}>
                          {['Pending', 'Confirmed', 'Cancelled'].map(s => <option key={s} className="bg-dark text-secondary">{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                        <i className="fa-solid fa-clipboard me-2"></i>
                        <span className="font-monospace">No reservations on record.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!showAdd ? (
              <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase mt-2" onClick={() => setShowAdd(true)}>
                <i className="fa-solid fa-plus me-2" />Add Reservation
              </button>
            ) : (
              <form onSubmit={addRes} className="d-flex gap-2 flex-wrap mt-2 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
                <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" style={{ width: 160 }} placeholder="Seat Number" value={form.seatNumber} onChange={e => setForm(p => ({ ...p, seatNumber: e.target.value }))} />
                <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" style={{ width: 200 }} placeholder="Special Requests" value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
                <button type="submit" className="btn btn-info btn-sm rounded-0 font-monospace">Add</button>
                <button type="button" className="btn btn-secondary btn-sm rounded-0 font-monospace" onClick={() => setShowAdd(false)}>Cancel</button>
              </form>
            )}
          </>
        )}
      </td>
    </tr>
  )
}
