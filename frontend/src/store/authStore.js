import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import API, { authEvents } from '../services/api'

// Cache the user object in localStorage so reloads don't bounce to /login
// while the backend /api/auth/me call is in-flight.
const USER_CACHE_KEY = 'vsnaps_user_cache'
const loadCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const saveCachedUser = (u) => {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
    else localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    /* ignore */
  }
}

// Make sure Firebase uses local persistence (default) so reloads keep the
// session. This is idempotent.
setPersistence(auth, browserLocalPersistence).catch(() => { /* ignore */ })

export const useAuthStore = create((set, get) => ({
  user: loadCachedUser(),
  loading: false,
  error: null,
  isInitialized: false,
  forceLogoutReason: null,
  firebaseUser: null,

  initialize: async () => {
    set({ loading: true, error: null })
    // Wait for Firebase to restore the persisted session, then hydrate the UI.
    return new Promise((resolve) => {
      let resolved = false
      const finish = async () => {
        if (resolved) return
        resolved = true
        const firebaseUser = auth.currentUser
        if (!firebaseUser) {
          // No Firebase session — show the login page.
          set({ isInitialized: true, user: null, firebaseUser: null })
          saveCachedUser(null)
          set({ loading: false })
          resolve(null)
          return
        }

        // We have a Firebase session. Optimistically let the UI render the
        // dashboard immediately using the cached user, then refresh the
        // profile from the backend in the background.
        set({ firebaseUser, isInitialized: true })

        try {
          const res = await API.get('/api/auth/me')
          set({ user: res.data, error: null })
          saveCachedUser(res.data)
          set({ loading: false })
          resolve(res.data)
        } catch (apiErr) {
          // Don't sign the user out on a transient API failure. Just keep
          // the cached user on screen and try again on the next render.
          // We only sign out if the backend explicitly says the user
          // doesn't exist (404).
          if (apiErr.response?.status === 404) {
            try { await signOut(auth) } catch { /* ignore */ }
            saveCachedUser(null)
            set({ user: null, firebaseUser: null, error: 'Account no longer exists. Please register again.' })
          } else {
            // Transient error — keep cached user, schedule a retry
            const cached = loadCachedUser()
            set({ user: cached, error: null })
            setTimeout(() => get().refreshUser().catch(() => { /* ignore */ }), 3000)
          }
          set({ loading: false })
          resolve(get().user)
        }
      }

      // onAuthStateChanged fires immediately with the current persisted user
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe()
        finish()
      })

      // Safety net: if onAuthStateChanged never resolves, finish after 2s
      setTimeout(() => {
        if (!resolved) {
          unsubscribe()
          finish()
        }
      }, 2000)
    })
  },

  // Re-fetch the user from the backend (called on app focus, etc.)
  refreshUser: async () => {
    if (!auth.currentUser) return null
    try {
      const res = await API.get('/api/auth/me')
      set({ user: res.data, error: null })
      saveCachedUser(res.data)
      return res.data
    } catch (err) {
      if (err.response?.status === 404) {
        try { await signOut(auth) } catch { /* ignore */ }
        saveCachedUser(null)
        set({ user: null, firebaseUser: null })
      }
      throw err
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null, forceLogoutReason: null }),

  setAuth: (user) => {
    saveCachedUser(user)
    set({ user, error: null })
  },

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
      set({ user: res.data.user, firebaseUser, isInitialized: true, error: null })
      saveCachedUser(res.data.user)
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
      set({ user: res.data.user, firebaseUser, isInitialized: true, error: null })
      saveCachedUser(res.data.user)
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
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      const firebaseToken = await firebaseUser.getIdToken()

      const res = await API.post(
        '/api/auth/google',
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      )

      set({ user: res.data.user, firebaseUser, isInitialized: true, error: null })
      saveCachedUser(res.data.user)
      return res.data.user
    } catch (err) {
      console.error('Google login error:', err)

      let errorMsg = 'Google login failed'
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Pop-up blocked. Please allow pop-ups and try again.'
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Login was cancelled'
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

  logout: async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Firebase sign out error:', err.message)
    }
    saveCachedUser(null)
    set({ user: null, firebaseUser: null, isInitialized: false, error: null, forceLogoutReason: null })
  },

  handleForceLogout: (reason) => {
    saveCachedUser(null)
    set({ forceLogoutReason: reason, user: null, firebaseUser: null, isInitialized: true })
  },

  updateProfile: async (formData) => {
    set({ loading: true, error: null })
    try {
      const res = await API.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set({ user: res.data.user })
      saveCachedUser(res.data.user)
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

// Force-logout from the API client (only on truly unrecoverable token failures)
if (typeof window !== 'undefined') {
  authEvents.onForceLogout((reason) => {
    useAuthStore.getState().handleForceLogout(reason)
  })
}
