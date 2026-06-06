import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import API from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    set({ loading: true, error: null })
    try {
      // Check for existing Firebase session
      const currentUser = auth.currentUser
      if (!currentUser) {
        set({ isInitialized: true, user: null })
        return null
      }

      // Fetch user data from backend
      try {
        const res = await API.get('/api/auth/me')
        set({ user: res.data, isInitialized: true, error: null })
        return res.data
      } catch (apiErr) {
        console.error('Failed to fetch user from backend:', apiErr)
        // If backend fails but Firebase session exists, sign out to be safe
        if (apiErr.response?.status === 401) {
          try {
            await signOut(auth)
          } catch (signoutErr) {
            console.error('Sign out error:', signoutErr)
          }
          set({ user: null, isInitialized: true, error: 'Session expired. Please login again.' })
        } else {
          // For other errors, keep initialized but mark as error
          set({ isInitialized: true, error: 'Failed to sync user session' })
        }
        return null
      }
    } catch (err) {
      console.error('Auth init failed:', err)
      set({ user: null, isInitialized: true, error: 'Authentication failed' })
      return null
    } finally {
      set({ loading: false })
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setAuth: (user) => set({ user, error: null }),

  register: async (email, password, username, name, bio) => {
    set({ loading: true, error: null })
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      const firebaseToken = await firebaseUser.getIdToken()
      const res = await API.post(
        '/api/auth/register',
        { username, name, bio },
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      )
      set({ user: res.data.user, isInitialized: true, error: null })
      return res.data.user
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Registration failed'
      set({ error: errMsg, isInitialized: true })
      throw new Error(errMsg)
    } finally {
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      const firebaseToken = await firebaseUser.getIdToken()
      const res = await API.post(
        '/api/auth/login',
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      )
      set({ user: res.data.user, isInitialized: true, error: null })
      return res.data.user
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) {
        set({ error: 'User not found. Please register first.' })
      } else {
        set({ error: err.response?.data?.message || err.message || 'Login failed' })
      }
      set({ isInitialized: true })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      console.log('Starting Google login popup...')
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      const firebaseToken = await firebaseUser.getIdToken()
      
      console.log('Google login successful, sending to backend...')
      const res = await API.post(
        '/api/auth/google',
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      )
      
      set({ user: res.data.user, isInitialized: true, error: null })
      return res.data.user
    } catch (err) {
      console.error('Google login error:', err)
      
      // Handle specific Firebase errors
      let errorMsg = 'Google login failed'
      
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Pop-up blocked. Please allow pop-ups and try again.'
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Login was cancelled'
      } else if (err.code === 'auth/operation-not-supported-in-this-environment') {
        errorMsg = 'Google login not supported in this environment'
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (err.message) {
        errorMsg = err.message
      }
      
      set({ isInitialized: true, error: errorMsg })
      throw new Error(errorMsg)
    } finally {
      set({ loading: false })
    }
  },

  checkAuth: async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      set({ isInitialized: true, user: null })
      return null
    }
    try {
      const res = await API.get('/api/auth/me')
      set({ user: res.data, isInitialized: true })
      return res.data
    } catch (err) {
      console.error('Auth check failed:', err.message)
      get().logout()
      set({ isInitialized: true })
      return null
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Firebase sign out error:', err.message)
    }
    set({ user: null, isInitialized: false, error: null })
  },

  updateProfile: async (formData) => {
    set({ loading: true, error: null })
    try {
      const res = await API.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set({ user: res.data.user })
      return res.data.user
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Update failed'
      set({ error: errMsg })
      throw new Error(errMsg)
    } finally {
      set({ loading: false })
    }
  },
}))
