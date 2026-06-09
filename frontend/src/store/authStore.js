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
import API from '../services/api'

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

setPersistence(auth, browserLocalPersistence).catch(() => { /* ignore */ })

function getFirebaseErrorMessage(code, fallback = 'Authentication failed') {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/requires-recent-login': 'Please sign in again to perform this action.',
  };
  return messages[code] || fallback;
}

export const useAuthStore = create((set, get) => ({
  user: loadCachedUser(),
  loading: false,
  error: null,
  isInitialized: false,
  firebaseUser: null,

  initialize: async () => {
    set({ loading: true, error: null })
    return new Promise((resolve) => {
      let resolved = false
      const finish = async () => {
        if (resolved) return
        resolved = true
        const firebaseUser = auth.currentUser
        const cached = loadCachedUser()

        if (!firebaseUser && !cached) {
          set({ isInitialized: true, user: null, firebaseUser: null })
          saveCachedUser(null)
          set({ loading: false })
          resolve(null)
          return
        }

        if (!firebaseUser && cached) {
          set({ user: cached, firebaseUser: null, isInitialized: true, loading: false })
          resolve(cached)
          return
        }

        set({ firebaseUser, isInitialized: true })

        try {
          const res = await API.get('/api/auth/me')
          set({ user: res.data, error: null })
          saveCachedUser(res.data)
          set({ loading: false })
          resolve(res.data)
        } catch (apiErr) {
          if (apiErr.response?.status === 404) {
            try { await signOut(auth) } catch { /* ignore */ }
            saveCachedUser(null)
            set({ user: null, firebaseUser: null, error: 'Account no longer exists. Please register again.' })
          } else {
            const cached = loadCachedUser()
            set({ user: cached, error: null })
            setTimeout(() => get().refreshUser().catch(() => { /* ignore */ }), 3000)
          }
          set({ loading: false })
          resolve(get().user)
        }
      }

      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe()
        finish()
      })

      setTimeout(() => {
        if (!resolved) {
          unsubscribe()
          finish()
        }
      }, 2000)
    })
  },

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
  clearError: () => set({ error: null }),

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
      const code = err.code || ''
      const errMsg = getFirebaseErrorMessage(code, err.response?.data?.message || err.message || 'Registration failed')
      set({ error: errMsg, isInitialized: true })
      const newError = new Error(errMsg)
      newError.code = code
      throw newError
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
      const code = err.code || ''
      const errMsg = getFirebaseErrorMessage(code, err.response?.data?.message || err.message || 'Login failed')
      set({ error: errMsg, isInitialized: true })
      const error = new Error(errMsg)
      error.code = code
      throw error
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
      const code = err.code || ''
      const errMsg = getFirebaseErrorMessage(code, err.response?.data?.message || err.message || 'Google sign-in failed')
      set({ isInitialized: true, error: errMsg })
      const error = new Error(errMsg)
      error.code = code
      throw error
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
    set({ user: null, firebaseUser: null, isInitialized: false, error: null })
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

// Force-logout listener for API client (only on truly unrecoverable token failures)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  import('../services/api').then(({ authEvents }) => {
    authEvents.onForceLogout((reason) => {
      // Reserved for future use
      console.warn('[Auth] Force logout:', reason);
    });
  });
}