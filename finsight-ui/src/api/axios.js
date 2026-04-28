import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore.js'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// auto-logout on 401 or 403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status

    if (status === 401 || status === 403) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

export default api