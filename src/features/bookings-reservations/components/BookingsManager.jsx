import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bookingsService from '../services/bookingsService'
import inventoryService from '../../partners-inventory/services/inventoryService'
import billingService from '../../billing-payments/services/billingService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'

const STATUS_MAP = { 1: 'Pending', 2: 'Confirmed', 3: 'Cancelled', 4: 'Completed' }
const STATUSES = [1, 2, 3, 4]
const EMPTY = { inventoryId: '' }

export default function BookingsManager({ agentMode = false }) {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
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
    bookingsService.list(isAdminOrFinance ? {} : { userId: currentUser?.id })
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
    setForm({ inventoryId: b.inventoryId || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedItem = inventory.find(i => Number(i.inventoryId ?? i.id) === Number(form.inventoryId))
      if (!selectedItem) throw new Error('Selected inventory item not found')
      const payload = {
        userId: currentUser.id,
        partnerId: selectedItem.partnerId,
        inventoryId: Number(form.inventoryId),
        itemType: selectedItem.itemType,
        amount: selectedItem.price ?? 0
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

  const handleStatusChange = async (id, newStatus) => {
    try { await bookingsService.patchStatus(id, Number(newStatus)); load() }
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
              <th className="font-monospace text-uppercase small border-secondary">Booked By</th>
              <th className="font-monospace text-uppercase small border-secondary">Booking Date</th>
              <th className="font-monospace text-uppercase small border-secondary">Amount</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
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
                  <td className="text-secondary font-monospace border-secondary bg-darker">
                    <i className="fa-solid fa-user me-1 text-info" />{b.userName || '-'}
                  </td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(b.bookingDate)}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">${Number(b.amount || 0).toFixed(2)}</td>
                  <td className="border-secondary bg-darker">
                    <div className="d-flex align-items-center gap-2">
                      {statusBadge(b.status)}
                      {isAdmin && (
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary rounded-0"
                          style={{ width: 120 }}
                          value={b.status}
                          onChange={e => handleStatusChange(bid, e.target.value)}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s} className="bg-dark text-white">{STATUS_MAP[s]}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="border-secondary bg-darker">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(b)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(bid)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === bid && <ReservationsRow bookingId={bid} booking={b} isAdmin={isAdmin} />}
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

const RES_STATUS_MAP = { 1: 'Pending', 2: 'Confirmed', 3: 'Cancelled' }
const RES_STATUS_OPTIONS = [1, 2, 3]
const PAYMENT_METHOD_MAP = { 1: 'Credit Card', 2: 'Bank Transfer', 3: 'Cash', 4: 'Online' }
const PAYMENT_STATUS_MAP = { 1: 'Pending', 2: 'Completed', 3: 'Failed', 4: 'Refunded' }
const EMPTY_RES = { details: '', startDate: '', endDate: '' }
const EMPTY_PAY = { description: '', dueDate: '' }
const EMPTY_PAYMENT = { paymentMethod: 1, transactionReference: '' }

function ReservationsRow({ bookingId, booking, isAdmin }) {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_RES)
  const [payModal, setPayModal] = useState(false)
  const [payForm, setPayForm] = useState(EMPTY_PAY)
  const [payResult, setPayResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT)
  const [paymentResult, setPaymentResult] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const load = () => bookingsService.reservations.forBooking(bookingId)
    .then(data => setReservations(Array.isArray(data) ? data : data ? [data] : []))
    .catch(() => {})
    .finally(() => setLoading(false))

  const handleResStatusChange = async (reservationId, newStatus) => {
    try { await bookingsService.reservations.patchStatus(reservationId, Number(newStatus)); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  useEffect(() => { load() }, [bookingId])

  const addRes = async (e) => {
    e.preventDefault()
    try {
      await bookingsService.reservations.createForBooking(bookingId, {
        bookingId,
        details: form.details,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
      setShowAdd(false); setForm(EMPTY_RES); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handlePayNow = async (e) => {
    e.preventDefault()
    setPaying(true)
    try {
      const result = await billingService.invoices.create({
        bookingId: Number(bookingId),
        amount: Number(booking?.amount ?? 0),
        dueDate: new Date(payForm.dueDate).toISOString(),
        description: payForm.description,
      })
      setPayResult(result)
      setPaymentForm(EMPTY_PAYMENT)
      setPaymentResult(null)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
    finally { setPaying(false) }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    setSubmittingPayment(true)
    try {
      const result = await billingService.invoices.payments.addPayment(payResult.invoiceId, {
        amount: Number(booking?.amount ?? 0),
        paymentMethod: Number(paymentForm.paymentMethod),
        paymentDate: new Date().toISOString(),
        status: 1,
        transactionReference: paymentForm.transactionReference,
      })
      setPaymentResult(result)
    } catch (err) { alert(err?.response?.data?.message || err.message) }
    finally { setSubmittingPayment(false) }
  }

  return (
    <>
      <tr className="bg-secondary bg-opacity-25 border-secondary">
        <td colSpan={6} className="ps-5 border-secondary">
          <div className="d-flex align-items-center mb-3">
            <i className="fa-solid fa-list-check text-info me-2"></i>
            <strong className="text-white font-monospace text-uppercase">Reservations</strong>
            {!isAdmin && (
              <button className="btn btn-outline-success btn-sm rounded-0 font-monospace text-uppercase ms-3"
                onClick={() => { setPayForm(EMPTY_PAY); setPayResult(null); setPayModal(true) }}>
                <i className="fa-solid fa-credit-card me-2" />Pay Now
              </button>
            )}
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
                      <th className="font-monospace text-uppercase small border-secondary">Details</th>
                      <th className="font-monospace text-uppercase small border-secondary">Start Date</th>
                      <th className="font-monospace text-uppercase small border-secondary">End Date</th>
                      <th className="font-monospace text-uppercase small border-secondary">Status</th>
                      {isAdmin && <th className="font-monospace text-uppercase small border-secondary">Change Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(r => (
                      <tr key={r.reservationId} className="border-secondary bg-dark">
                        <td className="text-secondary font-monospace border-secondary bg-darker">{r.details || '-'}</td>
                        <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(r.startDate)}</td>
                        <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(r.endDate)}</td>
                        <td className="border-secondary bg-darker"><span className="badge bg-info text-dark font-monospace">{RES_STATUS_MAP[r.status] || r.status}</span></td>
                        {isAdmin && (
                          <td className="border-secondary bg-darker">
                            <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" style={{ width: 130 }} value={r.status}
                              onChange={e => handleResStatusChange(r.reservationId, e.target.value)}>
                              {RES_STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-dark text-white">{RES_STATUS_MAP[s]}</option>)}
                            </select>
                          </td>
                        )}
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
                  <input className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" style={{ width: 220 }} placeholder="Details" value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} required />
                  <div>
                    <label className="text-white font-monospace" style={{ fontSize: 11 }}>Start Date</label>
                    <input type="datetime-local" className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="text-white font-monospace" style={{ fontSize: 11 }}>End Date</label>
                    <input type="datetime-local" className="form-control form-control-sm bg-dark text-white border-secondary rounded-0" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                  </div>
                  <div className="d-flex align-items-end gap-2">
                    <button type="submit" className="btn btn-info btn-sm rounded-0 font-monospace">Add</button>
                    <button type="button" className="btn btn-secondary btn-sm rounded-0 font-monospace" onClick={() => setShowAdd(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </td>
      </tr>

      {payModal && (
        <tr>
          <td colSpan={5} className="p-0 border-0">
            <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.85)' }}>
              <div className="modal-dialog">
                <div className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0">
                  <div className="modal-header bg-dark border-secondary">
                    <div>
                      <h5 className="text-white font-monospace text-uppercase mb-1">Create Invoice</h5>
                      <small className="text-light font-monospace">Booking #{bookingId} &mdash; ${Number(booking?.amount ?? 0).toFixed(2)}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="spinner-grow spinner-grow-sm text-success" role="status"></div>
                      <button type="button" className="btn-close btn-close-white" onClick={() => { setPayModal(false); setPayResult(null) }} />
                    </div>
                  </div>

                  {!payResult ? (
                    <form onSubmit={handlePayNow}>
                      <div className="modal-body bg-dark">
                        <div className="d-flex flex-column gap-3">
<div>
                            <label className="form-label text-white font-monospace text-uppercase small">Amount</label>
                            <input className="form-control bg-dark text-secondary border-secondary rounded-0" value={`$${Number(booking?.amount ?? 0).toFixed(2)}`} disabled />
                          </div>
                          <div>
                            <label className="form-label text-white font-monospace text-uppercase small">Due Date</label>
                            <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={payForm.dueDate} onChange={e => setPayForm(p => ({ ...p, dueDate: e.target.value }))} required />
                          </div>
                          <div>
                            <label className="form-label text-white font-monospace text-uppercase small">Description</label>
                            <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={2} value={payForm.description} onChange={e => setPayForm(p => ({ ...p, description: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer bg-dark border-secondary">
                        <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setPayModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-outline-success rounded-0 font-monospace text-uppercase" disabled={paying}>
                          {paying ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-file-invoice-dollar me-2" />}
                          Create Invoice
                        </button>
                      </div>
                    </form>
                  ) : !paymentResult ? (
                    <>
                      <div className="modal-body bg-dark">
                        <div className="alert alert-success rounded-0 font-monospace mb-3">
                          <i className="fa-solid fa-circle-check me-2" />Invoice #{payResult.invoiceId} created — now complete your payment.
                        </div>
                        <form id="paymentForm" onSubmit={handleSubmitPayment}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <label className="form-label text-white font-monospace text-uppercase small">Amount</label>
                              <input className="form-control bg-dark text-secondary border-secondary rounded-0" value={`$${Number(booking?.amount ?? 0).toFixed(2)}`} disabled />
                            </div>
                            <div>
                              <label className="form-label text-white font-monospace text-uppercase small">Payment Method</label>
                              <select className="form-select bg-dark text-white border-secondary rounded-0" value={paymentForm.paymentMethod} onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: Number(e.target.value) }))}>
                                {Object.entries(PAYMENT_METHOD_MAP).map(([k, v]) => <option key={k} value={k} className="bg-dark text-white">{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="form-label text-white font-monospace text-uppercase small">Transaction Reference</label>
                              <input className="form-control bg-dark text-white border-secondary rounded-0" placeholder="e.g. EDZPA5387L" value={paymentForm.transactionReference} onChange={e => setPaymentForm(p => ({ ...p, transactionReference: e.target.value }))} required />
                            </div>
                          </div>
                        </form>
                      </div>
                      <div className="modal-footer bg-dark border-secondary">
                        <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => { setPayModal(false); setPayResult(null) }}>Cancel</button>
                        <button type="submit" form="paymentForm" className="btn btn-outline-success rounded-0 font-monospace text-uppercase" disabled={submittingPayment}>
                          {submittingPayment ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-money-bill-wave me-2" />}
                          Submit Payment
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="modal-body bg-dark">
                      <div className="alert alert-success rounded-0 font-monospace mb-3">
                        <i className="fa-solid fa-circle-check me-2" />Payment processed successfully!
                      </div>
                      <table className="table table-dark table-sm border-secondary rounded-0 mb-3">
                        <tbody>
                          {[
                            ['Payment ID', paymentResult.paymentId],
                            ['Invoice ID', paymentResult.invoiceId],
                            ['Amount', `$${Number(paymentResult.amount).toFixed(2)}`],
                            ['Payment Date', formatDate(paymentResult.paymentDate)],
                            ['Method', PAYMENT_METHOD_MAP[paymentResult.method] || paymentResult.method],
                            ['Status', PAYMENT_STATUS_MAP[paymentResult.status] || paymentResult.status],
                            ['Transaction Ref', paymentResult.transactionReference],
                            ['Created', formatDate(paymentResult.createdDate)],
                          ].map(([label, val]) => (
                            <tr key={label} className="border-secondary">
                              <td className="text-info font-monospace small border-secondary" style={{ width: 140 }}>{label}</td>
                              <td className="text-white font-monospace small border-secondary">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase"
                          onClick={() => { setPayModal(false); setPayResult(null); setPaymentResult(null); navigate('../invoices') }}>
                          <i className="fa-solid fa-file-invoice me-2" />Go to Invoices
                        </button>
                        <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace text-uppercase"
                          onClick={() => { setPayModal(false); setPayResult(null); setPaymentResult(null) }}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
