import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data

const authService = {
  login: async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },
  logout: async (userId) => {
    return api.post('/auth/logout', { userId })
  },
  resetPassword: async (payload) => {
    return api.post('/auth/reset-password', payload)
  },
  forgotPassword: async (payload) => {
    return api.post('/auth/forgot-password', payload)
  },
  getUsers: (searchTerm = '') => {

    const params = { 
      pageNumber: 1, 
      pageSize: 100,
      searchTerm: searchTerm.trim() 
    }
    return api.get('/users', { params }).then(unwrap)
  },
  registerUser: (payload) => api.post('/users/register', payload).then(unwrap),
  getUser: (id) => api.get(`/users/${id}`).then(unwrap),
  updateUser: (id, payload) => api.put(`/users/${id}`, payload).then(unwrap),
  deleteUser: (id) => api.delete(`/users/${id}`).then(unwrap),
  updateRoles: (id, newRole) => api.put(`/users/${id}/roles`, { userId: id, newRole }).then(unwrap),

  getRoles: () => Promise.resolve([
    { label: 'Traveler', value: 1 },
    { label: 'TravelAgent', value: 2 },
    { label: 'CorporateTravelManager', value: 3 },
    { label: 'FinanceOfficer', value: 4 },
    { label: 'ComplianceOfficer', value: 5 },
    { label: 'Admin', value: 6 },
  ]),
  getAuditLogs: () => api.get('/audit-logs').then(unwrap),
  getUserAuditLogs: (id) => api.get(`/users/${id}/audit-logs`).then(unwrap),
}

export default authService