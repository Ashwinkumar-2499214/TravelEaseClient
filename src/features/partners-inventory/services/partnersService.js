import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const partnersService = {
  list: (params = {}) => {
    return api.get('/partners', { 
      params: { 
        pageNumber: 1, 
        pageSize: 50, 
        SearchTerm: '', 
        ...params 
      } 
    }).then(unwrap)
  },
  
  create: (payload) => {
    return api.post('/partners', payload).then(unwrap)
  },
  
  get: (id) => {
    return api.get(`/partners/${id}`).then(unwrap)
  },
  
  update: (id, payload) => {
    return api.put(`/partners/${id}`, payload).then(unwrap)
  },
  
  remove: (id) => {
    return api.delete(`/partners/${id}`).then(unwrap)
  },
  
  patchStatus: (id, status) => {
    return api.patch(`/partners/${id}/status`, { status }).then(unwrap)
  },
  
  listInventory: (partnerId) => {
    const url = `/partners/${partnerId}/inventory`
    const params = { pageNumber: 1, pageSize: 50 }
    
    return api.get(url, { params }).then(unwrap)
  },
  
  createInventory: (partnerId, payload) => {
    const url = `/partners/${partnerId}/inventory`
    
    return api.post(url, payload).then(unwrap)
  },
  
  updateInventory: (partnerId, inventoryId, payload) => {
    const url = `/partners/${partnerId}/inventory/${inventoryId}`
    
    return api.put(url, payload).then(unwrap)
  },
  
  deleteInventory: (partnerId, inventoryId) => {
    const url = `/partners/${partnerId}/inventory/${inventoryId}`
    
    return api.delete(url).then(unwrap)
  },
  
  patchInventoryStatus: (partnerId, inventoryId, status) => {
    const url = `/partners/${partnerId}/inventory/${inventoryId}/status`
    
    return api.patch(url, { status }).then(unwrap)
  },
}

export default partnersService