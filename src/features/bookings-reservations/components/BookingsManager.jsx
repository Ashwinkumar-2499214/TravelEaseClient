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
const STATUS_COLORS = { 1: 'warning', 2: 'success', 3: 'danger', 4: 'info' }
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
    return bookingsService.list()
      .then(data => {
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

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )

  if (error) return <div className="alert alert-danger mb-4">{error}</div>

  return (
    <div>
      {/* Header */}
      <div className="card card-purple-accent mb-4 border-left" style={{ borderLeft: '4px solid #7e22ce' }}>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '50px', height: '50px', backgroundColor: '#7e22ce' }}
              >
                <i className="bi bi-briefcase-fill" style={{ fontSize: '1.5rem' }}></i>
              </div>
            </div>
            <div className="col">
              <h5 className="mb-1" style={{ color: '#7e22ce', fontWeight: 700 }}>
                {agentMode ? 'Bookings (Agent View)' : 'My Bookings'}
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Hotel booking management system
              </p>
            </div>
            {!isTravelAgent && (
              <div className="col-auto">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={openCreate}
                  style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce' }}
                >
                  <i className="bi bi-plus-circle me-2"></i>New Booking
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr style={{ backgroundColor: '#7e22ce' }}>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Hotel</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Room Type</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Check-In</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Check-Out</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Guests</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Amount</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Status</th>
              <th style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', borderColor: '#7e22ce' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                  <p className="mt-2">No bookings found</p>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const bid = booking.bookingId ?? booking.id
                const statusColor = STATUS_COLORS[Number(booking.status)]
                return (
                  <React.Fragment key={bid}>
                    <tr style={{ backgroundColor: expandedId === bid ? '#f9fafb' : 'transparent' }}>
                      <td>{booking.itemType || booking.hotelName || '-'}</td>
                      <td>{booking.roomType || '-'}</td>
                      <td>{formatDate(booking.checkInDate)}</td>
                      <td>{formatDate(booking.checkOutDate)}</td>
                      <td>{booking.numberOfGuests || '-'}</td>
                      <td className="fw-600">${Number(booking.amount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge bg-${statusColor}`}>
                          {STATUS_MAP[Number(booking.status)] || booking.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setExpandedId(expandedId === bid ? null : bid)}
                            title="Expand details"
                          >
                            <i className={`bi ${expandedId === bid ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEdit(booking)}
                            disabled={isTravelAgent}
                            title="Edit booking"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => openPay(booking)}
                            disabled={isTravelAgent}
                            title="Create payment"
                          >
                            <i className="bi bi-credit-card"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(bid)}
                            disabled={isTravelAgent}
                            title="Delete booking"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === bid && (
                      <tr style={{ backgroundColor: '#f0f4f8' }}>
                        <td colSpan="8">
                          <div className="p-3">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <small className="text-muted fw-600">Booked By</small>
                                <p className="mb-0">{booking.userName || currentUser?.name || '-'}</p>
                              </div>
                              <div className="col-md-6">
                                <small className="text-muted fw-600">Booking Date</small>
                                <p className="mb-0">{formatDate(booking.bookingDate)}</p>
                              </div>
                              <div className="col-12">
                                <small className="text-muted fw-600">Special Requests</small>
                                <p className="mb-0">{booking.specialRequests || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: New/Edit Booking */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header" style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce' }}>
                  <h5 className="modal-title text-white" style={{ fontWeight: 700 }}>
                    {editBooking ? 'Edit Booking' : 'New Booking'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-600">Select Hotel Room</label>
                    <select className="form-select" value={form.inventoryId} onChange={(e) => setForm(prev => ({...prev, inventoryId: e.target.value}))} required>
                      <option value="">-- Select a hotel room --</option>
                      {inventory.map((item) => {
                        const id = item.inventoryId ?? item.id
                        return (
                          <option key={id} value={id}>
                            [{item.itemType || item.type}] {item.name || item.title || `Item #${id}`} — ${Number(item.price ?? item.amount ?? 0).toFixed(2)}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-600">Check-In</label>
                      <input type="date" className="form-control" value={form.checkInDate} onChange={(e) => setForm(prev => ({...prev, checkInDate: e.target.value}))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-600">Check-Out</label>
                      <input type="date" className="form-control" value={form.checkOutDate} onChange={(e) => setForm(prev => ({...prev, checkOutDate: e.target.value}))} required />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-600">Guests</label>
                      <input type="number" min={1} className="form-control" value={form.numberOfGuests} onChange={(e) => setForm(prev => ({...prev, numberOfGuests: Number(e.target.value)}))} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-600">Rooms</label>
                      <input type="number" min={1} className="form-control" value={form.numberOfRooms} onChange={(e) => setForm(prev => ({...prev, numberOfRooms: Number(e.target.value)}))} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-600">Room Type</label>
                      <select className="form-select" value={form.roomType} onChange={(e) => setForm(prev => ({...prev, roomType: e.target.value}))} required>
                        <option value="">-- Select --</option>
                        {ROOM_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-600">Special Requests</label>
                    <textarea className="form-control" rows={3} value={form.specialRequests} onChange={(e) => setForm(prev => ({...prev, specialRequests: e.target.value}))} />
                  </div>
                  <div className="alert alert-info mb-0">
                    <strong>Estimated Amount:</strong> ${bookingAmountEstimate.toFixed(2)}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce' }}>
                    <i className="bi bi-check-circle me-2"></i>Save Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Payment */}
      {showPayModal && payBooking && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#7e22ce', borderColor: '#7e22ce' }}>
                <div>
                  <h5 className="modal-title text-white" style={{ fontWeight: 700, marginBottom: 0 }}>
                    Create Invoice & Payment
                  </h5>
                  <small className="text-white-50">Booking #{payBooking.bookingId ?? payBooking.id} — ${Number(payBooking.amount ?? 0).toFixed(2)}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {!payResult ? (
                  <form onSubmit={handleCreateInvoice}>
                    <div className="mb-3">
                      <label className="form-label fw-600">Amount</label>
                      <div className="form-control-plaintext fw-600">${Number(payBooking.amount ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Due Date</label>
                      <input type="date" className="form-control" value={payForm.dueDate} onChange={(e) => setPayForm(prev => ({...prev, dueDate: e.target.value}))} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Description</label>
                      <textarea className="form-control" rows={3} value={payForm.description} onChange={(e) => setPayForm(prev => ({...prev, description: e.target.value}))} />
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-success" disabled={paying}>
                        {paying ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-file-earmark-text me-2"></i>}
                        Create Invoice
                      </button>
                    </div>
                  </form>
                ) : !paymentResult ? (
                  <form onSubmit={handleSubmitPayment}>
                    <div className="alert alert-success mb-4">
                      <i className="bi bi-check-circle me-2"></i>Invoice #{payResult.invoiceId ?? payResult.id} created successfully
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-600">Payment Method</label>
                        <select className="form-select" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm(prev => ({...prev, paymentMethod: Number(e.target.value)}))}>
                          <option value={1}>Credit Card</option>
                          <option value={2}>Bank Transfer</option>
                          <option value={3}>Cash</option>
                          <option value={4}>Online</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-600">Gateway Provider</label>
                        <input className="form-control" value={paymentForm.gatewayProvider} onChange={(e) => setPaymentForm(prev => ({...prev, gatewayProvider: e.target.value}))} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Transaction Reference</label>
                      <input className="form-control" placeholder="e.g. TXN1234567890" value={paymentForm.transactionReference} onChange={(e) => setPaymentForm(prev => ({...prev, transactionReference: e.target.value}))} required />
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => { setShowPayModal(false); setPayResult(null) }}>Cancel</button>
                      <button type="submit" className="btn btn-success" disabled={submittingPayment}>
                        {submittingPayment ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-credit-card me-2"></i>}
                        Submit Payment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="alert alert-success mb-4">
                      <i className="bi bi-check-circle me-2"></i>Payment processed successfully!
                    </div>
                    <div className="table-responsive mb-4">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <th className="fw-600">Payment ID</th>
                            <td>{paymentResult.paymentId ?? paymentResult.id}</td>
                          </tr>
                          <tr>
                            <th className="fw-600">Invoice ID</th>
                            <td>{paymentResult.invoiceId}</td>
                          </tr>
                          <tr>
                            <th className="fw-600">Amount</th>
                            <td>${Number(paymentResult.amount).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <th className="fw-600">Method</th>
                            <td>{paymentResult.method}</td>
                          </tr>
                          <tr>
                            <th className="fw-600">Status</th>
                            <td><span className="badge bg-success">{paymentResult.status}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => { setShowPayModal(false); setPayResult(null); setPaymentResult(null) }}>Close</button>
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
