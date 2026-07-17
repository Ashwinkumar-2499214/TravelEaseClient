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

// Payment Mappings based on TravelEaseServer.Enum
const PAYMENT_STATUS_MAP = {
  1: 'Pending',
  2: 'Processing',
  3: 'Completed',
  4: 'Failed',
  5: 'Refunded',
  6: 'Cancelled'
}
const PAYMENT_STATUS_COLORS = {
  1: 'warning',
  2: 'info',
  3: 'success',
  4: 'danger',
  5: 'secondary',
  6: 'dark'
}
const PAYMENT_METHOD_MAP = {
  1: 'Credit Card',
  2: 'Bank Transfer',
  3: 'Cash',
  4: 'Online'
}

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
  const isCorporateTravelManager = currentUser?.role === 'CorporateTravelManager'
  
  // Travelers are users who aren't management/agents
  const isTraveler = !isAdmin && !isTravelAgent && !isCorporateTravelManager

  // Flag to see who is authorized to change a booking's status
  const canChangeStatus = isAdmin || isTravelAgent || isCorporateTravelManager

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

    // Travelers should fetch only their own bookings.
    const params = isTraveler ? { userId: currentUser?.id } : {}

    return bookingsService.list(params)
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

      // For New Booking, inventory should come from partner inventory endpoint with ItemType=a.
      // If user selects a partner later, you can switch to listForPartner(partnerId, { ItemType: 'a' }).
      inventoryService.listAll({ ItemType: 'a' })
        .then(data => setInventory(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [currentUser])


  const openCreate = () => {
    if (!isTraveler) return
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
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border" style={{ color: 'var(--te-purple-700)' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )

  if (error) return <div className="alert alert-danger mb-4 border-left border-4" style={{ borderLeftColor: 'var(--te-status-danger)' }}>{error}</div>

  return (
    <div>
      {/* Header */}
      <div className="card card-purple mb-4" style={{ borderLeft: '4px solid var(--te-purple-700)' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                style={{ width: '50px', height: '50px', backgroundColor: 'var(--te-purple-700)', minWidth: '50px' }}
              >
                <i className="bi bi-briefcase-fill" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <h5 className="mb-1 text-purple" style={{ fontWeight: 700 }}>
                  {agentMode ? 'Bookings (Agent View)' : 'My Bookings'}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Hotel booking management system
                </p>
              </div>
            </div>
            

          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: 'var(--te-purple-700)' }}>
              <tr>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Hotel</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Room Type</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Check-In</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Check-Out</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Guests</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                <th className="text-dark fw-600" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', color: 'var(--te-gray-400)' }}></i>
                    <p className="mt-2 text-muted" style={{ fontSize: '0.95rem' }}>No bookings found</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const bid = booking.bookingId ?? booking.id
                  const statusColor = STATUS_COLORS[Number(booking.status)]
                  return (
                    <React.Fragment key={bid}>
                      <tr style={{ backgroundColor: expandedId === bid ? 'var(--te-purple-50)' : 'transparent' }}>
                        <td className="fw-500">{booking.itemType || booking.hotelName || '-'}</td>
                        <td>{booking.roomType || '-'}</td>
                        <td>{formatDate(booking.checkInDate)}</td>
                        <td>{formatDate(booking.checkOutDate)}</td>
                        <td>{booking.numberOfGuests || '-'}</td>
                        <td className="fw-600 text-purple">${Number(booking.amount || 0).toFixed(2)}</td>
                        <td>
                          {/* Display dropdown if authorized (Admin, TravelAgent, CorporateTravelManager) otherwise static badge */}
                          {canChangeStatus ? (
                            <select 
                              className={`form-select form-select-sm border-${statusColor} fw-500`}
                              style={{ width: '130px', fontSize: '0.8rem' }}
                              value={Number(booking.status)}
                              onChange={(e) => handleStatusChange(bid, e.target.value)}
                            >
                              {STATUSES.map(st => (
                                <option key={st} value={st}>{STATUS_MAP[st]}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`badge bg-${statusColor}`} style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                              {STATUS_MAP[Number(booking.status)] || booking.status}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setExpandedId(expandedId === bid ? null : bid)}
                              title="Expand details"
                              style={{ borderColor: 'var(--te-gray-300)', color: 'var(--te-gray-600)' }}
                            >
                              <i className={`bi ${expandedId === bid ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                            </button>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => openEdit(booking)}
                              disabled={isTravelAgent || isCorporateTravelManager}
                              title="Edit booking"
                              style={{ borderColor: 'var(--te-purple-700)', color: 'var(--te-purple-700)' }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => openPay(booking)}
                              disabled={isTravelAgent || isCorporateTravelManager}
                              title="Create payment"
                              style={{ borderColor: 'var(--te-status-success)', color: 'var(--te-status-success)' }}
                            >
                              <i className="bi bi-credit-card"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(bid)}
                              disabled={isTravelAgent || isCorporateTravelManager}
                              title="Delete booking"
                              style={{ borderColor: 'var(--te-status-danger)', color: 'var(--te-status-danger)' }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === bid && (
                        <tr style={{ backgroundColor: 'var(--te-gray-50)' }}>
                          <td colSpan="8">
                            <div className="p-4">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <small className="text-muted fw-600" style={{ fontSize: '0.8rem' }}>Booked By</small>
                                  <p className="mb-0 mt-1" style={{ fontSize: '0.95rem' }}>{booking.userName || currentUser?.name || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted fw-600" style={{ fontSize: '0.8rem' }}>Booking Date</small>
                                  <p className="mb-0 mt-1" style={{ fontSize: '0.95rem' }}>{formatDate(booking.bookingDate)}</p>
                                </div>
                                <div className="col-12">
                                  <small className="text-muted fw-600" style={{ fontSize: '0.8rem' }}>Special Requests</small>
                                  <p className="mb-0 mt-1" style={{ fontSize: '0.95rem' }}>{booking.specialRequests || '-'}</p>
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
      </div>

      {/* Modal: New/Edit Booking */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-purple text-white border-0 p-4">
                  <h5 className="modal-title fw-600">
                    <i className="bi bi-briefcase me-2"></i>
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
                    <textarea className="form-control" rows={3} value={form.specialRequests} onChange={(e) => setForm(prev => ({...prev, specialRequests: e.target.value}))} placeholder="Enter any special requests..." />
                  </div>
                  <div className="alert alert-info mb-0 border-left border-4" style={{ borderLeftColor: 'var(--te-status-info)' }}>
                    <strong>Estimated Amount:</strong> <span className="fw-600 text-purple">${bookingAmountEstimate.toFixed(2)}</span>
                  </div>
                </div>
                <div className="modal-footer bg-gray-50 border-top p-4">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--te-purple-700)', borderColor: 'var(--te-purple-700)' }}>
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-purple text-white border-0 p-4">
                <div>
                  <h5 className="modal-title fw-600 mb-1">
                    <i className="bi bi-credit-card me-2"></i>
                    Create Invoice & Payment
                  </h5>
                  <small style={{ opacity: 100, color: 'white' }}>${Number(payBooking.amount ?? 0).toFixed(2)}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {!payResult ? (
                  <form onSubmit={handleCreateInvoice}>
                    <div className="mb-3">
                      <label className="form-label fw-600">Amount</label>
                      <div className="p-3 bg-gray-50 rounded-md fw-600 text-purple" style={{ fontSize: '1.1rem' }}>${Number(payBooking.amount ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Due Date</label>
                      <input type="date" className="form-control" value={payForm.dueDate} onChange={(e) => setPayForm(prev => ({...prev, dueDate: e.target.value}))} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Description</label>
                      <textarea className="form-control" rows={3} value={payForm.description} onChange={(e) => setPayForm(prev => ({...prev, description: e.target.value}))} placeholder="Enter invoice description..." />
                    </div>
                    <div className="modal-footer bg-gray-50 border-top p-4">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-success" disabled={paying}>
                        {paying ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-file-earmark-text me-2"></i>}
                        Create Invoice
                      </button>
                    </div>
                  </form>
                ) : !paymentResult ? (
                  <form onSubmit={handleSubmitPayment}>
                    <div className="alert alert-success mb-4 border-left border-4" style={{ borderLeftColor: 'var(--te-status-success)' }}>
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
                        <input className="form-control" placeholder="e.g. Stripe, PayPal" value={paymentForm.gatewayProvider} onChange={(e) => setPaymentForm(prev => ({...prev, gatewayProvider: e.target.value}))} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-600">Transaction Reference</label>
                      <input className="form-control" placeholder="e.g. TXN1234567890" value={paymentForm.transactionReference} onChange={(e) => setPaymentForm(prev => ({...prev, transactionReference: e.target.value}))} required />
                    </div>
                    <div className="modal-footer bg-gray-50 border-top p-4">
                      <button type="button" className="btn btn-secondary" onClick={() => { setShowPayModal(false); setPayResult(null) }}>Cancel</button>
                      <button type="submit" className="btn btn-success" disabled={submittingPayment}>
                        {submittingPayment ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-credit-card me-2"></i>}
                        Submit Payment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="alert alert-success mb-4 border-left border-4" style={{ borderLeftColor: 'var(--te-status-success)' }}>
                      <i className="bi bi-check-circle me-2"></i>Payment processed successfully!
                    </div>
                    <div className="table-responsive mb-4">
                      <table className="table table-sm table-bordered mb-0">
                        <tbody>
                          <tr>
                            <th className="fw-600 bg-gray-50">Amount</th>
                            <td className="text-purple fw-600">${Number(paymentResult.amount).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <th className="fw-600 bg-gray-50">Method</th>
                            <td>{PAYMENT_METHOD_MAP[Number(paymentResult.method)] || paymentResult.method}</td>
                          </tr>
                          <tr>
                            <th className="fw-600 bg-gray-50">Status</th>
                            <td>
                              <span className={`badge bg-${PAYMENT_STATUS_COLORS[Number(paymentResult.status)] || 'secondary'}`}>
                                {PAYMENT_STATUS_MAP[Number(paymentResult.status)] || paymentResult.status}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="modal-footer bg-gray-50 border-top p-4">
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