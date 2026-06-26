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
              <th className="font-monospace text-uppercase small border-secondary">Invoice #</th>
              <th className="font-monospace text-uppercase small border-secondary">Amount</th>
              <th className="font-monospace text-uppercase small border-secondary">Due Date</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Change Status</th>
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <React.Fragment key={inv.id}>
                <tr className="border-secondary">
                  <td className="text-white font-monospace border-secondary">
                    <button className="btn btn-link btn-sm p-0 me-2 text-info text-decoration-none" onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                      <i className={`fa-solid ${expandedId === inv.id ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </button>
                    {inv.number || inv.id}
                  </td>
                  <td className="text-light font-monospace border-secondary">${inv.amount}</td>
                  <td className="text-light font-monospace border-secondary">{formatDate(inv.dueDate)}</td>
                  <td className="border-secondary">{statusBadge(inv.status)}</td>
                  <td className="border-secondary">
                    <select className="form-select form-select-sm bg-dark text-light border-secondary rounded-0" style={{ width: 130 }} value={inv.status}
                      onChange={e => handleStatus(inv.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} className="bg-dark text-light">{s}</option>)}
                    </select>
                  </td>
                  <td className="border-secondary">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-warning rounded-0" title="Adjustment" onClick={() => { setAdjModal(inv.id); setAdjForm({ amount: '', reason: '' }) }}><i className="fa-solid fa-sliders" /></button>
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(inv)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(inv.id)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === inv.id && <InvoicePaymentsRow invoiceId={inv.id} />}
              </React.Fragment>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-file-invoice me-2"></i>
                  <span className="font-monospace">No invoices found in system registry.</span>
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
