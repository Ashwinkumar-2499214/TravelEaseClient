import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

const analyticsService = {
  kpiReports: {
    list: (params = {}) => api.get('/analytics/kpi-reports', { params: clean(params) }).then(unwrap),
    create: (payload) => api.post('/analytics/kpi-reports', payload).then(unwrap),
    remove: (id) => api.delete(`/analytics/kpi-reports/${id}`).then(unwrap),
    getById: (id) => api.get(`/analytics/kpi-reports/${id}`).then(unwrap),
  },
  dashboards: {
    travelSpend: (filter) => api.get('/analytics/dashboards/travel-spend', { params: { filter } }).then(unwrap),
    bookingVolume: (filter) => api.get('/analytics/dashboards/booking-volume', { params: { filter } }).then(unwrap),
    cancellations: (filter) => api.get('/analytics/dashboards/cancellations', { params: { filter } }).then(unwrap),
    avgBookingValue: (filter) => api.get('/analytics/dashboards/avg-booking-value', { params: { filter } }).then(unwrap),
    topSpenders: (filter) => api.get('/analytics/dashboards/top-spenders', { params: { filter } }).then(unwrap),
    revenueByType: (filter) => api.get('/analytics/dashboards/revenue-by-type', { params: { filter } }).then(unwrap),
  },
  trends: {
    spendPerTraveler: () => api.get('/analytics/trends/spend-per-traveler').then(unwrap),
    destinations: () => api.get('/analytics/trends/destinations').then(unwrap),
  }
}

export default analyticsService
