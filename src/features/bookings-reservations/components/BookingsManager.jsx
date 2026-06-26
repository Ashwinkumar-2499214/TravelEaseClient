import React, { useEffect, useState } from 'react'
import bookingsService from '../services/bookingsService'
import { formatDate } from '../../../utils/date'

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed']
const EMPTY = { travelerId: '', inventoryId: '', startDate: '', endDate: '', notes: '' }

export default function BookingsManager({ agentMode = false }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editBooking, setEditBooking] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)

  const load = () => {
    setLoading(true)
    bookingsService.list().then(setBookings).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditBooking(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (b) => {
    setEditBooking(b)
    setForm({ travelerId: b.travelerId || '', inventoryId: b.inventoryId || '', startDate: b.startDate?.slice(0, 10) || '', endDate: b.endDate?.slice(0, 10) || '', notes: b.notes || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      editBooking ? await bookingsService.update(editBooking.id, form) : await bookingsService.create(form)
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
    const map = { Confirmed: 'bg-success', Pending: 'bg-warning text-dark', Cancelled: 'bg-danger', Completed: 'bg-info' }
    return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>
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
              <th className="font-monospace text-uppercase small border-secondary">Reference</th>
              <th className="font-monospace text-uppercase small border-secondary">Start</th>
              <th className="font-monospace text-uppercase small border-secondary">End</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <React.Fragment key={b.id}>
                <tr className="border-secondary">
                  <td className="text-white font-monospace border-secondary">
                    <button className="btn btn-link btn-sm p-0 me-2 text-info text-decoration-none" onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                      <i className={`fa-solid ${expandedId === b.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    {b.reference || b.id}
                  </td>
                  <td className="text-light font-monospace border-secondary">{formatDate(b.startDate)}</td>
                  <td className="text-light font-monospace border-secondary">{formatDate(b.endDate)}</td>
                  <td className="border-secondary">{statusBadge(b.status)}</td>
                  <td className="border-secondary">
                    <select className="form-select form-select-sm bg-dark text-light border-secondary rounded-0" style={{ width: 130 }} value={b.status}
                      onChange={e => handleStatus(b.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-dark text-light">{s}</option>)}
                    </select>
                  </td>
                  <td className="border-secondary">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(b)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(b.id)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === b.id && <ReservationsRow bookingId={b.id} />}
              </React.Fragment>
            ))}
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
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{editBooking ? 'Edit Booking' : 'New Booking'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {agentMode && (
                  <div className="mb-2">
                    <label className="form-label">Traveler ID</label>
                    <input className="form-control" value={form.travelerId} onChange={e => setForm(p => ({ ...p, travelerId: e.target.value }))} />
                  </div>
                )}
                <div className="mb-2">
                  <label className="form-label">Inventory ID</label>
                  <input className="form-control" value={form.inventoryId} onChange={e => setForm(p => ({ ...p, inventoryId: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
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

function ReservationsRow({ bookingId }) {
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
      <td colSpan={6} className="ps-5 border-secondary">
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
                    <th className="font-monospace text-uppercase small border-secondary">ID</th>
                    <th className="font-monospace text-uppercase small border-secondary">Seat</th>
                    <th className="font-monospace text-uppercase small border-secondary">Status</th>
                    <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-secondary">
                      <td className="text-light font-monospace border-secondary">{r.id}</td>
                      <td className="text-light font-monospace border-secondary">{r.seatNumber || '-'}</td>
                      <td className="border-secondary"><span className="badge bg-info text-dark font-monospace">{r.status}</span></td>
                      <td className="border-secondary">
                        <select className="form-select form-select-sm bg-dark text-light border-secondary rounded-0" style={{ width: 130 }} value={r.status}
                          onChange={e => patchStatus(r.id, e.target.value)}>
                          {['Pending', 'Confirmed', 'Cancelled'].map(s => <option key={s} className="bg-dark text-light">{s}</option>)}
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
              <form onSubmit={addRes} className="d-flex gap-2 flex-wrap mt-2">
                <input className="form-control form-control-sm bg-dark text-light border-secondary rounded-0" style={{ width: 160 }} placeholder="Seat Number" value={form.seatNumber} onChange={e => setForm(p => ({ ...p, seatNumber: e.target.value }))} />
                <input className="form-control form-control-sm bg-dark text-light border-secondary rounded-0" style={{ width: 200 }} placeholder="Special Requests" value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
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
