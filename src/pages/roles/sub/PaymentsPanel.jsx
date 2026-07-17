import React, { useEffect, useState } from 'react'
import billingService from '../../../features/billing-payments/services/billingService'
import { formatDate } from '../../../utils/date'

// C# Enum mappings based on TravelEaseServer.Enum
const PAYMENT_METHODS = {
  1: 'Credit Card',
  2: 'Debit Card',
  3: 'Bank Transfer',
  4: 'PayPal',
  5: 'Check',
  6: 'Cash'
}

const PAYMENT_STATUSES = {
  1: 'Pending',
  2: 'Processing',
  3: 'Completed',
  4: 'Failed',
  5: 'Refunded',
  6: 'Cancelled'
}

const STATUSES = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded', 'Cancelled']

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getTodayRange = () => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    return {
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
    }
  }

  const load = () => {
    setLoading(true)
    const { fromDate, toDate } = getTodayRange()

    billingService.payments
      .list({
        FromDate: fromDate,
        ToDate: toDate,
      })
      .then(res => {
        setPayments(res?.data || res || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }


  useEffect(() => { load() }, [])

  const handleStatus = async (id, statusName) => {
    const statusNumber = Object.keys(PAYMENT_STATUSES).find(key => PAYMENT_STATUSES[key] === statusName)
    try { 
      await billingService.payments.patchStatus(id, Number(statusNumber))
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleRefund = async (id) => {
    if (!window.confirm('Process refund for this payment?')) return
    try { await billingService.payments.refund(id, {}); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const statusBadge = (statusCode) => {
    const statusName = PAYMENT_STATUSES[statusCode] || 'Unknown'
    const map = { 
      Completed: 'bg-success-subtle text-success border-success-subtle', 
      Processing: 'bg-primary-subtle text-primary border-primary-subtle',
      Pending: 'bg-warning-subtle text-warning-emphasis border-warning-subtle', 
      Failed: 'bg-danger-subtle text-danger border-danger-subtle', 
      Refunded: 'bg-light text-muted border-light',
      Cancelled: 'bg-secondary-subtle text-secondary border-secondary-subtle'
    }
    return <span className={`badge rounded-pill px-2.5 py-1.5 border ${map[statusName] || 'bg-light text-muted'}`}>{statusName}</span>
  }

  const purpleTheme = {
    primaryText: '#4f46e5',
    lightPurpleBg: '#f5f3ff',
    borderPurple: '#e0e7ff',
    darkPurpleText: '#312e81'
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: purpleTheme.primaryText }} role="status" />
    </div>
  )
  
  if (error) return (
    <div className="alert border-0 text-danger p-4 rounded-3 shadow-sm d-flex align-items-center" style={{ backgroundColor: '#fef2f2' }}>
      <i className="fa-solid fa-circle-exclamation fs-5 me-3" />
      <div>{error}</div>
    </div>
  )

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center" style={{ borderColor: purpleTheme.borderPurple }}>
        <div>
          <h5 className="fw-bold mb-1" style={{ color: purpleTheme.darkPurpleText }}>Payments Registry</h5>
          <p className="text-muted small mb-0">Manage recent transactions, update status updates, or initiate refunds.</p>
        </div>
        <button 
          className="btn btn-sm px-3 rounded-3 border d-flex align-items-center gap-2 text-secondary bg-light"
          onClick={load}
        >
          <i className="fa-solid fa-arrows-rotate small text-dark" /> 
        </button>
      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0" style={{ minWidth: '850px' }}>
          <thead>
            <tr style={{ backgroundColor: purpleTheme.lightPurpleBg }}>
              {/* Changed Header from Payment ID to Customer Name */}
              <th className="ps-4 py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Customer Name</th>
              <th className="py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Amount</th>
              <th className="py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Method</th>
              <th className="py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Status</th>
              <th className="py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Date</th>
              <th className="py-3 border-0 small text-uppercase fw-semibold" style={{ color: purpleTheme.primaryText }}>Change Status</th>
              <th className="pe-4 py-3 border-0 small text-uppercase fw-semibold text-end" style={{ color: purpleTheme.primaryText }}>Actions</th>
            </tr>
          </thead>
          <tbody className="border-0">
            {payments.map(p => {
              const paymentId = p.paymentId;
              const currentStatusName = PAYMENT_STATUSES[p.status] || 'Pending';
              
              return (
                <tr key={paymentId || Math.random()} className="border-bottom" style={{ borderColor: '#f3f4f6' }}>
                  {/* Changed row cell to render billingName with matching email helper layout */}
                  <td className="ps-4 py-3">
                    <div className="d-flex flex-column">
                      <span className="fw-semibold text-dark text-capitalize">{p.billingName || 'Unknown User'}</span>
                      {p.billingEmail && <span className="text-muted small fs-7">{p.billingEmail}</span>}
                    </div>
                  </td>
                  
                  {/* Amount */}
                  <td className="py-3 fw-bold text-dark">
                    {p.currency === 'INR' ? '₹' : '$'}{p.amount?.toFixed(2)}
                  </td>
                  
                  {/* Method */}
                  <td className="py-3 text-dark small">
                    <span className="d-flex align-items-center gap-2">
                      <i className="fa-solid fa-credit-card text-muted opacity-75 text-dark" />
                      {PAYMENT_METHODS[p.method] || 'Unknown'}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="py-3">
                    {statusBadge(p.status)}
                  </td>
                  
                  {/* Date */}
                  <td className="py-3 text-dark small">
                    {formatDate(p.paymentDate || p.createdDate)}
                  </td>
                  
                  {/* Change Status Dropdown */}
                  <td className="py-3">
                    <select 
                      className="form-select form-select-sm border bg-light text-dark fw-medium rounded-3" 
                      style={{ width: 135, borderColor: '#e5e7eb' }} 
                      value={currentStatusName}
                      onChange={e => handleStatus(paymentId, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  
                  {/* Actions */}
                  <td className="pe-4 py-3 text-end">
                    <button 
                      className={`btn btn-sm rounded-3 px-3 fw-medium transition-all ${
                        currentStatusName === 'Refunded' 
                          ? 'btn-light text-muted opacity-50 border-0' 
                          : 'btn-outline-danger'
                      }`} 
                      onClick={() => handleRefund(paymentId)} 
                      disabled={currentStatusName === 'Refunded'}
                    >
                      <i className="fa-solid fa-rotate-left me-1.5 small" />Refund
                    </button>
                  </td>
                </tr>
              )
            })}
            
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <div className="py-4">
                    <i className="fa-solid fa-money-check-dollar fs-2 mb-3 opacity-20 d-block" style={{ color: purpleTheme.primaryText }} />
                    <span className="d-block fw-medium text-dark mb-1">No transactions found</span>
                    <span className="small text-muted">Active payment items will display right here.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}