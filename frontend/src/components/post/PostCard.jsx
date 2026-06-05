import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import ProgressiveImage from '../ui/ProgressiveImage'
import { useToast } from '../ui/Toast'

export default function PostCard({ post, isExplore = false }) {
  const { likePost, savePost, deletePost, deleteComment } = usePostStore()
  const { user } = useAuthStore()
  const { followUser } = useProfileStore()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentInputRef = useRef(null)
  const { addComment } = usePostStore()

  const isOwner = user?._id === post.user?._id
  const isLiked = post.isLiked || false
  const isSaved = post.isSaved || false

  const handleLike = async () => {
    if (!user) return
    await likePost(post._id)
  }

  const handleSave = async () => {
    if (!user) return
    await savePost(post._id)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await deletePost(post._id)
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addComment(post._id, commentText.trim())
      setCommentText('')
      toast.success('Comment added')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment(post._id, commentId)
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const handleFollow = async () => {
    if (!user || isOwner) return
    await followUser(post.user._id)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user?._id}`}>
            <img
              src={post.user?.profileImage || '/default-avatar.png'}
              alt={post.user?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.user?._id}`}
              className="font-semibold text-sm hover:underline"
            >
              {post.user?.username}
            </Link>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <button
              onClick={handleFollow}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                post.user?.isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {post.user?.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {post.image && (
        <div className="relative">
          <ProgressiveImage
            src={post.image}
            alt="Post image"
            className="w-full aspect-square"
          />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3">
          <p className="text-sm">
            <Link
              to={`/profile/${post.user?._id}`}
              className="font-semibold mr-2 hover:underline"
            >
              {post.user?.username}
            </Link>
            {post.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-sm"
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likesCount || 0}</span>
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 100)
          }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.commentsCount || post.comments?.length || 0}</span>
        </button>

        <button
          onClick={handleSave}
          className={`ml-auto ${isSaved ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'} transition-colors`}
        >
          <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="px-4 py-3 max-h-64 overflow-y-auto space-y-3">
              {post.comments?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
              ) : (
                post.comments?.map((comment) => (
                  <div key={comment._id} className="flex gap-2">
                    <Link to={`/profile/${comment.user?._id}`}>
                      <img
                        src={comment.user?.profileImage || '/default-avatar.png'}
                        alt={comment.user?.username}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${comment.user?._id}`}
                          className="font-semibold text-xs hover:underline"
                        >
                          {comment.user?.username}
                        </Link>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    {(isOwner || user?._id === comment.user?._id) && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleComment} className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 px-4 py-2">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className={`text-sm font-semibold ${
                  commentText.trim() && !isSubmitting
                    ? 'text-blue-600 hover:text-blue-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
