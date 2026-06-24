import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const partnersService = {
  list: (params = {}) => api.get('/partners', { 
    params: { 
      pageNumber: 1, 
      pageSize: 50, 
      SearchTerm: '', 
      ...params 
    } 
  }).then(unwrap),
  
  create: (payload) => api.post('/partners', payload).then(unwrap),
  get: (id) => api.get(`/partners/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/partners/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/partners/${id}`).then(unwrap),
  patchStatus: (id, status) => api.patch(`/partners/${id}/status`, { status }).then(unwrap),
  listInventory: (partnerId) => api.get(`/partners/${partnerId}/inventory`, { params: { pageNumber: 1, pageSize: 50 } }).then(unwrap),
  createInventory: (partnerId, payload) => api.post(`/partners/${partnerId}/inventory`, payload).then(unwrap),
}

export default partnersService