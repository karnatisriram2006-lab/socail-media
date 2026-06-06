import { create } from 'zustand'
import { getSocket } from '../services/socket'
import API from '../services/api'

// Backend returns populated user as `userId` (matches the Mongoose field name),
// but the UI uses `user`. This normalizer maps the API shape onto the UI shape.
const normalizePost = (post) => {
  if (!post) return post
  const user = post.user || post.userId || null
  const likesArr = Array.isArray(post.likes) ? post.likes : []
  return {
    ...post,
    user,
    userId: user?._id || post.userId,
    likesCount: post.likesCount ?? likesArr.length,
    commentsCount: post.commentsCount ?? 0,
    comments: post.comments || [],
    isLiked: post.isLiked ?? false,
    isSaved: post.isSaved ?? false,
    sharesCount: post.sharesCount ?? 0,
    image: post.image || post.imageUrl,
    timeAgo: post.timeAgo,
  }
}

const normalizeList = (arr) => Array.isArray(arr) ? arr.map(normalizePost) : []

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
      const newPosts = normalizeList(res.data)
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
      set({ explorePosts: normalizeList(res.data) })
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
      set({ savedPosts: normalizeList(res.data) })
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
      const newPost = normalizePost(res.data.post)
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
          p._id === postId ? { ...p, isSaved: res.data.saved } : p
        ),
      }))
    } catch (err) {
      set({ error: 'Failed to save post' })
    }
  },

  // Fetch comments for a post from the backend on demand
  fetchComments: async (postId) => {
    try {
      const res = await API.get(`/api/posts/${postId}/comments`)
      const list = (res.data || []).map((c) => ({
        ...c,
        user: c.user || c.userId || null,
        text: c.text || c.comment,
        createdAt: c.createdAt,
      }))
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId ? { ...p, comments: list } : p
        ),
      }))
      return list
    } catch (err) {
      console.error('fetchComments error:', err)
      return []
    }
  },

  addComment: async (postId, text) => {
    try {
      const res = await API.post(`/api/posts/${postId}/comment`, { comment: text })
      const raw = res.data.comment
      const newComment = {
        ...raw,
        user: raw.user || raw.userId || null,
        text: raw.text || raw.comment,
      }
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId
            ? {
                ...p,
                commentsCount: res.data.commentsCount,
                comments: [...(p.comments || []), newComment],
              }
            : p
        ),
      }))
      return newComment
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
            ? { ...p, comments: (p.comments || []).filter((c) => c._id !== commentId) }
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
