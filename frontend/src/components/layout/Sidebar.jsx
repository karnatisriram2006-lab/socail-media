import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'

const shortcuts = [
  { name: 'Art and drawing', color: 'from-pink-400 to-rose-500', emoji: '🎨' },
  { name: 'Dribbble Pro', color: 'from-pink-500 to-fuchsia-500', emoji: '🏀' },
  { name: 'Behance Creative', color: 'from-blue-500 to-blue-700', emoji: 'Be' },
  { name: 'One Piece Fan', color: 'from-orange-400 to-red-500', emoji: '🏴' },
]

function Avatar({ name, src, size = 72 }) {
  const [errored, setErrored] = useState(false)
  const initial = (name || 'U').trim().charAt(0).toUpperCase()
  const colors = [
    'from-blue-500 to-blue-700',
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
  ]
  const grad = colors[(initial.charCodeAt(0) || 0) % colors.length]

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&size=${size * 2}`

  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold border-4 border-white shadow-sm shrink-0`}
        style={{ width: size, height: size, fontSize: size / 2.4 }}
      >
        {initial}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'avatar'}
      onError={(e) => {
        if (e.currentTarget.src !== fallbackUrl) {
          e.currentTarget.src = fallbackUrl
          setErrored(true)
        }
      }}
      className="rounded-full object-cover border-4 border-white shadow-sm shrink-0 bg-warm-100"
      style={{ width: size, height: size }}
    />
  )
}

export default function Sidebar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Real user data with sensible defaults
  const name = user?.name || user?.username || 'User'
  const handle = user?.username || 'me'
  const posts = user?.postsCount ?? user?.posts?.length ?? 0
  const followers = user?.followersCount ?? user?.followers?.length ?? 0
  const following = user?.followingCount ?? user?.following?.length ?? 0
  const avatar = user?.profileImage
  const cover = user?.coverImage || 'https://images.unsplash.com/photo-1503262028195-93c528f03218?w=800&q=80'

  const coverHeight = 70
  const avatarSize = 72
  const avatarTop = coverHeight - avatarSize / 2

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-[70px] bottom-0 w-[280px] px-3 py-4 overflow-y-auto"
      style={{ background: '#F5F5F7' }}
    >
      <div className="relative bg-white rounded-[20px] shadow-sm">
        {/* Cover */}
        <div className="overflow-hidden rounded-t-[20px]">
          <div className="relative w-full" style={{ height: coverHeight }}>
            <img
              src={cover}
              alt="cover"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>

        {/* Avatar overlapping cover */}
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: avatarTop }}
        >
          <div className="pointer-events-auto">
            <Avatar name={name} src={avatar} size={avatarSize} />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-10">
          <div className="mt-2 text-center">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{name}</h3>
            <p className="text-xs text-gray-500 truncate">@{handle}</p>
          </div>

          <div className="mt-3 flex items-center justify-between text-center">
            <div>
              <div className="text-base font-bold text-gray-900">
                {posts >= 1000 ? `${(posts / 1000).toFixed(1)}k` : posts}
              </div>
              <div className="text-[11px] text-gray-500">Post</div>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                {followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}
              </div>
              <div className="text-[11px] text-gray-500">Followers</div>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                {following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}
              </div>
              <div className="text-[11px] text-gray-500">Following</div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/profile/${handle}`)}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            My Profile
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[18px] mt-4 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h4 className="text-sm font-semibold text-gray-900">Your shortcuts</h4>
          <button className="text-xs text-gray-500 hover:text-gray-700">See all</button>
        </div>
        <div className="px-2 pb-2">
          {shortcuts.map((s) => (
            <button
              key={s.name}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {s.emoji}
              </div>
              <span className="text-sm text-gray-800">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
