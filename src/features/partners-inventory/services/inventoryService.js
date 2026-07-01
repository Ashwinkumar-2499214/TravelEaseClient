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

  getById: (id) => api.get(`/inventory/${id}`).then(unwrap),
  updateAvailability: (id, payload) => api.patch(`/inventory/${id}/availability`, payload).then(unwrap),
}

export default inventoryService