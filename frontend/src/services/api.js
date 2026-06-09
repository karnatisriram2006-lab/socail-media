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
            // Token refresh failed (e.g. after ~24h of inactivity the refresh
            // token expires). Do NOT force the user to log out — keep the
            // cached session on screen so they stay logged in until they
            // manually click "Sign Out". API calls that need auth will simply
            // fail, and the UI can show a "Please re-login" toast instead.
            console.warn('Token refresh failed (user may need to re-login for new actions):', refreshError.message)
            return Promise.reject(refreshError)
          }
        } else {
          // No Firebase session — but the user may still have cached data.
          // Don't force logout here either; let the auth store's initialize()
          // handle it based on onAuthStateChanged.
          return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default API
