import React, { useEffect, useState } from 'react'
import billingService from '../../../features/billing-payments/services/billingService'
import { formatDate } from '../../../utils/date'

const STATUSES = ['Pending', 'Completed', 'Failed', 'Refunded']

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    billingService.payments.list().then(setPayments).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatus = async (id, status) => {
    try { await billingService.payments.patchStatus(id, status); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const handleRefund = async (id) => {
    if (!window.confirm('Process refund for this payment?')) return
    try { await billingService.payments.refund(id, {}); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const statusBadge = (s) => {
    const map = { Completed: 'bg-success', Pending: 'bg-warning text-dark', Failed: 'bg-danger', Refunded: 'bg-secondary' }
    return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <h5 className="mb-3">Payments Registry</h5>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr><th>Payment ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Change Status</th><th>Refund</th></tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td className="text-muted small">{p.id}</td>
                <td>${p.amount}</td>
                <td>{p.method}</td>
                <td>{statusBadge(p.status)}</td>
                <td>{formatDate(p.createdAt || p.paidAt)}</td>
                <td>
                  <select className="form-select form-select-sm" style={{ width: 130 }} value={p.status}
                    onChange={e => handleStatus(p.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-warning" onClick={() => handleRefund(p.id)} disabled={p.status === 'Refunded'}>
                    <i className="fa-solid fa-rotate-left me-1" />Refund
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={7} className="text-center text-muted">No payments found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
