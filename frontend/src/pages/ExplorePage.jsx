import { useEffect } from 'react'
import { usePostStore } from '../store/postStore'
import PostCard from '../components/post/PostCard'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Grid card for explore - smaller, just shows thumbnail with overlay counts.
// Videos show a small play indicator.
function ExploreGridCard({ post, onClick }) {
  const [hovered, setHovered] = useState(false)
  const isVideo = post?.mediaType === 'video'
  const displaySrc = isVideo
    ? (post?.thumbnail || post?.image || post?.imageUrl)
    : (post?.image || post?.imageUrl || post?.thumbnail)

  return (
    <motion.div
      className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      <img
        src={displaySrc}
        alt={post.caption || 'Post'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {isVideo && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div className="bg-black/60 rounded-full p-1.5 flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        </div>
      )}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2 text-white font-bold">
              <Heart className="w-6 h-6 fill-white" />
              <span>{post.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-white font-bold">
              <MessageCircle className="w-6 h-6 fill-white" />
              <span>{post.commentsCount || 0}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ExplorePage() {
  const { explorePosts, loading, error, fetchExplore } = usePostStore()
  const [selectedPost, setSelectedPost] = useState(null)

  useEffect(() => {
    fetchExplore()
  }, [fetchExplore])

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Explore</h1>

      {error && (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {!error && explorePosts.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No posts to explore</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {explorePosts.map((post) => (
            <ExploreGridCard
              key={post._id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Modal preview using full PostCard (so videos autoplay) */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ×
              </button>
            </div>
            <PostCard post={selectedPost} />
          </div>
        </div>
      )}
    </div>
  )
}
