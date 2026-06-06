import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Grid3X3, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import PostCard from '../components/post/PostCard'
import ProfileTabs from '../components/profile/ProfileTabs'

// Profile Grid Post Component - Instagram style
function ProfileGridPost({ post, onClick }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <motion.div
      className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      <img
        src={post.image}
        alt={post.caption || 'Post'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
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

// Followers/Following Modal Component
function UsersListModal({ isOpen, onClose, title, users, currentUser, onFollow }) {
  if (!isOpen || !users) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="w-8" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">No users to show</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => {
                const isCurrentUser = currentUser?._id === u._id
                const isFollowingUser = currentUser?.following?.some(
                  (fid) => fid === u._id || fid?._id === u._id
                )
                
                return (
                  <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Link to={`/profile/${u.username}`} onClick={onClose}>
                      <img
                        src={u.profileImage || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=100`}
                        alt={u.username}
                        className="w-11 h-11 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=100`
                        }}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${u.username}`} 
                        onClick={onClose}
                        className="font-semibold text-sm text-gray-900 hover:underline block truncate"
                      >
                        {u.username}
                      </Link>
                      {u.name && (
                        <p className="text-xs text-gray-500 truncate">{u.name}</p>
                      )}
                    </div>
                    {!isCurrentUser && currentUser && (
                      <button
                        onClick={() => onFollow(u._id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isFollowingUser
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isFollowingUser ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuthStore()
  const { profile, posts, loading, fetchProfile, fetchUserPosts, followUser } = useProfileStore()
  const [activeTab, setActiveTab] = useState('posts')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)

  const isOwner = user?._id === (profile?._id || username) || user?.username === username
  const targetId = username || user?._id

  useEffect(() => {
    if (targetId) {
      fetchProfile(targetId)
      fetchUserPosts(targetId)
    }
  }, [targetId, fetchProfile, fetchUserPosts])

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Profile Image with Gradient Ring */}
          <div className="relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
              <img
                src={profile.profileImage || 'https://ui-avatars.com/api/?name=' + profile.username + '&background=random&color=fff&size=200'}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover border-3 border-white"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${profile.username}&background=random&color=fff&size=200`
                }}
              />
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            {/* Username Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <h1 className="text-2xl font-light text-gray-900">{profile.username}</h1>
              {isOwner ? (
                <Link
                  to="/edit-profile"
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Profile
                </Link>
              ) : user ? (
                <motion.button
                  onClick={() => followUser(profile._id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    profile.isFollowing
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </motion.button>
              ) : null}
              {!isOwner && user && (
                <Link
                  to={`/messages/${profile._id}`}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Message
                </Link>
              )}
            </div>

            {/* Stats Row - Instagram Style */}
            <div className="flex justify-center sm:justify-start gap-8 mb-4">
              <div className="text-center">
                <span className="font-semibold text-gray-900">{posts.length || 0}</span>
                <span className="text-gray-500 ml-1">posts</span>
              </div>
              <button 
                onClick={() => setShowFollowersModal(true)}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="font-semibold text-gray-900">{profile.followersCount || profile.followers?.length || 0}</span>
                <span className="text-gray-500 ml-1">followers</span>
              </button>
              <button 
                onClick={() => setShowFollowingModal(true)}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="font-semibold text-gray-900">{profile.followingCount || profile.following?.length || 0}</span>
                <span className="text-gray-500 ml-1">following</span>
              </button>
            </div>

            {/* Bio */}
            <div className="hidden sm:block">
              {profile.name && (
                <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
              )}
              {profile.bio && (
                <p className="text-gray-700 text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bio */}
        <div className="sm:hidden mt-4 text-center">
          {profile.name && (
            <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
          )}
          {profile.bio && (
            <p className="text-gray-700 text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-xl font-light text-gray-500">No Posts Yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => (
            <ProfileGridPost
              key={post._id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      )}

      {/* Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <PostCard post={selectedPost} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Followers Modal */}
      <UsersListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        users={profile.followers || []}
        currentUser={user}
        onFollow={followUser}
      />

      {/* Following Modal */}
      <UsersListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        users={profile.following || []}
        currentUser={user}
        onFollow={followUser}
      />
    </div>
  )
}
