import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const bookingsService = {
  list: (params = {}) => api.get('/bookings', { params: { pageNumber: 1, pageSize: 50, ...params } }).then(unwrap),
  create: (payload) => api.post('/bookings', payload).then(unwrap),
  get: (id) => api.get(`/bookings/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/bookings/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/bookings/${id}`).then(unwrap),
  patchStatus: (id, newStatus) => api.patch(`/bookings/${id}/status`, { newStatus }).then(unwrap),
}

export default bookingsService
