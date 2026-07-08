import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const inventoryService = {
  listAll: (params = {}) => 
    api.get('/inventory', { 
      params: { 
        pageNumber: 1, 
        pageSize: 100, 
        ItemType: 'a',
        ...params 
      } 
    }).then(unwrap),

  getByPartner: (partnerId) =>
    api.get(`/inventory?ItemType=a`).then(unwrap),

  getById: (id) => api.get(`/inventory/${id}`).then(unwrap),

  patchStatus: (id, newAvailability, status) => 
    api.patch(`/inventory/${id}/availability`, { 
      newAvailability: newAvailability, 
      status: status 
    }).then(unwrap),

  uploadMedia: (partnerId, inventoryId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/partners/${partnerId}/inventory/${inventoryId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap)
  },
}

export default inventoryService