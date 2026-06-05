import { create } from 'zustand'
import { getSocket } from '../services/socket'
import API from '../services/api'

export const usePostStore = create((set, get) => ({
  posts: [],
  explorePosts: [],
  savedPosts: [],
  loading: false,
  feedPage: 1,
  hasMoreFeed: true,
  error: null,

  resetFeed: () => set({ posts: [], feedPage: 1, hasMoreFeed: true }),

  fetchFeed: async (isLoadMore = false) => {
    if (get().loading) return
    set({ loading: true, error: null })
    const currentPage = isLoadMore ? get().feedPage + 1 : 1
    try {
      const res = await API.get(`/api/posts/feed?page=${currentPage}`)
      const newPosts = res.data
      set((state) => ({
        posts: isLoadMore ? [...state.posts, ...newPosts] : newPosts,
        feedPage: currentPage,
        hasMoreFeed: newPosts.length === 5,
      }))
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch feed' })
    } finally {
      set({ loading: false })
    }
  },

  fetchExplore: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/posts/explore')
      set({ explorePosts: res.data })
    } catch (err) {
      set({ error: 'Failed to fetch explore posts' })
    } finally {
      set({ loading: false })
    }
  },

  fetchSaved: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/posts/saved')
      set({ savedPosts: res.data })
    } catch (err) {
      set({ error: 'Failed to fetch saved posts' })
    } finally {
      set({ loading: false })
    }
  },

  createPost: async (caption, imageFile) => {
    set({ loading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('caption', caption)
      formData.append('image', imageFile)
      const res = await API.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const newPost = res.data.post
      set((state) => ({
        posts: [newPost, ...state.posts],
      }))
      return newPost
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create post' })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  deletePost: async (postId) => {
    try {
      await API.delete(`/api/posts/${postId}`)
      set((state) => ({
        posts: state.posts.filter((p) => p._id !== postId),
      }))
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete post' })
      throw err
    }
  },

  likePost: async (postId) => {
    const prevPosts = get().posts
    set((state) => ({
      posts: state.posts.map((p) =>
        p._id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      ),
    }))
    try {
      await API.post(`/api/posts/${postId}/like`)
    } catch (err) {
      set({ posts: prevPosts })
    }
  },

  savePost: async (postId) => {
    try {
      const res = await API.post(`/api/posts/${postId}/save`)
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId ? { ...p, isSaved: res.data.isSaved } : p
        ),
      }))
    } catch (err) {
      set({ error: 'Failed to save post' })
    }
  },

  addComment: async (postId, text) => {
    try {
      const res = await API.post(`/api/posts/${postId}/comment`, { text })
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), res.data.comment] }
            : p
        ),
      }))
      return res.data.comment
    } catch (err) {
      set({ error: 'Failed to add comment' })
      throw err
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      await API.delete(`/api/posts/${postId}/comments/${commentId}`)
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) }
            : p
        ),
      }))
    } catch (err) {
      set({ error: 'Failed to delete comment' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
