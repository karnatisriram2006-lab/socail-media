import axios from 'axios'
import { auth } from '../config/firebase'

// Event channel the auth store subscribes to. We never call signOut()
// directly from inside the interceptor so we don't create a logout loop
// (signOut → triggers a re-render → another API call fails → signOut again).
export const authEvents = {
  listeners: new Set(),
  onForceLogout(handler) {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  },
  emitForceLogout(reason) {
    this.listeners.forEach((h) => {
      try { h(reason) } catch (e) { console.error(e) }
    })
  },
}

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

API.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      // getIdToken() returns a cached token and auto-refreshes if expired.
      // We only force refresh on 401 retries below.
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
    const originalRequest = error.config || {}
    const status = error.response?.status

    // Only attempt refresh+retry once per request, and only on 401
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const currentUser = auth.currentUser

      if (currentUser) {
        try {
          // Force a token refresh — Firebase may have a cached valid token
          // even if the request we just made was rejected.
          const freshToken = await currentUser.getIdToken(true)
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return API(originalRequest)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.message)
          // The Firebase user is no longer recoverable. Tell the auth store.
          // The store will sign out + redirect — we just signal it here.
          authEvents.emitForceLogout('Session expired. Please login again.')
          return Promise.reject(refreshError)
        }
      } else {
        // No Firebase session at all. Tell the store to clean up.
        authEvents.emitForceLogout('Please login to continue.')
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default API
