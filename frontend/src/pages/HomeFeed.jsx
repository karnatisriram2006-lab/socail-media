import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Video, BarChart2, Smile, Globe, ChevronDown, Camera, X } from 'lucide-react'
import PostCard from '../components/post/PostCard'
import CreatePostModal from '../components/post/CreatePostModal'
import { useAuthStore } from '../store/authStore'

const samplePosts = [
  {
    _id: 'sample-1',
    user: {
      _id: 'briansky',
      username: 'Briansky',
      profileImage: 'https://i.pravatar.cc/150?u=briansky',
    },
    caption: 'Beautiful art',
    hashtags: ['#art', '#aesthetics', '#wallstreet', '#wallpaper', '#photography'],
    image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=900&q=80',
    likesCount: 320,
    commentsCount: 120,
    sharesCount: 148,
    timeAgo: '12 minutes ago',
    isLiked: false,
    isSaved: false,
  },
  {
    _id: 'sample-2',
    user: {
      _id: 'shivadps',
      username: 'Shivadps',
      profileImage: 'https://i.pravatar.cc/150?u=shivadps',
    },
    caption: 'Behind the scenes of my latest shoot',
    hashtags: ['#bts', '#photography', '#portrait'],
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&q=80',
    likesCount: 540,
    commentsCount: 87,
    sharesCount: 32,
    timeAgo: '2 hours ago',
    isLiked: false,
    isSaved: false,
  },
  {
    _id: 'sample-3',
    user: {
      _id: 'pixie',
      username: 'Pixie_studio',
      profileImage: 'https://i.pravatar.cc/150?u=pixie',
    },
    caption: 'New collection dropping soon!',
    hashtags: ['#design', '#creative', '#studio'],
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80',
    likesCount: 1024,
    commentsCount: 215,
    sharesCount: 89,
    timeAgo: '5 hours ago',
    isLiked: false,
    isSaved: false,
  },
]

function CreatePostCard() {
  const { user } = useAuthStore()
  const [text, setText] = useState('')

  return (
    <div className="bg-white rounded-[18px] shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <img
          src={user?.profileImage || 'https://i.pravatar.cc/150?u=me'}
          alt="me"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something..."
            className="w-full bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500">
            <Smile className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <ImageIcon className="w-4 h-4 text-green-500" />
            <span>Image</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Video className="w-4 h-4 text-red-500" />
            <span>Video</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Poll</span>
          </button>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Globe className="w-4 h-4" />
          <span>Public</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function FeedControls() {
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState('Recent')
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
                    setSort(o)
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
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="w-full max-w-[650px] mx-auto px-2 py-3 space-y-3">
      <CreatePostCard />
      <FeedControls />
      {samplePosts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
