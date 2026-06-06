import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Smile } from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import { useToast } from '../ui/Toast'

export default function PostCard({ post, isExplore = false }) {
  const { likePost, savePost, deletePost, deleteComment, addComment } = usePostStore()
  const { user } = useAuthStore()
  const { followUser } = useProfileStore()
  const toast = useToast()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liked, setLiked] = useState(post?.isLiked || false)
  const [saved, setSaved] = useState(post?.isSaved || false)
  const [likeCount, setLikeCount] = useState(post?.likesCount ?? 0)
  const commentInputRef = useRef(null)

  const isOwner = user?._id === post?.user?._id
  const hashtags = post?.hashtags || ['#art', '#aesthetics', '#wallstreet', '#wallpaper', '#photography']

  const handleLike = async () => {
    if (!user) return
    if (liked) {
      setLiked(false)
      setLikeCount((c) => Math.max(0, c - 1))
    } else {
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
    try { await likePost(post._id) } catch {}
  }

  const handleSave = async () => {
    if (!user) return
    setSaved((s) => !s)
    try { await savePost(post._id) } catch {}
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

  const handleFollow = async () => {
    if (!user || isOwner) return
    try { await followUser(post.user._id) } catch {}
  }

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
          <Link to={`/profile/${post?.user?._id}`}>
            <img
              src={post?.user?.profileImage || 'https://i.pravatar.cc/150?u=briansky'}
              alt={post?.user?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post?.user?._id}`}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {post?.user?.username || 'Briansky'}
            </Link>
            <p className="text-[11px] text-gray-500">{post?.timeAgo || '12 minutes ago'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <button
              onClick={handleFollow}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                post?.user?.isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {post?.user?.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body text + hashtags */}
      <div className="px-4 pb-2">
        <p className="text-sm text-gray-800 leading-snug">
          {post?.caption || 'Beautiful art ✨'}{' '}
          <span className="text-blue-600">{hashtags.join(' ')}</span>
        </p>
      </div>

      {/* Image */}
      {post?.image && (
        <div className="bg-gray-50">
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-[520px] object-cover"
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
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 100)
          }}
          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{post?.commentsCount ?? 120}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-500 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">{post?.sharesCount ?? 148}</span>
        </button>
        <button
          onClick={handleSave}
          className="ml-auto text-gray-500 hover:text-blue-500 transition-colors"
          title="Save"
        >
          <Send className={`w-5 h-5 ${saved ? 'text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Comment input */}
      <form
        onSubmit={handleComment}
        className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-gray-100"
      >
        <img
          src={user?.profileImage || 'https://i.pravatar.cc/150?u=me'}
          alt="me"
          className="w-7 h-7 rounded-full object-cover"
        />
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
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  )
}
