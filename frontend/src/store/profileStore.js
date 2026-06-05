import { create } from 'zustand'
import { getSocket } from '../services/socket'
import API from '../services/api'

export const useProfileStore = create((set, get) => ({
  profile: null,
  posts: [],
  loading: false,
  error: null,

  fetchProfile: async (userIdOrUsername) => {
    set({ loading: true, error: null })
    try {
      const res = await API.get(`/api/users/${userIdOrUsername}`)
      set({ profile: res.data })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch profile' })
    } finally {
      set({ loading: false })
    }
  },

  fetchUserPosts: async (userId) => {
    set({ loading: true, error: null })
    try {
      const res = await API.get(`/api/posts/user/${userId}`)
      set({ posts: res.data })
    } catch (err) {
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
    } catch (err) {
      set({ profile: prevProfile })
    }
  },

  clearProfile: () => set({ profile: null, posts: [] }),
}))
