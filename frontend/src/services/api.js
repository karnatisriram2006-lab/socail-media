import axios from 'axios'
import { auth } from '../config/firebase'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

API.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch (err) {
      console.error('Failed to get Firebase ID token:', err.message)
    }
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const currentUser = auth.currentUser
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true)
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return API(originalRequest)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.message)
        }
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default API
