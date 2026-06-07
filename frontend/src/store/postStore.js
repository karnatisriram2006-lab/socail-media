import { create } from 'zustand'
import { initSocket, onSocketEvent, removeAllSocketListeners } from '../services/socket'
import API from '../services/api'

// Backend now returns enriched posts with user-specific data (isLiked, isSaved, likesCount, etc.)
// This normalizer ensures backward compatibility and handles any edge cases.
const normalizePost = (post) => {
  if (!post) return post
  
  const user = post.user || post.userId || null
  const likesArr = Array.isArray(post.likes) ? post.likes : []
  
  // Resolve media fields with sensible fallbacks for legacy + new posts.
  const mediaType = post.mediaType || 'image'
  const mediaUrl = post.mediaUrl || post.image || post.imageUrl || ''
  const thumbnail = post.thumbnail || (mediaType === 'image' ? (mediaUrl || post.image) : '')
  
  return {
    ...post,
    user,
    userId: user?._id || post.userId,
    // Unified media fields
    mediaType,
    mediaUrl,
    thumbnail,
    videoDuration: post.videoDuration ?? null,
    // Legacy `image` alias - if the post is a video, the thumbnail is the
    // fallback "image" so older code paths that read `post.image` still work.
    image: post.image || post.imageUrl || (mediaType === 'video' ? thumbnail : mediaUrl),
    // Backend now provides these directly, but fallback for safety
    likesCount: post.likesCount ?? likesArr.length,
    commentsCount: post.commentsCount ?? 0,
    comments: post.comments || [],
    isLiked: post.isLiked ?? false,
    isSaved: post.isSaved ?? false,
    sharesCount: post.sharesCount ?? 0,
    timeAgo: post.timeAgo,
  }
}

const normalizeList = (arr) => Array.isArray(arr) ? arr.map(normalizePost) : []

// Socket event handlers storage for cleanup
let socketCleanupFns = []

export const usePostStore = create((set, get) => ({
  posts: [],
  explorePosts: [],
  savedPosts: [],
  loading: false,
  feedPage: 1,
  hasMoreFeed: true,
  error: null,

  resetFeed: () => set({ posts: [], feedPage: 1, hasMoreFeed: true }),

  // Initialize socket listeners for real-time updates
  initSocketListeners: () => {
    // Clear any existing listeners
    socketCleanupFns.forEach(fn => fn())
    socketCleanupFns = []

    // Initialize socket connection
    initSocket()

    // Like update from another user
    socketCleanupFns.push(
      onSocketEvent('likeUpdate', ({ postId, likes, likesCount, isLiked }) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { 
                  ...p, 
                  likes,
                  likesCount,
                  isLiked: p._id === postId ? isLiked : p.isLiked, // Only update for current user if it's their action
                }
              : p
          ),
          explorePosts: state.explorePosts.map((p) =>
            p._id === postId
              ? { ...p, likes, likesCount }
              : p
          ),
          savedPosts: state.savedPosts.map((p) =>
            p._id === postId
              ? { ...p, likes, likesCount }
              : p
          ),
        }))
      })
    )

    // New comment added
    socketCleanupFns.push(
      onSocketEvent('newComment', ({ postId, comment, commentsCount }) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { 
                  ...p, 
                  commentsCount,
                  comments: [...(p.comments || []), comment],
                }
              : p
          ),
        }))
      })
    )

    // Comment deleted
    socketCleanupFns.push(
      onSocketEvent('commentDeleted', ({ postId, commentId, commentsCount }) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { 
                  ...p, 
                  commentsCount,
                  comments: (p.comments || []).filter((c) => c._id !== commentId),
                }
              : p
          ),
        }))
      })
    )

    // New post created
    socketCleanupFns.push(
      onSocketEvent('newPost', (post) => {
        const normalizedPost = normalizePost(post)
        set((state) => ({
          posts: [normalizedPost, ...state.posts],
        }))
      })
    )

    // Post deleted
    socketCleanupFns.push(
      onSocketEvent('postDeleted', ({ postId }) => {
        set((state) => ({
          posts: state.posts.filter((p) => p._id !== postId),
          explorePosts: state.explorePosts.filter((p) => p._id !== postId),
          savedPosts: state.savedPosts.filter((p) => p._id !== postId),
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
        hasMoreFeed: newPosts.length === 5, // Backend uses limit 10, but we check for 5 as fallback
      }))
    } catch (_err) {
      set({ error: _err.response?.data?.message || 'Failed to fetch feed' })
    } finally {
      set({ loading: false })
    }
  },

  fetchExplore: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/posts/explore')
      set({ explorePosts: normalizeList(res.data) })
    } catch {
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
    } catch {
      set({ error: 'Failed to fetch saved posts' })
    } finally {
      set({ loading: false })
    }
  },

  createPost: async (caption, mediaFile, extra = {}) => {
    set({ loading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('caption', caption)
      // Field name stays `image` for backward compat with the backend route,
      // but the file itself can be a video.
      formData.append('image', mediaFile)
      if (extra.videoDuration) {
        formData.append('videoDuration', String(extra.videoDuration))
      }
      if (extra.mediaKind) {
        formData.append('mediaKind', extra.mediaKind)
      }
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
    try {
      const res = await API.post(`/api/posts/${postId}/like`)
      
      // Update with actual server response (includes isLiked, likesCount, likes array)
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId
            ? { 
                ...p, 
                isLiked: res.data.isLiked,
                likesCount: res.data.likesCount,
                likes: res.data.likes,
              }
            : p
        ),
        explorePosts: state.explorePosts.map((p) =>
          p._id === postId
            ? { ...p, likesCount: res.data.likesCount, likes: res.data.likes }
            : p
        ),
        savedPosts: state.savedPosts.map((p) =>
          p._id === postId
            ? { ...p, likesCount: res.data.likesCount, likes: res.data.likes }
            : p
        ),
      }))
    } catch (err) {
      console.error('likePost error:', err)
      throw err
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
