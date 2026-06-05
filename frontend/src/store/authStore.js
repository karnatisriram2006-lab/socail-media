import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithRedirect,
  getRedirectResult,
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
      const result = await getRedirectResult(auth)
      if (result?.user) {
        const firebaseUser = result.user
        const firebaseToken = await firebaseUser.getIdToken()
        const res = await API.post(
          '/api/auth/google',
          {},
          { headers: { Authorization: `Bearer ${firebaseToken}` } }
        )
        set({ user: res.data.user, isInitialized: true })
        return res.data.user
      }

      const currentUser = auth.currentUser
      if (!currentUser) {
        set({ isInitialized: true, user: null })
        return null
      }

      const res = await API.get('/api/auth/me')
      set({ user: res.data, isInitialized: true })
      return res.data
    } catch (err) {
      console.error('Auth init failed:', err.message)
      await signOut(auth)
      set({ user: null, isInitialized: true })
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
      set({ user: res.data.user })
      return res.data.user
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Registration failed'
      set({ error: errMsg })
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
      set({ user: res.data.user })
      return res.data.user
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) {
        set({ error: 'User not found. Please register first.' })
      } else {
        set({ error: err.response?.data?.message || err.message || 'Login failed' })
      }
      throw err
    } finally {
      set({ loading: false })
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      await signInWithRedirect(auth, googleProvider)
      return null
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Google login failed'
      set({ error: errMsg })
      throw new Error(errMsg)
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
    set({ user: null })
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
