import React, { useEffect, useState } from 'react'
import notificationsService from '../services/notificationsService'
import { useAuth } from '../../authentication/AuthProvider'
import { formatDate } from '../../../utils/date'

const CATEGORIES = [
  'BookingConfirmation',
  'BookingCancellation',
  'PaymentReminder',
  'PaymentConfirmation',
  'ItineraryUpdate',
  'ApprovalRequired',
  'SystemAlert',
  'ComplianceAlert',
]

const checkUnread = (n) => n.status === 'Unread' || n.status === 1
const categoryLabel = (n) => typeof n.category === 'number' ? CATEGORIES[n.category] : n.category

export default function NotificationsPanel({ adminMode = false }) {
  const { currentUser } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(!adminMode)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('all')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [allNotifications, setAllNotifications] = useState([])
  const [allLoading, setAllLoading] = useState(false)
  const [searchUserId, setSearchUserId] = useState('')
  const [form, setForm] = useState({ userId: '', message: '', category: 0 })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  const loadForUser = (uid) => {
    setAllLoading(true)
    notificationsService.listForUser(uid)
      .then(setAllNotifications)
      .catch(() => setAllNotifications([]))
      .finally(() => setAllLoading(false))
  }

  const load = () => {
    if (!currentUser?.id) return
    setLoading(true)
    notificationsService.listForUser(currentUser.id)
      .then(setNotifications)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!adminMode) load()
  }, [currentUser])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.userId || !form.message.trim()) { setFormError('User ID and message are required.'); return }
    setSubmitting(true)
    try {
      await notificationsService.create({ userId: Number(form.userId), message: form.message, category: Number(form.category) })
      setForm({ userId: '', message: '', category: 0 })
      setSuccessMsg('Notification sent successfully.')
      setTimeout(() => setSuccessMsg(null), 3000)
      if (searchUserId) loadForUser(Number(searchUserId))
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this notification?')) return
    try {
      await notificationsService.remove(id)
      if (adminMode) { if (searchUserId) loadForUser(Number(searchUserId)) }
      else { if (detail?.notificationId === id) setDetail(null); load() }
    } catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const markRead = async (id) => {
    try { await notificationsService.markRead(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const markAllRead = async () => {
    try { await notificationsService.markAllForUser(currentUser.id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const openDetail = async (id) => {
    setDetailLoading(true)
    try { setDetail(await notificationsService.get(id)) }
    catch (err) { alert(err?.response?.data?.message || err.message) }
    finally { setDetailLoading(false) }
  }

  // ── ADMIN MODE ──────────────────────────────────────────────
  if (adminMode) return (
    <div>
      <h5 className="mb-3">Send Notification</h5>
      <form className="card card-body bg-dark border-secondary mb-4" onSubmit={handleCreate}>
        <div className="row g-2">
          <div className="col-md-3">
            <input
              type="number" className="form-control form-control-sm" placeholder="User ID"
              value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required
            />
          </div>
          <div className="col-md-5">
            <input
              type="text" className="form-control form-control-sm" placeholder="Message"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
            />
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c, i) => <option key={i} value={i}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-1 d-flex">
            <button className="btn btn-sm btn-primary w-100" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner-border spinner-border-sm" /> : 'Send'}
            </button>
          </div>
        </div>
        {formError && <div className="text-danger small mt-2">{formError}</div>}
        {successMsg && <div className="text-success small mt-2">{successMsg}</div>}
      </form>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Notifications by User</h5>
      </div>
      <div className="input-group input-group-sm mb-3">
        <input
          type="number" className="form-control" placeholder="Enter User ID to view notifications"
          value={searchUserId} onChange={e => setSearchUserId(e.target.value)}
        />
        <button className="btn btn-outline-info" onClick={() => searchUserId && loadForUser(Number(searchUserId))}>
          <i className="fa-solid fa-magnifying-glass me-1" />Search
        </button>
      </div>

      {allLoading ? (
        <div className="text-center py-3"><div className="spinner-border" /></div>
      ) : allNotifications.length === 0 ? (
        <div className="alert alert-info">{searchUserId ? 'No notifications found for this user.' : 'Enter a User ID to view notifications.'}</div>
      ) : (
        <ul className="list-group">
          {allNotifications.map(n => (
            <li key={n.notificationId} className="list-group-item d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold">{n.message}</div>
                <div className="text-muted small">
                  {n.userName || `User #${n.userId}`} &nbsp;—&nbsp;
                  <span className="badge bg-secondary">{categoryLabel(n)}</span>
                  &nbsp;—&nbsp;{formatDate(n.createdDate)}
                  &nbsp;—&nbsp;
                  <span className={`badge ${checkUnread(n) ? 'bg-warning text-dark' : 'bg-success'}`}>
                    {checkUnread(n) ? 'Unread' : 'Read'}
                  </span>
                </div>
              </div>
              <button className="btn btn-sm btn-outline-danger ms-3 flex-shrink-0" title="Delete" onClick={() => remove(n.notificationId)}>
                <i className="fa-solid fa-trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  // ── NON-ADMIN MODE ──────────────────────────────────────────
  const unreadCount = notifications.filter(checkUnread).length
  const displayed = tab === 'unread' ? notifications.filter(checkUnread) : notifications

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Notifications
          {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount} unread</span>}
        </h5>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-outline-secondary" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            All <span className="badge bg-secondary ms-1">{notifications.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
            Unread {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
          </button>
        </li>
      </ul>

      {(detail || detailLoading) && (
        <div className="card card-body mb-3 border-info bg-dark">
          {detailLoading ? <div className="spinner-border spinner-border-sm" /> : (
            <>
              <div className="d-flex justify-content-between">
                <strong>{CATEGORIES[detail.category] ?? detail.category}</strong>
                <button className="btn-close btn-close-white" onClick={() => setDetail(null)} />
              </div>
              <p className="mb-1 mt-2">{detail.message}</p>
              <div className="text-muted small">
                Status: {checkUnread(detail) ? 'Unread' : 'Read'} &nbsp;|&nbsp;
                Created: {formatDate(detail.createdDate)}
                {detail.readDate && <> &nbsp;|&nbsp; Read: {formatDate(detail.readDate)}</>}
              </div>
            </>
          )}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="alert alert-info">{tab === 'unread' ? 'No unread notifications.' : 'No notifications.'}</div>
      ) : (
        <ul className="list-group">
          {displayed.map(n => (
            <li key={n.notificationId} className={`list-group-item d-flex justify-content-between align-items-start ${checkUnread(n) ? 'list-group-item-warning' : ''}`}>
              <div role="button" className="flex-grow-1" onClick={() => openDetail(n.notificationId)} style={{ cursor: 'pointer' }}>
                <div className="fw-semibold">{n.message}</div>
                <div className="text-muted small">
                  {formatDate(n.createdDate)} &nbsp;—&nbsp;
                  <span className="badge bg-secondary">{categoryLabel(n)}</span>
                </div>
              </div>
              <div className="d-flex gap-1 ms-3 flex-shrink-0">
                {checkUnread(n) && (
                  <button className="btn btn-sm btn-outline-success" title="Mark read" onClick={() => markRead(n.notificationId)}>
                    <i className="fa-solid fa-check" />
                  </button>
                )}
                <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => remove(n.notificationId)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
