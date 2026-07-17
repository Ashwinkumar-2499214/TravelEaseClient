import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const partnersService = {
  // Example endpoint: GET /api/v1/partners?SearchTerm=a&pageNumber=1&pageSize=50
  // If SearchTerm is not provided, backend defaults are handled by passing 'a'.
  list: (params = {}) => {
    const safeParams = { ...params }
    if (safeParams.SearchTerm === undefined || safeParams.SearchTerm === null) {
      safeParams.SearchTerm = 'a'
    }

    return api.get('/partners', {
      params: {
        pageNumber: 1,
        pageSize: 50,
        SearchTerm: '',
        ...safeParams
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
    return api.patch(`/partners/${id}/status`, { status: Number(status) }).then(unwrap)
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
  
  patchInventoryStatus: (partnerId, inventoryId, currentAvailability, newStatus) => {
    const url = `/inventory/${inventoryId}/availability`
    const payload = { 
        availability: currentAvailability, 
        status: newStatus 
    }
    return api.patch(url, payload).then(unwrap)
  },
}

export default partnersService