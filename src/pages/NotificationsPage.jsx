import React, { useEffect, useState } from 'react'
import { useAuth } from '../features/authentication/AuthProvider'
import notificationsService from '../features/notifications/services/notificationsService'
import { formatDate } from '../utils/date'

const CATEGORY_ICONS = {
  BookingConfirmation: '✓',
  BookingCancellation: '✕',
  PaymentReminder: '💳',
  PaymentConfirmation: '✓',
  ItineraryUpdate: '📅',
  ApprovalRequired: '⚠️',
  SystemAlert: 'ℹ️',
  ComplianceAlert: '🔒'
}

const checkUnread = (n) =>
  n.status === 'Unread' || n.status === 1

const checkRead = (n) =>
  n.status === 'Read' || n.status === 2

export default function NotificationsPage() {
  const { currentUser } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState('my')
  const [filter, setFilter] = useState('all')

  const isAdmin = currentUser?.role === 'Admin'

  useEffect(() => {
    loadUserNotifications()

    if (isAdmin) {
      loadAllNotifications()
    }
  }, [currentUser])

  const loadUserNotifications = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)

      const data =
        await notificationsService.listForUser(
          currentUser.id
        )

      setNotifications(data || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllNotifications = async () => {
    try {
      const data =
        await notificationsService.listAll()

      setAllNotifications(data || [])
    } catch {
      setAllNotifications([])
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markRead(id)

      loadUserNotifications()

      if (isAdmin) {
        loadAllNotifications()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllForUser(
        currentUser.id
      )

      loadUserNotifications()

      if (isAdmin) {
        loadAllNotifications()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this notification?'
      )
    )
      return

    try {
      await notificationsService.remove(id)

      loadUserNotifications()

      if (isAdmin) {
        loadAllNotifications()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const activeSource =
    isAdmin && tab === 'all'
      ? allNotifications
      : notifications

  const displayNotifications =
    filter === 'unread'
      ? activeSource.filter(checkUnread)
      : filter === 'read'
      ? activeSource.filter(checkRead)
      : activeSource

  return (
    <div className="container-fluid py-4">

      {/* Header */}

      <div className="mb-4">
        <h2
          className="fw-bold"
          style={{ color: '#6f42c1' }}
        >
          <i className="fas fa-bell me-2"></i>
          Notifications
        </h2>

        <p className="text-muted">
          {isAdmin
            ? 'Manage all system notifications'
            : 'Your personal notifications and updates'}
        </p>
      </div>

      {/* Admin Tabs */}

      {isAdmin && (
        <div className="mb-4">
          <ul className="nav nav-pills">

            <li className="nav-item me-2">
              <button
                className={`btn ${
                  tab === 'my'
                    ? 'text-white'
                    : 'btn-outline-secondary'
                }`}
                style={
                  tab === 'my'
                    ? {
                        backgroundColor:
                          '#6f42c1'
                      }
                    : {}
                }
                onClick={() => {
                  setTab('my')
                  loadUserNotifications()
                }}
              >
                My Notifications
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`btn ${
                  tab === 'all'
                    ? 'text-white'
                    : 'btn-outline-secondary'
                }`}
                style={
                  tab === 'all'
                    ? {
                        backgroundColor:
                          '#6f42c1'
                      }
                    : {}
                }
                onClick={() => {
                  setTab('all')
                  loadAllNotifications()
                }}
              >
                All Notifications
              </button>
            </li>

          </ul>
        </div>
      )}

      {/* Filters */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div className="btn-group">

          {['all', 'unread', 'read'].map(
            (item) => (
              <button
                key={item}
                className={`btn ${
                  filter === item
                    ? 'text-white'
                    : 'btn-outline-secondary'
                }`}
                style={
                  filter === item
                    ? {
                        backgroundColor:
                          '#6f42c1'
                      }
                    : {}
                }
                onClick={() =>
                  setFilter(item)
                }
              >
                {item.charAt(0).toUpperCase() +
                  item.slice(1)}
              </button>
            )
          )}

        </div>

        <button
          className="btn text-white"
          style={{
            backgroundColor: '#6f42c1'
          }}
          onClick={handleMarkAllAsRead}
        >
          <i className="fas fa-check-double me-2"></i>
          Mark All Read
        </button>

      </div>

      {/* Loading */}

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{
              color: '#6f42c1'
            }}
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>
        </div>
      ) : displayNotifications.length === 0 ? (
        <div className="alert alert-light border shadow-sm text-center">
          <i className="fas fa-bell-slash me-2"></i>
          No notifications available.
        </div>
      ) : (
        <div className="row">

          {displayNotifications.map(
            (notification) => (
              <div
                key={
                  notification.notificationId
                }
                className="col-12 mb-3"
              >
                <div
                  className={`card shadow-sm border-0 ${
                    checkUnread(notification)
                      ? ''
                      : 'opacity-75'
                  }`}
                >
                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div className="flex-grow-1">

                        <div className="mb-2">

                          <span
                            className="badge me-2"
                            style={{
                              backgroundColor:
                                '#6f42c1'
                            }}
                          >
                            {CATEGORY_ICONS[
                              notification
                                .category
                            ] || '•'}{' '}
                            {
                              notification.category
                            }
                          </span>

                          {checkUnread(
                            notification
                          ) && (
                            <span className="badge bg-warning text-dark">
                              Unread
                            </span>
                          )}

                        </div>

                        <p className="mb-2">
                          {
                            notification.message
                          }
                        </p>

                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {formatDate(
                            notification.createdDate
                          )}
                        </small>

                        {notification.readDate && (
                          <small className="text-success ms-3">
                            <i className="fas fa-check me-1"></i>
                            Read:{' '}
                            {formatDate(
                              notification.readDate
                            )}
                          </small>
                        )}

                      </div>

                      <div className="ms-3 d-flex gap-2">

                        {checkUnread(
                          notification
                        ) && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() =>
                              handleMarkAsRead(
                                notification.notificationId
                              )
                            }
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDelete(
                              notification.notificationId
                            )
                          }
                        >
                          <i className="fas fa-trash"></i>
                        </button>

                      </div>

                    </div>

                  </div>
                </div>
              </div>
            )
          )}

        </div>
      )}

      {/* Statistics */}

      <div className="row mt-5">

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3
                style={{
                  color: '#6f42c1'
                }}
              >
                {activeSource.length}
              </h3>
              <small className="text-muted">
                Total Notifications
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-warning">
                {
                  activeSource.filter(
                    checkUnread
                  ).length
                }
              </h3>
              <small className="text-muted">
                Unread
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success">
                {
                  activeSource.filter(
                    checkRead
                  ).length
                }
              </h3>
              <small className="text-muted">
                Read
              </small>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}