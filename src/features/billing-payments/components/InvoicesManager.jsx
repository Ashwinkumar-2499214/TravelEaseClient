import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import billingService from '../services/billingService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'
import bookingsService from '../../bookings-reservations/services/bookingsService'

const INV_STATUS_MAP = { 1: 'Draft', 2: 'Issued', 3: 'Paid', 4: 'Overdue', 5: 'Cancelled' }
const EMPTY = { bookingId: '', amount: '', dueDate: '', description: '' }

const statusBadge = (s) => {
  const label = INV_STATUS_MAP[Number(s)] || s
  const map = { 
    Paid: 'bg-success bg-opacity-10 text-success', 
    Draft: 'bg-secondary bg-opacity-10 text-secondary', 
    Issued: 'bg-primary bg-opacity-10 text-primary', 
    Overdue: 'bg-danger bg-opacity-10 text-danger', 
    Cancelled: 'bg-dark bg-opacity-10 text-dark' 
  }
  return <span className={`badge rounded-pill px-3 ${map[label] || 'bg-secondary bg-opacity-10 text-secondary'}`}>{label}</span>
}

function downloadInvoicePdf(inv) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 50

  // Header bar
  doc.setFillColor(111, 66, 193) // Purple to match the new branding theme
  doc.rect(0, 0, W, 80, 'F')

  // Logo placeholder circle
  doc.setFillColor(255, 255, 255)
  doc.circle(55, 40, 22, 'F')
  doc.setTextColor(111, 66, 193)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TE', 47, 44)

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TravelEase', 90, 35)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Travel Management System', 90, 52)
  doc.text('support@travelease.com  |  www.travelease.com', 90, 65)

  // INVOICE label top-right
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('INVOICE', W - 40, 48, { align: 'right' })

  y = 110

  // Invoice meta
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)

  const fields = [
    ['Invoice ID', `#${inv.invoiceId}`],
    ['Booking ID', `#${inv.bookingId}`],
    ['Invoice Date', formatDate(inv.invoiceDate)],
    ['Due Date', formatDate(inv.dueDate)],
    ['Status', INV_STATUS_MAP[Number(inv.status)] || inv.status],
    ['Description', inv.description || '-'],
  ]

  // Two-column layout for meta
  fields.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? 50 : W / 2 + 20
    if (i % 2 === 0 && i > 0) y += 28
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(111, 66, 193)
    doc.text(label, col, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(String(value), col, y + 14)
  })

  y += 50

  // Divider
  doc.setDrawColor(111, 66, 193)
  doc.setLineWidth(1.5)
  doc.line(50, y, W - 50, y)
  y += 20

  // Amount section
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(50, y, W - 100, 60, 4, 4, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('Total Amount Due', 70, y + 22)
  doc.setFontSize(22)
  doc.setTextColor(111, 66, 193)
  doc.text(`$${Number(inv.amount).toFixed(2)}`, W - 70, y + 38, { align: 'right' })

  y += 90

  // Created date footer note
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated on ${new Date().toLocaleString()}  |  Created: ${formatDate(inv.createdDate)}`, 50, y)

  // Bottom bar
  doc.setFillColor(111, 66, 193)
  doc.rect(0, doc.internal.pageSize.getHeight() - 30, W, 30, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('TravelEase — Simplifying Travel Management', W / 2, doc.internal.pageSize.getHeight() - 12, { align: 'center' })

  doc.save(`invoice-${inv.invoiceId}.pdf`)
}

export default function InvoicesManager() {
  const { currentUser } = useAuth()
  const isTraveler = currentUser?.role === 'Traveler'
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editInv, setEditInv] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [preview, setPreview] = useState(null)

  const [userBookings, setUserBookings] = useState([])

  const load = () => {
    setLoading(true)
    const params = isTraveler ? { userId: currentUser.id } : {}
    billingService.invoices.list(params)
      .then(data => setInvoices(Array.isArray(data) ? data : data ? [data] : []))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditInv(null)
    setForm(EMPTY)
    bookingsService.list({ userId: currentUser.id })
      .then(data => setUserBookings(Array.isArray(data) ? data : data ? [data] : []))
      .catch(() => {})
    setShowModal(true)
  }
  const openEdit = (inv) => {
    setEditInv(inv)
    setForm({ bookingId: inv.bookingId || '', amount: inv.amount || '', dueDate: inv.dueDate?.slice(0, 10) || '', description: inv.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      editInv ? await billingService.invoices.update(editInv.invoiceId, form) : await billingService.invoices.create(form)
      setShowModal(false); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    try { await billingService.invoices.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (error) return <div className="container-fluid py-4"><div className="alert alert-danger">{error}</div></div>

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-2 text-purple" style={{ color: '#6f42c1' }}>
            <i className="bi bi-file-earmark-spreadsheet-fill me-2" aria-hidden="true"></i>
            Invoice Registry
          </h2>
          <p className="text-muted mb-0">Financial Management System</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-primary btn-sm text-white" 
            style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
            onClick={openCreate}
          >
            <i className="bi bi-plus-circle-fill me-2" aria-hidden="true" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Main Table Content / Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#6f42c1' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small fw-bold text-secondary text-uppercase ps-4">Inventory</th>
                  <th className="small fw-bold text-secondary text-uppercase">Booked By</th>
                  <th className="small fw-bold text-secondary text-uppercase">Amount</th>
                  <th className="small fw-bold text-secondary text-uppercase">Invoice Date</th>
                  <th className="small fw-bold text-secondary text-uppercase">Due Date</th>
                  <th className="small fw-bold text-secondary text-uppercase">Description</th>
                  <th className="small fw-bold text-secondary text-uppercase">Status</th>
                  <th className="small fw-bold text-secondary text-uppercase text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoiceId}>
                    <td className="ps-4 fw-semibold text-dark">{inv.inventoryName || '-'}</td>
                    <td className="text-muted">{inv.userName || '-'}</td>
                    <td className="fw-semibold text-dark">${Number(inv.amount || 0).toFixed(2)}</td>
                    <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                    <td className="text-muted">{formatDate(inv.dueDate)}</td>
                    <td className="text-muted" style={{ maxWidth: 180 }}>
                      <span className="text-truncate d-block" title={inv.description}>{inv.description || '-'}</span>
                    </td>
                    <td>{statusBadge(inv.status)}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          title="Preview & Download PDF" 
                          onClick={() => setPreview(inv)}
                        >
                          <i className="bi bi-file-pdf" />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => openEdit(inv)}
                          title="Edit Invoice"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(inv.invoiceId)}
                          title="Delete Invoice"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted bg-light bg-opacity-50">
                      <i className="bi bi-file-invoice me-2 fs-4 d-block mb-2 text-secondary"></i>
                      <span>No invoices found in system registry.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Blocks */}
      <div className="row mt-5">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 style={{ color: '#6f42c1' }}>{invoices.length}</h3>
              <small className="text-muted">Total Registry Invoices</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success">
                ${invoices.reduce((acc, curr) => acc + (Number(curr.status) === 3 ? Number(curr.amount || 0) : 0), 0).toFixed(2)}
              </h3>
              <small className="text-muted">Total Paid Volume</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger">
                {invoices.filter(inv => Number(inv.status) === 4).length}
              </h3>
              <small className="text-muted">Overdue Actions Required</small>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {preview && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header text-white" style={{ background: '#6f42c1' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-eye-fill me-2" />Invoice Preview
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="row row-cols-1 row-cols-md-2 g-3">
                  {[
                    ['Inventory', preview.inventoryName || '-'],
                    ['Booked By', preview.userName || '-'],
                    ['Amount', `$${Number(preview.amount || 0).toFixed(2)}`],
                    ['Invoice Date', formatDate(preview.invoiceDate)],
                    ['Due Date', formatDate(preview.dueDate)],
                    ['Status', INV_STATUS_MAP[Number(preview.status)] || preview.status],
                    ['Description', preview.description || '-']
                  ].map(([label, val]) => (
                    <div key={label} className="col">
                      <div className="text-muted small fw-bold text-uppercase mb-1">{label}</div>
                      <div className="text-dark fw-semibold" style={{ lineHeight: 1.7 }}>{val}</div>
                      <hr className="text-muted opacity-25 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-primary btn-sm text-white" style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }} onClick={() => { downloadInvoicePdf(preview); setPreview(null) }}>
                  <i className="bi bi-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <form className="modal-content border-0 shadow-lg" onSubmit={handleSubmit}>
              <div className="modal-header text-white" style={{ backgroundColor: '#6f42c1' }}>
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editInv ? 'bi-pencil-square' : 'bi-file-earmark-plus-fill'} me-2`}></i>
                  {editInv ? 'Edit Invoice Details' : 'Generate New Invoice'}
                </h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  {!editInv && (
                    <div>
                      <label className="form-label text-muted small fw-bold text-uppercase">Booking Attachment</label>
                      <select className="form-select" value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))} required>
                        <option value="">— Select Connected Booking —</option>
                        {userBookings.map(b => (
                          <option key={b.bookingId} value={b.bookingId}>
                            {b.inventoryName || b.itemType || 'Booking'} — {b.checkInDate ? formatDate(b.checkInDate) : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Billing Amount ($)</label>
                    <input type="number" step="0.01" className="form-control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Terms / Due Date</label>
                    <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Statement Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary text-white" style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}>
                  <i className="bi bi-save me-2"></i>{editInv ? 'Save Changes' : 'Commit Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}