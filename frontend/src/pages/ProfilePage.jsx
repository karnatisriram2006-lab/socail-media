import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Grid3X3, X, Play, Loader2, UserPlus, UserCheck, UserMinus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import PostCard from '../components/post/PostCard'
import ProfileTabs from '../components/profile/ProfileTabs'
import { useToast } from '../components/ui/Toast'

function ProfileGridPost({ post, onClick }) {
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

function FollowListItem({ user, currentUser, onFollow, busy }) {
  if (!user) return null
  const isMe = currentUser?._id === user._id
  const isFollowing = !!user.isFollowing

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <Link to={`/profile/${user.username}`} className="shrink-0">
        <img
          src={
            user.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=random&color=fff&size=100`
          }
          alt={user.username}
          className="w-11 h-11 rounded-full object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${user.username || 'U'}&background=random&color=fff&size=100`
          }}
        />
      </Link>
      <Link
        to={`/profile/${user.username}`}
        className="flex-1 min-w-0 hover:opacity-80"
      >
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user.name || user.username}
          {user.isVerified && (
            <span className="ml-1 inline-block w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </p>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
      </Link>
      {!isMe && currentUser && (
        <button
          onClick={() => onFollow(user._id, isFollowing)}
          disabled={busy}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
            isFollowing
              ? 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-600 group'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {busy ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowing ? (
            <>
              <span className="group-hover:hidden inline-flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" />
                Following
              </span>
              <span className="hidden group-hover:inline-flex items-center gap-1.5">
                <UserMinus className="w-3 h-3" />
                Unfollow
              </span>
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3" />
              Follow
            </>
          )}
        </button>
      )}
    </div>
  )
}

function FollowListModal({ isOpen, onClose, title, listState, currentUser, onFollow, onLoadMore }) {
  const listRef = (el) => {
    if (!el) return
    el.onscroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        if (listState.hasMore && !listState.loading) onLoadMore()
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <div className="w-8" />
              <h2 className="font-semibold text-gray-900">
                {title} {listState.total > 0 && <span className="text-gray-500 font-normal">· {listState.total}</span>}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={listRef} className="overflow-y-auto flex-1">
              {listState.list.length === 0 && listState.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <p className="text-sm">Loading…</p>
                </div>
              ) : listState.list.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm">
                    {title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {listState.list.map((u) => (
                    <FollowListItem
                      key={u._id}
                      user={u}
                      currentUser={currentUser}
                      onFollow={onFollow}
                      busy={false}
                    />
                  ))}
                </div>
              )}
              {listState.loading && listState.list.length > 0 && (
                <div className="py-3 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 inline-block" />
                </div>
              )}
              {!listState.hasMore && listState.list.length > 0 && (
                <div className="py-3 text-center text-xs text-gray-400">
                  You've reached the end
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuthStore()
  const {
    profile,
    posts,
    loading,
    error,
    followersList,
    followingList,
    fetchProfile,
    fetchUserPosts,
    followUser,
    fetchFollowers,
    fetchFollowing,
    resetFollowList,
  } = useProfileStore()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('posts')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)

  const isOwner = currentUser?._id === (profile?._id) || currentUser?.username === username
  const targetId = username || currentUser?._id

  useEffect(() => {
    if (targetId) {
      fetchProfile(targetId)
      fetchUserPosts(targetId)
    }
  }, [targetId, fetchProfile, fetchUserPosts])

  useEffect(() => {
    resetFollowList('followers')
    resetFollowList('following')
  }, [profile?._id, resetFollowList])

  const openFollowersModal = () => {
    if (!profile?._id) return
    setShowFollowersModal(true)
    fetchFollowers(profile._id, { page: 1, append: false })
  }
  const openFollowingModal = () => {
    if (!profile?._id) return
    setShowFollowingModal(true)
    fetchFollowing(profile._id, { page: 1, append: false })
  }
  const loadMoreFollowers = () => {
    if (!profile?._id) return
    fetchFollowers(profile._id, { page: followersList.page + 1, append: true })
  }
  const loadMoreFollowing = () => {
    if (!profile?._id) return
    fetchFollowing(profile._id, { page: followingList.page + 1, append: true })
  }

  const handleInlineFollow = async (targetId, currentlyFollowing) => {
    if (!targetId) return
    try {
      await followUser(targetId)
      toast.success(currentlyFollowing ? 'Unfollowed' : 'Following')
      if (showFollowersModal) {
        resetFollowList('followers')
        fetchFollowers(profile._id, { page: 1, append: false })
      }
      if (showFollowingModal) {
        resetFollowList('following')
        fetchFollowing(profile._id, { page: 1, append: false })
      }
    } catch (e) {
      toast.error('Action failed. Please try again.')
    }
  }

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
        <p className="text-gray-500">{error || 'User not found'}</p>
      </div>
    )
  }

  const followersCount = profile.followersCount ?? 0
  const followingCount = profile.followingCount ?? 0
  const postsCount = profile.postsCount ?? posts.length ?? 0

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
              <img
                src={profile.profileImage || 'https://ui-avatars.com/api/?name=' + (profile.username || 'U') + '&background=random&color=fff&size=200'}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover border-3 border-white"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${profile.username || 'U'}&background=random&color=fff&size=200`
                }}
              />
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a a1 1 0 00-1.414 1.414l2 2 a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <h1 className="text-2xl font-light text-gray-900">{profile.username}</h1>
              {isOwner ? (
                <Link
                  to="/edit-profile"
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Profile
                </Link>
              ) : currentUser ? (
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
              {!isOwner && currentUser && (
                <Link
                  to={`/messages/${profile._id}`}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Message
                </Link>
              )}
            </div>

            <div className="flex justify-center sm:justify-start gap-8 mb-4">
              <div className="text-center">
                <span className="font-semibold text-gray-900">{postsCount}</span>
                <span className="text-gray-500 ml-1">posts</span>
              </div>
              <button
                onClick={openFollowersModal}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                title="View followers"
              >
                <span className="font-semibold text-gray-900">{followersCount}</span>
                <span className="text-gray-500 ml-1">followers</span>
              </button>
              <button
                onClick={openFollowingModal}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                title="View following"
              >
                <span className="font-semibold text-gray-900">{followingCount}</span>
                <span className="text-gray-500 ml-1">following</span>
              </button>
            </div>

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

        <div className="sm:hidden mt-4 text-center">
          {profile.name && (
            <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
          )}
          {profile.bio && (
            <p className="text-gray-700 text-sm whitespace-pre-wrap mt-1">{profile.bio}</p>
          )}
        </div>
      </div>

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

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

      <FollowListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        listState={followersList}
        currentUser={currentUser}
        onFollow={handleInlineFollow}
        onLoadMore={loadMoreFollowers}
      />

      <FollowListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        listState={followingList}
        currentUser={currentUser}
        onFollow={handleInlineFollow}
        onLoadMore={loadMoreFollowing}
      />
    </div>
  )
}
