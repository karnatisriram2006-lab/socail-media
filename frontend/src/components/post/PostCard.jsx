import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Smile } from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import { useToast } from '../ui/Toast'

function timeAgo(dateStr) {
  if (!dateStr) return ''
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

function extractHashtags(text) {
  if (!text) return []
  const matches = text.match(/#[\w]+/g)
  return matches || []
}

function Avatar({ name, src, size = 40 }) {
  const [errored, setErrored] = useState(false)
  const initial = (name || 'U').trim().charAt(0).toUpperCase()
  const colors = ['from-blue-500 to-blue-700', 'from-pink-500 to-rose-500', 'from-purple-500 to-indigo-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600']
  const grad = colors[(initial.charCodeAt(0) || 0) % colors.length]
  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-semibold border-2 border-white shrink-0`}
        style={{ width: size, height: size, fontSize: size / 2.6 }}
      >
        {initial}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="rounded-full object-cover shrink-0 bg-gray-100"
      style={{ width: size, height: size }}
    />
  )
}

export default function PostCard({ post }) {
  const { likePost, savePost, deletePost, addComment, deleteComment, fetchComments } = usePostStore()
  const { user } = useAuthStore()
  const { followUser } = useProfileStore()
  const toast = useToast()

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const commentInputRef = useRef(null)

  const isOwner = user?._id === post?.user?._id
  const liked = !!post?.isLiked
  const saved = !!post?.isSaved
  const likeCount = post?.likesCount ?? 0
  const commentCount = post?.commentsCount ?? 0
  const comments = post?.comments || []

  const handleLike = async () => {
    if (!user) return
    try { await likePost(post._id) } catch (e) { console.error(e) }
  }

  const handleSave = async () => {
    if (!user) return
    try { await savePost(post._id) } catch (e) { console.error(e) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(post._id)
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const toggleComments = async () => {
    const willShow = !showComments
    setShowComments(willShow)
    if (willShow) {
      setTimeout(() => commentInputRef.current?.focus(), 100)
      // Fetch comments if backend didn't include them in the feed payload
      if ((!post.comments || post.comments.length === 0) && commentCount > 0 && !loadingComments) {
        setLoadingComments(true)
        await fetchComments(post._id)
        setLoadingComments(false)
      }
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

  const handleDeleteComment = async (cid) => {
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment(post._id, cid)
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const handleFollow = async () => {
    if (!user || isOwner || !post?.user?._id) return
    try { await followUser(post.user._id) } catch (e) { console.error(e) }
  }

  if (!post) return null

  const username = post.user?.username || 'Unknown'
  const userId = post.user?._id || post.userId
  const userImage = post.user?.profileImage
  const postImage = post.image || post.imageUrl
  const timeStr = post.timeAgo || timeAgo(post.createdAt)
  const captionText = post.caption || ''
  const tags = post.hashtags && post.hashtags.length > 0 ? post.hashtags : extractHashtags(captionText)
  const cleanCaption = tags.length > 0 ? captionText.replace(/#[\w]+/g, '').trim() : captionText

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[18px] shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${userId}`}>
            <Avatar name={username} src={userImage} size={40} />
          </Link>
          <div>
            <Link
              to={`/profile/${userId}`}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {username}
            </Link>
            <p className="text-[11px] text-gray-500">{timeStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <button
              onClick={handleFollow}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                post.user?.isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {post.user?.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {isOwner ? (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Delete post"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          ) : (
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Caption + hashtags */}
      {(cleanCaption || tags.length > 0) && (
        <div className="px-4 pb-2">
          <p className="text-sm text-gray-800 leading-snug">
            {cleanCaption && (
              <>
                <Link
                  to={`/profile/${userId}`}
                  className="font-semibold text-gray-900 mr-2 hover:underline"
                >
                  {username}
                </Link>
                {cleanCaption}{' '}
              </>
            )}
            {tags.length > 0 && (
              <span className="text-blue-600">{tags.join(' ')}</span>
            )}
          </p>
        </div>
      )}

      {/* Image */}
      {postImage && (
        <div className="bg-gray-50">
          <img
            src={postImage}
            alt="Post"
            className="w-full max-h-[520px] object-cover"
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-red-500 transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
          />
          <span className="font-medium">{likeCount.toLocaleString()}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{commentCount}</span>
        </button>

        <button className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-500 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">{post.sharesCount || 0}</span>
        </button>

        <button
          onClick={handleSave}
          className={`ml-auto transition-colors ${saved ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          title="Save"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-warm-100 overflow-hidden"
          >
            <div className="px-4 py-3 max-h-72 overflow-y-auto space-y-3">
              {loadingComments ? (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
              ) : (
                comments.map((c) => {
                  const cUsername = c.user?.username || 'Unknown'
                  const cUserId = c.user?._id || c.userId
                  const cUserImage = c.user?.profileImage
                  const cText = c.text || c.comment
                  return (
                    <div key={c._id} className="flex gap-2">
                      <Link to={`/profile/${cUserId}`}>
                        <Avatar name={cUsername} src={cUserImage} size={32} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${cUserId}`}
                            className="font-semibold text-xs text-gray-900 hover:underline"
                          >
                            {cUsername}
                          </Link>
                          <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{cText}</p>
                      </div>
                      {(isOwner || user?._id === cUserId) && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-gray-400 hover:text-red-500 shrink-0 text-xs"
                          title="Delete"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment input */}
      <form
        onSubmit={handleComment}
        className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-warm-100"
      >
        <Avatar name={user?.username} src={user?.profileImage} size={28} />
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1.5">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment"
            className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          <button type="button" className="text-gray-400 hover:text-yellow-500 ml-2">
            <Smile className="w-4 h-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={!commentText.trim() || isSubmitting}
          className="text-blue-600 hover:text-blue-700 disabled:text-gray-300"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </motion.div>
  )
}
