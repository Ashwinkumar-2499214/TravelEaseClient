import React, { useEffect, useState } from 'react'
import notificationsService from '../services/notificationsService'
import { useAuth } from '../../authentication/AuthProvider'
import { formatDate } from '../../../utils/date'

export default function NotificationsPanel() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    if (!currentUser?.id) return
    setLoading(true)
    notificationsService.listForUser(currentUser.id)
      .then(setNotifications)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [currentUser])

  const markRead = async (id) => {
    try { await notificationsService.markRead(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const markAllRead = async () => {
    try { await notificationsService.markAllForUser(currentUser.id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const remove = async (id) => {
    try { await notificationsService.remove(id); load() }
    catch (err) { alert(err?.response?.data?.message || err.message) }
  }

  const unreadCount = notifications.filter(n => !n.isRead && n.status !== 'Read').length

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Notifications
          {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount}</span>}
        </h5>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-outline-secondary" onClick={markAllRead}>Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="alert alert-info">No notifications.</div>
      ) : (
        <ul className="list-group">
          {notifications.map(n => {
            const isUnread = !n.isRead && n.status !== 'Read'
            return (
              <li key={n.id} className={`list-group-item d-flex justify-content-between align-items-start ${isUnread ? 'list-group-item-warning' : ''}`}>
                <div>
                  <div className="fw-semibold">{n.title || n.message}</div>
                  {n.body && <div className="text-muted small">{n.body}</div>}
                  <div className="text-muted small">{formatDate(n.createdAt)} — <span className="badge bg-secondary">{n.category || n.type}</span></div>
                </div>
                <div className="d-flex gap-1 ms-3 flex-shrink-0">
                  {isUnread && (
                    <button className="btn btn-sm btn-outline-success" title="Mark read" onClick={() => markRead(n.id)}>
                      <i className="fa-solid fa-check" />
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => remove(n.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
