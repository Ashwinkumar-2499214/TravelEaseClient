import React, { useEffect, useState } from 'react'
import { useAuth } from '../features/authentication/AuthProvider'
import notificationsService from '../features/notifications/services/notificationsService'
import { formatDate } from '../utils/date'

const CATEGORY_COLORS = {
  BookingConfirmation: 'success',
  BookingCancellation: 'danger',
  PaymentReminder: 'warning',
  PaymentConfirmation: 'success',
  ItineraryUpdate: 'info',
  ApprovalRequired: 'warning',
  SystemAlert: 'info',
  ComplianceAlert: 'danger',
}

const CATEGORY_ICONS = {
  BookingConfirmation: '✓',
  BookingCancellation: '✕',
  PaymentReminder: '💳',
  PaymentConfirmation: '✓',
  ItineraryUpdate: '📅',
  ApprovalRequired: '⚠️',
  SystemAlert: 'ℹ️',
  ComplianceAlert: '🔒',
}

const checkUnread = (n) => n.status === 'Unread' || n.status === 1
const checkRead = (n) => n.status === 'Read' || n.status === 2

export default function NotificationsPage() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const isAdmin = currentUser?.role === 'Admin'
  const [tab, setTab] = useState('my')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadUserNotifications()
    if (isAdmin) loadAllNotifications()
  }, [currentUser])

  const loadUserNotifications = async () => {
    if (!currentUser?.id) return
    try {
      setLoading(true)
      const data = await notificationsService.listForUser(currentUser.id)
      setNotifications(data || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllNotifications = async () => {
    try {
      const data = await notificationsService.listAll()
      setAllNotifications(data || [])
    } catch {
      setAllNotifications([])
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markRead(id)
      loadUserNotifications()
      if (isAdmin) loadAllNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllForUser(currentUser.id)
      loadUserNotifications()
      if (isAdmin) loadAllNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return
    try {
      await notificationsService.remove(id)
      loadUserNotifications()
      if (isAdmin) loadAllNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const activeSource = isAdmin && tab === 'all' ? allNotifications : notifications

  const displayNotifications = filter === 'unread'
    ? activeSource.filter(checkUnread)
    : filter === 'read'
      ? activeSource.filter(checkRead)
      : activeSource

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="text-light mb-2">
          <i className="fas fa-bell me-2"></i>Notifications
        </h2>
        <p className="text-muted">
          {isAdmin ? 'Manage all system notifications' : 'Your personal notifications and updates'}
        </p>
      </div>

      {isAdmin && (
        <div className="mb-3">
          <ul className="nav nav-tabs bg-dark border-secondary">
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'my' ? 'active text-info' : 'text-muted'}`}
                onClick={() => { setTab('my'); loadUserNotifications() }}
              >
                My Notifications
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'all' ? 'active text-info' : 'text-muted'}`}
                onClick={() => { setTab('all'); loadAllNotifications() }}
              >
                All System Notifications
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div className="btn-group" role="group">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              type="button"
              className={`btn btn-sm ${filter === f ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-sm btn-outline-success"
          onClick={handleMarkAllAsRead}
          disabled={displayNotifications.length === 0}
        >
          <i className="fas fa-check-double me-1"></i>Mark All as Read
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading notifications...</p>
        </div>
      ) : displayNotifications.length === 0 ? (
        <div className="alert alert-info text-center py-5" role="alert">
          <i className="fas fa-bell-slash me-2"></i>No notifications to display
        </div>
      ) : (
        <div className="row">
          {displayNotifications.map((notification) => (
            <div key={notification.notificationId} className="col-12 mb-3">
              <div
                className={`card bg-dark border-${CATEGORY_COLORS[notification.category] || 'secondary'} ${checkUnread(notification) ? 'border-2' : 'opacity-75'}`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-info">
                          {CATEGORY_ICONS[notification.category] || '•'} {notification.category}
                        </span>
                        {checkUnread(notification) && (
                          <span className="badge bg-warning text-dark">Unread</span>
                        )}
                        {isAdmin && notification.userName && (
                          <span className="text-muted small">User: {notification.userName}</span>
                        )}
                      </div>
                      <p className="card-text text-light mb-2">{notification.message}</p>
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>{formatDate(notification.createdDate)}
                      </small>
                      {notification.readDate && (
                        <small className="text-success ms-3">
                          <i className="fas fa-check me-1"></i>Read: {formatDate(notification.readDate)}
                        </small>
                      )}
                    </div>
                    <div className="d-flex gap-2 ms-3">
                      {checkUnread(notification) && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(notification.notificationId)}
                        title="Delete notification"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row mt-5 pt-3 border-top border-secondary">
        <div className="col-md-4 text-center">
          <h4 className="text-info">{activeSource.length}</h4>
          <p className="text-muted">Total Notifications</p>
        </div>
        <div className="col-md-4 text-center">
          <h4 className="text-warning">{activeSource.filter(checkUnread).length}</h4>
          <p className="text-muted">Unread</p>
        </div>
        <div className="col-md-4 text-center">
          <h4 className="text-success">{activeSource.filter(checkRead).length}</h4>
          <p className="text-muted">Read</p>
        </div>
      </div>
    </div>
  )
}
