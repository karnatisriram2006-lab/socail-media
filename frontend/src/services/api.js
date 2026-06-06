import axios from 'axios'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'

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
    
    // Handle 401 errors by trying to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const currentUser = auth.currentUser
      
      if (currentUser) {
        try {
          // Force refresh the Firebase token
          const freshToken = await currentUser.getIdToken(true)
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return API(originalRequest)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.message)
          // Store error flag for auth store to pick up
          sessionStorage.setItem('authError', 'Session expired. Please login again.')
          // Sign out locally
          try {
            await auth.signOut()
          } catch (signoutErr) {
            console.error('Sign out error:', signoutErr)
          }
          // Don't redirect here - let the auth store handle it
          return Promise.reject(refreshError)
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default API
