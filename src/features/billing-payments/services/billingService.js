import api from '../../../utils/api'

const unwrap = (r) => r.data?.data ?? r.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

const billingService = {
  invoices: {
    list: (params = {}) => api.get('/invoices', { params: clean({ pageNumber: 1, pageSize: 50, ...params }) }).then(unwrap),
    create: (payload) => api.post('/invoices', payload).then(unwrap),
    update: (id, payload) => api.put(`/invoices/${id}`, payload).then(unwrap),
    remove: (id) => api.delete(`/invoices/${id}`).then(unwrap),
    patchStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }).then(unwrap),
    payments: {
      listForInvoice: (invoiceId) => api.get(`/invoices/${invoiceId}/payments`).then(unwrap),
      addPayment: (invoiceId, payload) => api.post(`/invoices/${invoiceId}/payments`, payload).then(unwrap),
    },
    adjustments: (invoiceId, payload) => api.post(`/invoices/${invoiceId}/adjustments`, payload).then(unwrap),
  },
  payments: {
    list: (params = {}) => api.get('/payments', { params: { pageNumber: 1, pageSize: 50, ...params } }).then(unwrap),
    get: (id) => api.get(`/payments/${id}`).then(unwrap),
    patchStatus: (id, status) => api.patch(`/payments/${id}/status`, { status }).then(unwrap),
    refund: (id, payload) => api.post(`/payments/${id}/refund`, payload).then(unwrap),
  },
  compliance: {
    reports: {
      list: (params = {}) => api.get('/compliance/reports', { params: clean(params) }).then(unwrap),
      create: (payload) => api.post('/compliance/reports', payload).then(unwrap),
      remove: (id) => api.delete(`/compliance/reports/${id}`).then(unwrap),
      download: (id) => api.get(`/compliance/reports/${id}/download`, { responseType: 'blob' }).then(r => r.data),
    },
    auditLogs: (params = {}) => api.get('/compliance/audit-logs', { params }).then(unwrap),
    exportAudit: (params = {}) => api.get('/compliance/audit-logs/export', { responseType: 'blob', params }).then(r => r.data),
    policies: {
      list: () => api.get('/compliance/policies').then(unwrap),
      update: (policyId, payload) => api.put(`/compliance/policies/${policyId}`, payload).then(unwrap),
    }
  }
}

export default billingService
