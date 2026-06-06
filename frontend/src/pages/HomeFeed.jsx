import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Video, BarChart2, Smile, Globe, ChevronDown } from 'lucide-react'
import PostCard from '../components/post/PostCard'
import CreatePostModal from '../components/post/CreatePostModal'
import { PostSkeleton } from '../components/common/Skeleton'
import EmptyState from '../components/common/EmptyState'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import { useProfileStore } from '../store/profileStore'
import { useNotificationStore } from '../store/notificationStore'

function CreatePostCard({ onOpen }) {
  const { user } = useAuthStore()

  return (
    <div className="bg-white rounded-[18px] shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <img
          src={user?.profileImage || 'https://i.pravatar.cc/150?u=me'}
          alt="me"
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random&color=fff&size=80`)}
        />
        <button
          onClick={onOpen}
          className="flex-1 text-left bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
        >
          Share something...
        </button>
        <button
          onClick={onOpen}
          className="text-gray-400 hover:text-yellow-500"
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-green-500" />
            <span>Image</span>
          </button>
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Video className="w-4 h-4 text-red-500" />
            <span>Video</span>
          </button>
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Poll</span>
          </button>
        </div>
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>Public</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function FeedControls({ sort, onChange }) {
  const [open, setOpen] = useState(false)
  const opts = ['Recent', 'Top', 'Popular']

  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-base font-semibold text-gray-900">Feed</h2>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
        >
          <span>Sort by:</span>
          <span className="font-semibold text-gray-900">{sort}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-10 min-w-[120px]"
            >
              {opts.map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    onChange(o)
                    setOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                    sort === o ? 'text-blue-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function HomeFeed() {
  const { posts, loading, error, fetchFeed, hasMoreFeed, initSocketListeners, cleanupSocketListeners } = usePostStore()
  const { initSocketListeners: initProfileListeners, cleanupSocketListeners: cleanupProfileListeners } = useProfileStore()
  const { initSocketListeners: initNotifListeners, cleanupSocketListeners: cleanupNotifListeners } = useNotificationStore()
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sort, setSort] = useState('Recent')
  const observerRef = useRef(null)

  // Initialize socket listeners on mount
  useEffect(() => {
    if (user) {
      initSocketListeners()
      initProfileListeners()
      initNotifListeners()
    }
    return () => {
      cleanupSocketListeners()
      cleanupProfileListeners()
      cleanupNotifListeners()
    }
  }, [user, initSocketListeners, cleanupSocketListeners, initProfileListeners, cleanupProfileListeners, initNotifListeners, cleanupNotifListeners])

  // Infinite scroll
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreFeed) {
          fetchFeed(true)
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [loading, hasMoreFeed, fetchFeed]
  )

  return (
    <div className="w-full max-w-[650px] mx-auto px-2 py-3 space-y-3">
      <CreatePostCard onOpen={() => setShowCreateModal(true)} />
      <FeedControls sort={sort} onChange={setSort} />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-[18px] shadow-sm">
          <EmptyState
            icon={ImageIcon}
            title="No posts yet"
            description="Be the first to share something with the community!"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!hasMoreFeed && posts.length > 0 && (
        <div className="text-center text-xs text-gray-500 py-4">
          You're all caught up 🎉
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
