import { create } from 'zustand'
import { initSocket, onSocketEvent, removeAllSocketListeners } from '../services/socket'
import API from '../services/api'

// Socket event handlers storage for cleanup
let socketCleanupFns = []

const emptyFollowList = () => ({ list: [], total: 0, page: 1, hasMore: false, loading: false })

export const useProfileStore = create((set, get) => ({
  profile: null,
  posts: [],
  suggested: [],
  suggestedLoading: false,
  followState: {},
  loading: false,
  error: null,

  // Followers / Following list state
  followersList: emptyFollowList(),
  followingList: emptyFollowList(),

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
        set((state) => {
          const next = { ...state };
          if (state.profile && state.profile._id === targetUserId) {
            next.profile = {
              ...state.profile,
              isFollowing: state.profile._id === currentUserId ? isFollowing : state.profile.isFollowing,
              followersCount: followersCount !== undefined ? followersCount : state.profile.followersCount,
              followingCount: followingCount !== undefined ? followingCount : state.profile.followingCount,
            };
          }
          return next;
        });
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

  fetchSuggested: async () => {
    set({ suggestedLoading: true })
    try {
      const res = await API.get('/api/users/suggested')
      set({ suggested: res.data || [] })
    } catch (err) {
      console.error('fetchSuggested error:', err)
      set({ suggested: [] })
    } finally {
      set({ suggestedLoading: false })
    }
  },

  // Paginated followers/following
  fetchFollowers: async (userId, { page = 1, append = false } = {}) => {
    if (!userId) return
    set((state) => ({
      followersList: { ...state.followersList, loading: true },
    }))
    try {
      const res = await API.get(`/api/users/${userId}/followers?page=${page}&limit=20`)
      const data = res.data || {}
      set((state) => ({
        followersList: {
          list: append
            ? [...state.followersList.list, ...(data.users || [])]
            : (data.users || []),
          total: data.total ?? state.followersList.total,
          page: data.page ?? page,
          hasMore: !!data.hasMore,
          loading: false,
        },
      }))
    } catch (err) {
      console.error('fetchFollowers error:', err)
      set((state) => ({
        followersList: { ...state.followersList, loading: false },
      }))
    }
  },

  fetchFollowing: async (userId, { page = 1, append = false } = {}) => {
    if (!userId) return
    set((state) => ({
      followingList: { ...state.followingList, loading: true },
    }))
    try {
      const res = await API.get(`/api/users/${userId}/following?page=${page}&limit=20`)
      const data = res.data || {}
      set((state) => ({
        followingList: {
          list: append
            ? [...state.followingList.list, ...(data.users || [])]
            : (data.users || []),
          total: data.total ?? state.followingList.total,
          page: data.page ?? page,
          hasMore: !!data.hasMore,
          loading: false,
        },
      }))
    } catch (err) {
      console.error('fetchFollowing error:', err)
      set((state) => ({
        followingList: { ...state.followingList, loading: false },
      }))
    }
  },

  resetFollowList: (kind) => {
    if (kind === 'followers') set({ followersList: emptyFollowList() })
    else if (kind === 'following') set({ followingList: emptyFollowList() })
  },

  handleFollow: async (targetUserId) => {
    if (!targetUserId) return
    set((state) => ({
      followState: { ...state.followState, [targetUserId]: !state.followState[targetUserId] },
    }))
    try {
      await API.post(`/api/users/${targetUserId}/follow`)
    } catch (err) {
      // Revert on error
      set((state) => ({
        followState: { ...state.followState, [targetUserId]: !state.followState[targetUserId] },
      }))
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
            ? Math.max(0, (state.profile.followersCount || 0) - 1)
            : (state.profile.followersCount || 0) + 1,
        },
      }
    })
    try {
      const res = await API.post(`/api/users/${targetUserId}/follow`)
      const { isFollowing, followersCount, followingCount } = res.data
      set((state) => {
        const next = { ...state }
        if (state.profile) {
          next.profile = {
            ...state.profile,
            isFollowing,
            followersCount,
            followingCount: followingCount !== undefined ? followingCount : state.profile.followingCount,
          }
        }
        return next;
      })
    } catch {
      set({ profile: prevProfile })
    }
  },

  blockUser: async (targetUserId) => {
    try {
      const res = await API.post(`/api/users/block/${targetUserId}`)
      const { isBlocked } = res.data
      set((state) => {
        if (!state.profile || state.profile._id !== targetUserId) return state
        return {
          profile: { ...state.profile, isBlocked },
        }
      })
      return isBlocked
    } catch (err) {
      console.error('blockUser error:', err)
      throw err
    }
  },

  clearProfile: () => set({ profile: null, posts: [], followersList: emptyFollowList(), followingList: emptyFollowList() }),
}))
