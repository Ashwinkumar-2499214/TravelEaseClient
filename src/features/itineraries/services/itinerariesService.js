import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const itinerariesService = {
  list: (params = {}) => api.get('/itineraries', { params: { pageNumber: 1, pageSize: 50, ...params } }).then(unwrap),
  create: (payload) => api.post('/itineraries', payload).then(unwrap),
  get: (id) => api.get(`/itineraries/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/itineraries/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/itineraries/${id}`).then(unwrap),
  patchStatus: (id, newStatus) => api.patch(`/itineraries/${id}/status`, { newStatus }).then(unwrap),
  bookings: {
    list: (itId) => api.get(`/itineraries/${itId}/bookings`).then(unwrap),
    add: (itId, payload) => api.post(`/itineraries/${itId}/bookings`, payload).then(unwrap),
    remove: (itId, bookingId) => api.delete(`/itineraries/${itId}/bookings/${bookingId}`).then(unwrap),
  },
  export: (id) => api.get(`/itineraries/${id}/export`, { responseType: 'blob' }).then(r => r.data),
  share: (id, payload) => api.post(`/itineraries/${id}/share`, payload).then(unwrap),
}

export default itinerariesService
