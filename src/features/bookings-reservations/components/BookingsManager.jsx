import React, { useEffect, useMemo, useState } from 'react'
import bookingsService from '../services/bookingsService'
import inventoryService from '../../partners-inventory/services/inventoryService'
import billingService from '../../billing-payments/services/billingService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'

const calculateNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  return Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)))
}

const STATUS_MAP = { 1: 'Pending', 2: 'Confirmed', 3: 'Cancelled', 4: 'Completed' }
const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'SUITE']
const STATUSES = [1, 2, 3, 4]
const EMPTY_FORM = {
  inventoryId: '',
  checkInDate: '',
  checkOutDate: '',
  numberOfGuests: 1,
  numberOfRooms: 1,
  roomType: '',
  specialRequests: '',
}

export default function BookingsManager({ agentMode = false, approvalMode = false, pendingOnly = false }) {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'Admin'
  const isAdminOrFinance = ['Admin', 'FinanceOfficer'].includes(currentUser?.role)
  const isTravelAgent = currentUser?.role === 'TravelAgent'


  const [bookings, setBookings] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editBooking, setEditBooking] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payBooking, setPayBooking] = useState(null)
  const [payForm, setPayForm] = useState({ dueDate: '', description: '' })
  const [payResult, setPayResult] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: 1, transactionReference: '', gatewayProvider: '' })
  const [paymentResult, setPaymentResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)

const load = () => {
    setLoading(true)
    setError(null)

    // CorporateTravelManager should see bookings for all users.
    // Admin/Finance also see all bookings.
    // BookingsManager (including approvals) relies on bookingsService.list() for data.
    return bookingsService.list().
      then(data => {
        const list = data ? (Array.isArray(data) ? data : [data]) : []
        if (pendingOnly) {
          setBookings(list.filter((b) => Number(b.status) === 1 || b.status === 'Pending'))
        } else {
          setBookings(list)
        }
      })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (currentUser) {
      load()
      inventoryService.listAll().then(data => setInventory(Array.isArray(data) ? data : [])).catch(() => {})
    }
  }, [currentUser])

  const openCreate = () => {
    if (isTravelAgent) return
    setEditBooking(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }


  const openEdit = (booking) => {
    setEditBooking(booking)
    setForm({
      inventoryId: booking.inventoryId || '',
      checkInDate: booking.checkInDate ? booking.checkInDate.slice(0, 10) : '',
      checkOutDate: booking.checkOutDate ? booking.checkOutDate.slice(0, 10) : '',
      numberOfGuests: booking.numberOfGuests || 1,
      numberOfRooms: booking.numberOfRooms || 1,
      roomType: booking.roomType || '',
      specialRequests: booking.specialRequests || '',
    })
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
        itemType: selectedItem.itemType ?? selectedItem.type,
        checkInDate: new Date(form.checkInDate).toISOString(),
        checkOutDate: new Date(form.checkOutDate).toISOString(),
        numberOfGuests: Number(form.numberOfGuests),
        numberOfRooms: Number(form.numberOfRooms),
        roomType: form.roomType,
        specialRequests: form.specialRequests,
        amount: bookingAmountEstimate,
      }

      if (editBooking) {
        await bookingsService.update(editBooking.bookingId ?? editBooking.id, payload)
      } else {
        await bookingsService.create(payload)
      }

      setShowModal(false)
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete booking?')) return
    try {
      await bookingsService.remove(id)
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await bookingsService.patchStatus(id, Number(newStatus))
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const bookingAmountEstimate = useMemo(() => {
    const selectedItem = inventory.find(i => Number(i.inventoryId ?? i.id) === Number(form.inventoryId))
    if (!selectedItem || !form.checkInDate || !form.checkOutDate) return 0
    const nights = calculateNights(form.checkInDate, form.checkOutDate)
    const price = Number(selectedItem.price ?? selectedItem.amount ?? 0)
    return nights * price * Number(form.numberOfRooms || 1)
  }, [form, inventory])

  const openPay = (booking) => {
    setPayBooking(booking)
    setShowPayModal(true)
    setPayResult(null)
    setPaymentResult(null)
    setPayForm({ dueDate: '', description: '' })
    setPaymentForm({ paymentMethod: 1, transactionReference: '', gatewayProvider: '' })
  }

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    if (!payBooking) return
    setPaying(true)
    try {
      const payload = {
        bookingId: Number(payBooking.bookingId ?? payBooking.id),
        amount: Number(payBooking.amount ?? 0),
        baseAmount: Number(payBooking.amount ?? 0),
        taxAmount: 0,
        discountAmount: 0,
        dueDate: new Date(payForm.dueDate).toISOString(),
        description: payForm.description,
      }
      const result = await billingService.invoices.create(payload)
      setPayResult(result)
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    } finally {
      setPaying(false)
    }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    if (!payBooking || !payResult) return
    setSubmittingPayment(true)
    try {
      const payload = {
        userId: currentUser.id,
        invoiceId: Number(payResult.invoiceId ?? payResult.id),
        bookingId: Number(payBooking.bookingId ?? payBooking.id),
        amount: Number(payBooking.amount ?? 0),
        currency: 'INR',
        method: Number(paymentForm.paymentMethod),
        transactionReference: paymentForm.transactionReference,
        gatewayProvider: paymentForm.gatewayProvider,
        billingName: currentUser.name || currentUser.email,
        billingEmail: currentUser.email,
        billingPhone: '',
        notes: '',
      }
      const result = await billingService.invoices.payments.addPayment(payload.invoiceId, payload)
      setPaymentResult(result)
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    } finally {
      setSubmittingPayment(false)
    }
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
          <small className="text-light font-monospace">Hotel Booking Management</small>
        </div>
                  <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          {!isTravelAgent && (
            <button
              className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase"
              onClick={openCreate}
            >
              <i className="fa-solid fa-plus me-2" />New Booking
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Hotel</th>
              <th className="font-monospace text-uppercase small border-secondary">Room Type</th>
              <th className="font-monospace text-uppercase small border-secondary">Check-In</th>
              <th className="font-monospace text-uppercase small border-secondary">Check-Out</th>
              <th className="font-monospace text-uppercase small border-secondary">Nights</th>
              <th className="font-monospace text-uppercase small border-secondary">Guests</th>
              <th className="font-monospace text-uppercase small border-secondary">Rooms</th>
              <th className="font-monospace text-uppercase small border-secondary">Amount</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const bid = booking.bookingId ?? booking.id
              return (
                <React.Fragment key={bid}>
                  <tr className="border-secondary bg-dark">
                    <td className="text-secondary font-monospace border-secondary bg-darker">{booking.itemType || booking.hotelName || '-'}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{booking.roomType || '-'}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(booking.checkInDate)}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(booking.checkOutDate)}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{booking.numberOfNights ?? ''}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{booking.numberOfGuests ?? '-'}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">{booking.numberOfRooms ?? '-'}</td>
                    <td className="text-secondary font-monospace border-secondary bg-darker">${Number(booking.amount || 0).toFixed(2)}</td>
                    <td className="border-secondary bg-darker">
                      <div className="d-flex align-items-center gap-2">
                        {statusBadge(booking.status)}
                        {(approvalMode || (!agentMode && isAdmin)) && (
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary rounded-0"
                            style={{ width: 140 }}
                            value={booking.status}
                            onChange={(e) => handleStatusChange(bid, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-dark text-white">
                                {STATUS_MAP[s]}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="border-secondary bg-darker">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary rounded-0" onClick={() => setExpandedId(expandedId === bid ? null : bid)}>
                          <i className={`fa-solid ${expandedId === bid ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                        </button>
                        <button
                          className="btn btn-outline-info rounded-0"
                          onClick={() => openEdit(booking)}
                          disabled={isTravelAgent}
                          title={isTravelAgent ? 'Not allowed for TravelAgent' : 'Edit booking'}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="btn btn-outline-success rounded-0"
                          onClick={() => openPay(booking)}
                          disabled={isTravelAgent}
                          title={isTravelAgent ? 'Not allowed for TravelAgent' : 'Create invoice/payment'}
                        >
                          <i className="fa-solid fa-credit-card" />
                        </button>
                        <button
                          className="btn btn-outline-danger rounded-0"
                          onClick={() => handleDelete(bid)}
                          disabled={isTravelAgent}
                          title={isTravelAgent ? 'Not allowed for TravelAgent' : 'Delete booking'}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === bid && (
                    <tr className="bg-secondary bg-opacity-25 border-secondary">
                      <td colSpan={10} className="ps-4 border-secondary">
                        <div className="d-flex flex-column gap-2 text-white font-monospace">
                          <div><strong>Booked By:</strong> {booking.userName || currentUser?.name || '-'}</div>
                          <div><strong>Booking Date:</strong> {formatDate(booking.bookingDate)}</div>
                          <div><strong>Special Requests:</strong> {booking.specialRequests || '-'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
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
                  <small className="text-light font-monospace">Hotel Booking Management</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="row gy-3">
                  <div className="col-12">
                    <label className="form-label text-white font-monospace text-uppercase small">Select Hotel Room</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.inventoryId} onChange={(e) => setForm((prev) => ({ ...prev, inventoryId: e.target.value }))} required>
                      <option value="" className="bg-dark text-white">-- Select a hotel room --</option>
                      {inventory.map((item) => {
                        const id = item.inventoryId ?? item.id
                        return (
                          <option key={id} value={id} className="bg-dark text-white">
                            [{item.itemType || item.type}] {item.name || item.title || `Item #${id}`} — ${Number(item.price ?? item.amount ?? 0).toFixed(2)}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-white font-monospace text-uppercase small">Check-In</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.checkInDate} onChange={(e) => setForm((prev) => ({ ...prev, checkInDate: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-white font-monospace text-uppercase small">Check-Out</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.checkOutDate} onChange={(e) => setForm((prev) => ({ ...prev, checkOutDate: e.target.value }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white font-monospace text-uppercase small">Guests</label>
                    <input type="number" min={1} className="form-control bg-dark text-white border-secondary rounded-0" value={form.numberOfGuests} onChange={(e) => setForm((prev) => ({ ...prev, numberOfGuests: Number(e.target.value) }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white font-monospace text-uppercase small">Rooms</label>
                    <input type="number" min={1} className="form-control bg-dark text-white border-secondary rounded-0" value={form.numberOfRooms} onChange={(e) => setForm((prev) => ({ ...prev, numberOfRooms: Number(e.target.value) }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white font-monospace text-uppercase small">Room Type</label>
                    <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.roomType} onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))} required>
                      <option value="">-- Select --</option>
                      {ROOM_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-white font-monospace text-uppercase small">Special Requests</label>
                    <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={3} value={form.specialRequests} onChange={(e) => setForm((prev) => ({ ...prev, specialRequests: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-secondary rounded-0 mb-0 font-monospace small">
                      Estimated amount: <strong>${bookingAmountEstimate.toFixed(2)}</strong>
                    </div>
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

      {showPayModal && payBooking && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.85)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0">
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">Create Invoice</h5>
                  <small className="text-light font-monospace">Booking #{payBooking.bookingId ?? payBooking.id} — ${Number(payBooking.amount ?? 0).toFixed(2)}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayModal(false)} />
              </div>
              <div className="modal-body bg-dark">
                {!payResult ? (
                  <form onSubmit={handleCreateInvoice}>
                    <div className="row gy-3">
                      <div className="col-md-6">
                        <label className="form-label text-white font-monospace text-uppercase small">Amount</label>
                        <input className="form-control bg-dark text-secondary border-secondary rounded-0" value={`$${Number(payBooking.amount ?? 0).toFixed(2)}`} disabled />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-white font-monospace text-uppercase small">Due Date</label>
                        <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={payForm.dueDate} onChange={(e) => setPayForm((prev) => ({ ...prev, dueDate: e.target.value }))} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label text-white font-monospace text-uppercase small">Description</label>
                        <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={3} value={payForm.description} onChange={(e) => setPayForm((prev) => ({ ...prev, description: e.target.value }))} />
                      </div>
                    </div>
                    <div className="modal-footer bg-dark border-secondary">
                      <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowPayModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-outline-success rounded-0 font-monospace text-uppercase" disabled={paying}>
                        {paying ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-file-invoice-dollar me-2" />}Create Invoice
                      </button>
                    </div>
                  </form>
                ) : !paymentResult ? (
                  <>
                    <div className="alert alert-success rounded-0 font-monospace mb-3">
                      <i className="fa-solid fa-circle-check me-2" />Invoice #{payResult.invoiceId ?? payResult.id} created — complete payment to finalize.
                    </div>
                    <form id="paymentForm" onSubmit={handleSubmitPayment}>
                      <div className="row gy-3">
                        <div className="col-md-4">
                          <label className="form-label text-white font-monospace text-uppercase small">Amount</label>
                          <input className="form-control bg-dark text-secondary border-secondary rounded-0" value={`$${Number(payBooking.amount ?? 0).toFixed(2)}`} disabled />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-white font-monospace text-uppercase small">Payment Method</label>
                          <select className="form-select bg-dark text-white border-secondary rounded-0" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: Number(e.target.value) }))}>
                            <option value={1}>Credit Card</option>
                            <option value={2}>Bank Transfer</option>
                            <option value={3}>Cash</option>
                            <option value={4}>Online</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-white font-monospace text-uppercase small">Gateway Provider</label>
                          <input className="form-control bg-dark text-white border-secondary rounded-0" value={paymentForm.gatewayProvider} onChange={(e) => setPaymentForm((prev) => ({ ...prev, gatewayProvider: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-white font-monospace text-uppercase small">Transaction Reference</label>
                          <input className="form-control bg-dark text-white border-secondary rounded-0" placeholder="e.g. EDZPA5387L" value={paymentForm.transactionReference} onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionReference: e.target.value }))} required />
                        </div>
                      </div>
                      <div className="modal-footer bg-dark border-secondary">
                        <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => { setShowPayModal(false); setPayResult(null); setPaymentResult(null) }}>Cancel</button>
                        <button type="submit" form="paymentForm" className="btn btn-outline-success rounded-0 font-monospace text-uppercase" disabled={submittingPayment}>
                          {submittingPayment ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-money-bill-wave me-2" />}Submit Payment
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div>
                    <div className="alert alert-success rounded-0 font-monospace mb-3">
                      <i className="fa-solid fa-circle-check me-2" />Payment processed successfully!
                    </div>
                    <table className="table table-dark table-sm border-secondary rounded-0 mb-3">
                      <tbody>
                        {[
                          ['Payment ID', paymentResult.paymentId ?? paymentResult.id],
                          ['Invoice ID', paymentResult.invoiceId],
                          ['Amount', `$${Number(paymentResult.amount).toFixed(2)}`],
                          ['Method', paymentResult.method],
                          ['Status', paymentResult.status],
                          ['Transaction Ref', paymentResult.transactionReference],
                          ['Gateway', paymentResult.gatewayProvider],
                        ].map(([label, val]) => (
                          <tr key={label} className="border-secondary">
                            <td className="text-info font-monospace small border-secondary" style={{ width: 140 }}>{label}</td>
                            <td className="text-white font-monospace small border-secondary">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace text-uppercase" onClick={() => { setShowPayModal(false); setPayResult(null); setPaymentResult(null) }}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
