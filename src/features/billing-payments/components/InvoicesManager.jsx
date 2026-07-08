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
  const map = { Paid: 'bg-success', Draft: 'bg-secondary', Issued: 'bg-primary', Overdue: 'bg-danger', Cancelled: 'bg-dark' }
  return <span className={`badge ${map[label] || 'bg-secondary'}`}>{label}</span>
}

function downloadInvoicePdf(inv) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 50

  // Header bar
  doc.setFillColor(0, 188, 212)
  doc.rect(0, 0, W, 80, 'F')

  // Logo placeholder circle
  doc.setFillColor(255, 255, 255)
  doc.circle(55, 40, 22, 'F')
  doc.setTextColor(0, 188, 212)
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
    doc.setTextColor(0, 188, 212)
    doc.text(label, col, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(String(value), col, y + 14)
  })

  y += 50

  // Divider
  doc.setDrawColor(0, 188, 212)
  doc.setLineWidth(1.5)
  doc.line(50, y, W - 50, y)
  y += 20

  // Amount section
  doc.setFillColor(245, 250, 252)
  doc.roundedRect(50, y, W - 100, 60, 4, 4, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('Total Amount Due', 70, y + 22)
  doc.setFontSize(22)
  doc.setTextColor(0, 150, 100)
  doc.text(`$${Number(inv.amount).toFixed(2)}`, W - 70, y + 38, { align: 'right' })

  y += 90

  // Created date footer note
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated on ${new Date().toLocaleString()}  |  Created: ${formatDate(inv.createdDate)}`, 50, y)

  // Bottom bar
  doc.setFillColor(0, 188, 212)
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
      .catch(e => setError(e.message))
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
    if (!window.confirm('Delete invoice?')) return
    try { await billingService.invoices.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark border-secondary rounded-0">
              <div className="modal-header border-secondary" style={{ background: '#00bcd4' }}>
                <h6 className="modal-title text-dark font-monospace text-uppercase fw-bold">
                  <i className="fa-solid fa-file-invoice me-2" />Invoice Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body">
                {[['Invoice ID', `#${preview.invoiceId}`], ['Booking ID', `#${preview.bookingId}`], ['Inventory', preview.inventoryName || '-'], ['Booked By', preview.userName || '-'], ['Amount', `$${Number(preview.amount || 0).toFixed(2)}`], ['Invoice Date', formatDate(preview.invoiceDate)], ['Due Date', formatDate(preview.dueDate)], ['Status', INV_STATUS_MAP[Number(preview.status)] || preview.status], ['Description', preview.description || '-']].map(([label, val]) => (
                  <div key={label} className="mb-3">
                    <div className="text-info font-monospace text-uppercase small fw-bold mb-1">{label}</div>
                    <div className="text-light" style={{ lineHeight: 1.7 }}>{val}</div>
                    <hr className="border-secondary mt-2" />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-info btn-sm rounded-0 font-monospace text-dark" onClick={() => { downloadInvoicePdf(preview); setPreview(null) }}>
                  <i className="fa-solid fa-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">Invoice Registry</h5>
          <small className="text-light font-monospace">Financial Management System</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2" />New Invoice
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Inventory</th>
              <th className="font-monospace text-uppercase small border-secondary">Booked By</th>
              <th className="font-monospace text-uppercase small border-secondary">Amount</th>
              <th className="font-monospace text-uppercase small border-secondary">Invoice Date</th>
              <th className="font-monospace text-uppercase small border-secondary">Due Date</th>
              <th className="font-monospace text-uppercase small border-secondary">Description</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.invoiceId} className="border-secondary bg-dark">
                <td className="text-secondary font-monospace border-secondary bg-darker">{inv.inventoryName || '-'}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">{inv.userName || '-'}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">${Number(inv.amount || 0).toFixed(2)}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(inv.invoiceDate)}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(inv.dueDate)}</td>
                <td className="text-secondary font-monospace border-secondary bg-darker" style={{ maxWidth: 180 }}>
                  <span className="text-truncate d-block" title={inv.description}>{inv.description || '-'}</span>
                </td>
                <td className="border-secondary bg-darker">{statusBadge(inv.status)}</td>
                <td className="border-secondary bg-darker">
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-success rounded-0" title="Preview & Download PDF" onClick={() => setPreview(inv)}>
                      <i className="fa-solid fa-file-pdf" />
                    </button>
                    <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(inv)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(inv.invoiceId)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-file-invoice me-2"></i>
                  <span className="font-monospace">No invoices found in system registry.</span>
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
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editInv ? 'Edit Invoice' : 'New Invoice'}</h5>
                  <small className="text-light font-monospace">Financial Management System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  {!editInv && (
                    <div>
                      <label className="form-label text-white font-monospace text-uppercase small">Booking</label>
                      <select className="form-select bg-dark text-white border-secondary rounded-0" value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))} required>
                        <option value="">— Select Booking —</option>
                        {userBookings.map(b => (
                          <option key={b.bookingId} value={b.bookingId}>#{b.bookingId} — {b.inventoryName || b.itemType || 'Booking'}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Amount</label>
                    <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary rounded-0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Due Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Description</label>
                    <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-save me-2"></i>Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
