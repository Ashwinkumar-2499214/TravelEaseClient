import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

const analyticsService = {
  kpiReports: {
    list: (params = {}) => api.get('/analytics/kpi-reports', { params: clean(params) }).then(unwrap),
    create: (payload) => api.post('/analytics/kpi-reports', payload).then(unwrap),
    remove: (id) => api.delete(`/analytics/kpi-reports/${id}`).then(unwrap),
    download: (id) => api.get(`/analytics/kpi-reports/${id}/download`, { responseType: 'blob' }).then(r => r.data),
  },
  dashboards: {
    travelSpend: () => api.get('/analytics/dashboards/travel-spend').then(unwrap),
    bookingVolume: () => api.get('/analytics/dashboards/booking-volume').then(unwrap),
    cancellations: () => api.get('/analytics/dashboards/cancellations').then(unwrap),
  },
  trends: {
    spendPerTraveler: () => api.get('/analytics/trends/spend-per-traveler').then(unwrap),
    destinations: () => api.get('/analytics/trends/destinations').then(unwrap),
  }
}

export default analyticsService
