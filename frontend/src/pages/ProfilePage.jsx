import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import PostCard from '../components/post/PostCard'
import ProfileTabs from '../components/profile/ProfileTabs'

export default function ProfilePage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { profile, posts, loading, fetchProfile, fetchUserPosts, followUser } = useProfileStore()
  const [activeTab, setActiveTab] = useState('posts')

  const isOwner = user?._id === (profile?._id || id)
  const targetId = id || user?._id

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
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          <img
            src={profile.profileImage || '/default-avatar.png'}
            alt={profile.username}
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {isOwner ? (
                <Link
                  to="/edit-profile"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit Profile
                </Link>
              ) : user ? (
                <motion.button
                  onClick={() => followUser(profile._id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    profile.isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </motion.button>
              ) : null}
            </div>
            <p className="text-gray-500 text-sm mb-3">@{profile.username}</p>
            {profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}
            <div className="flex gap-6 text-sm">
              <span><strong>{profile.postsCount || 0}</strong> posts</span>
              <span><strong>{profile.followersCount || 0}</strong> followers</span>
              <span><strong>{profile.followingCount || 0}</strong> following</span>
            </div>
          </div>
        </div>
      </div>

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
