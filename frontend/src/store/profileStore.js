import { create } from 'zustand'
import { initSocket, onSocketEvent, removeAllSocketListeners } from '../services/socket'
import API from '../services/api'

// Socket event handlers storage for cleanup
let socketCleanupFns = []

export const useProfileStore = create((set, get) => ({
  profile: null,
  posts: [],
  loading: false,
  error: null,

  // Initialize socket listeners for real-time follow updates
  initSocketListeners: () => {
    // Clear any existing listeners
    socketCleanupFns.forEach(fn => fn())
    socketCleanupFns = []

    // Initialize socket connection
    initSocket()

    // Follow update from another user
    socketCleanupFns.push(
      onSocketEvent('followUpdate', ({ targetUserId, currentUserId, isFollowing, followersCount, followingCount }) => {
        set((state) => ({
          profile: state.profile && state.profile._id === targetUserId
            ? { 
                ...state.profile, 
                isFollowing: state.profile._id === currentUserId ? isFollowing : state.profile.isFollowing,
                followersCount: followersCount !== undefined ? followersCount : state.profile.followersCount,
                followingCount: followingCount !== undefined ? followingCount : state.profile.followingCount,
              }
            : state.profile,
        }))
      })
    )
  },

  // Cleanup socket listeners
  cleanupSocketListeners: () => {
    socketCleanupFns.forEach(fn => fn())
    socketCleanupFns = []
    removeAllSocketListeners()
  },

  fetchProfile: async (userIdOrUsername) => {
    set({ loading: true, error: null })
    try {
      const res = await API.get(`/api/users/${userIdOrUsername}`)
      set({ profile: res.data })
    } catch (_err) {
      set({ error: _err.response?.data?.message || 'Failed to fetch profile' })
    } finally {
      set({ loading: false })
    }
  },

  fetchUserPosts: async (userId) => {
    set({ loading: true, error: null })
    try {
      const res = await API.get(`/api/posts/user/${userId}`)
      set({ posts: res.data })
    } catch {
      set({ error: 'Failed to fetch user posts' })
    } finally {
      set({ loading: false })
    }
  },

  followUser: async (targetUserId) => {
    const prevProfile = get().profile
    set((state) => {
      if (!state.profile) return state
      const isCurrentlyFollowing = state.profile.isFollowing
      return {
        profile: {
          ...state.profile,
          isFollowing: !isCurrentlyFollowing,
          followersCount: isCurrentlyFollowing
            ? state.profile.followersCount - 1
            : state.profile.followersCount + 1,
        },
      }
    })
    try {
      const res = await API.post(`/api/users/${targetUserId}/follow`)
      const { isFollowing, followersCount } = res.data
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, isFollowing, followersCount }
          : null,
      }))
    } catch {
      set({ profile: prevProfile })
    }
  },

  clearProfile: () => set({ profile: null, posts: [] }),
}))
