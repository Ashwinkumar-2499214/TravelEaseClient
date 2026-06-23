import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const notificationsService = {
  listForUser: (userId) => api.get(`/users/${userId}/notifications`).then(unwrap),
  create: (payload) => api.post('/notifications', payload).then(unwrap),
  get: (id) => api.get(`/notifications/${id}`).then(unwrap),
  remove: (id) => api.delete(`/notifications/${id}`).then(unwrap),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(unwrap),
  markAllForUser: (userId) => api.put(`/users/${userId}/notifications/read-all`).then(unwrap),
}

export default notificationsService
