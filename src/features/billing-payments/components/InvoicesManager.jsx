import React, { useEffect, useState } from 'react'
import billingService from '../services/billingService'
import { formatDate } from '../../../utils/date'

const STATUSES = ['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled']
const EMPTY = { bookingId: '', amount: '', dueDate: '', description: '' }

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editInv, setEditInv] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [expandedId, setExpandedId] = useState(null)
  const [adjModal, setAdjModal] = useState(null)
  const [adjForm, setAdjForm] = useState({ amount: '', reason: '' })

  const load = () => {
    setLoading(true)
    billingService.invoices.list().then(setInvoices).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditInv(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (inv) => {
    setEditInv(inv)
    setForm({ bookingId: inv.bookingId || '', amount: inv.amount || '', dueDate: inv.dueDate?.slice(0, 10) || '', description: inv.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      editInv ? await billingService.invoices.update(editInv.id, form) : await billingService.invoices.create(form)
      setShowModal(false); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete invoice?')) return
    try { await billingService.invoices.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleStatus = async (id, status) => {
    try { await billingService.invoices.patchStatus(id, status); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleAdjustment = async (e) => {
    e.preventDefault()
    try {
      await billingService.invoices.adjustments(adjModal, adjForm)
      alert('Adjustment applied.'); setAdjModal(null); setAdjForm({ amount: '', reason: '' }); load()
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const statusBadge = (s) => {
    const map = { Paid: 'bg-success', Draft: 'bg-secondary', Issued: 'bg-primary', Overdue: 'bg-danger', Cancelled: 'bg-dark' }
    return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Invoice Registry</h5>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><i className="fa-solid fa-plus me-1" />New Invoice</button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr><th>Invoice #</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Change Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <React.Fragment key={inv.id}>
                <tr>
                  <td>
                    <button className="btn btn-link btn-sm p-0 me-2 text-decoration-none" onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                      <i className={`fa-solid ${expandedId === inv.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    {inv.number || inv.id}
                  </td>
                  <td>${inv.amount}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td>
                    <select className="form-select form-select-sm" style={{ width: 130 }} value={inv.status}
                      onChange={e => handleStatus(inv.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" title="Adjustment" onClick={() => { setAdjModal(inv.id); setAdjForm({ amount: '', reason: '' }) }}><i className="fa-solid fa-sliders" /></button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(inv)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(inv.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
                {expandedId === inv.id && <InvoicePaymentsRow invoiceId={inv.id} />}
              </React.Fragment>
            ))}
            {invoices.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No invoices found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{editInv ? 'Edit Invoice' : 'New Invoice'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label">Booking ID</label><input className="form-control" value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Amount</label><input type="number" step="0.01" className="form-control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required /></div>
                <div className="mb-2"><label className="form-label">Due Date</label><input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required /></div>
                <div className="mb-2"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-sm">
            <form className="modal-content" onSubmit={handleAdjustment}>
              <div className="modal-header">
                <h5 className="modal-title">Apply Adjustment</h5>
                <button type="button" className="btn-close" onClick={() => setAdjModal(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label">Amount</label><input type="number" step="0.01" className="form-control" value={adjForm.amount} onChange={e => setAdjForm(p => ({ ...p, amount: e.target.value }))} required /></div>
                <div className="mb-2"><label className="form-label">Reason</label><input className="form-control" value={adjForm.reason} onChange={e => setAdjForm(p => ({ ...p, reason: e.target.value }))} required /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-warning">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InvoicePaymentsRow({ invoiceId }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'Card' })

  const load = () => billingService.invoices.payments.listForInvoice(invoiceId).then(setPayments).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [invoiceId])

  const addPayment = async (e) => {
    e.preventDefault()
    try { await billingService.invoices.payments.addPayment(invoiceId, form); setShowAdd(false); setForm({ amount: '', method: 'Card' }); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleRefund = async (pId) => {
    if (!window.confirm('Process refund?')) return
    try { await billingService.payments.refund(pId, {}); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  return (
    <tr className="table-light">
      <td colSpan={6} className="ps-5">
        <strong className="d-block mb-2">Payments</strong>
        {loading ? <div className="spinner-border spinner-border-sm" /> : (
          <>
            <table className="table table-sm table-bordered mb-2">
              <thead className="table-secondary"><tr><th>ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Refund</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td><td>${p.amount}</td><td>{p.method}</td>
                    <td><span className="badge bg-info text-dark">{p.status}</span></td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleRefund(p.id)}>Refund</button></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="text-muted text-center">No payments.</td></tr>}
              </tbody>
            </table>
            {!showAdd ? (
              <button className="btn btn-sm btn-outline-success" onClick={() => setShowAdd(true)}><i className="fa-solid fa-plus me-1" />Record Payment</button>
            ) : (
              <form onSubmit={addPayment} className="d-flex gap-2 flex-wrap">
                <input type="number" step="0.01" className="form-control form-control-sm" style={{ width: 130 }} placeholder="Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                <select className="form-select form-select-sm" style={{ width: 130 }} value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                  {['Card', 'BankTransfer', 'Cash', 'Online'].map(m => <option key={m}>{m}</option>)}
                </select>
                <button type="submit" className="btn btn-sm btn-success">Add</button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              </form>
            )}
          </>
        )}
      </td>
    </tr>
  )
}
