import axios from 'axios'


const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token if present
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('te_auth')
    if (raw) {
      const { token } = JSON.parse(raw)
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // ignore
  }
  return config
})

// Global response handler (401 => logout)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('te_auth')
      // safe redirect to login
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
