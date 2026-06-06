import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import API from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}D`
  return date.toLocaleDateString()
}

const notificationCopy = (n) => {
  const who = n.sender?.username || 'Someone'
  switch (n.type) {
    case 'like':
      return { text: `${who} liked your post.`, icon: Heart }
    case 'comment':
      return { text: `${who} commented on your post.`, icon: MessageCircle }
    case 'follow':
      return { text: `${who} started following you.`, icon: UserPlus }
    default:
      return { text: `${who} interacted with your post.`, icon: Heart }
  }
}

export default function RightSidebar() {
  const { user } = useAuthStore()
  const [activity, setActivity] = useState([])
  const [yesterday, setYesterday] = useState([])
  const [suggested, setSuggested] = useState([])
  const [followState, setFollowState] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const [notifRes, suggRes] = await Promise.all([
          API.get('/api/notifications').catch(() => ({ data: [] })),
          API.get('/api/users/suggested').catch(() => ({ data: [] })),
        ])
        const notifs = notifRes.data || []
        const oneDay = 24 * 60 * 60 * 1000
        const now = Date.now()
        const recent = []
        const old = []
        notifs.forEach((n) => {
          const t = new Date(n.createdAt).getTime()
          if (now - t < oneDay) recent.push(n)
          else old.push(n)
        })
        setActivity(recent.slice(0, 5))
        setYesterday(old.slice(0, 4))
        setSuggested(suggRes.data || [])
      } catch (err) {
        console.error('RightSidebar load error:', err)
      }
    }
    if (user) load()
  }, [user])

  const handleFollow = async (targetId) => {
    if (!targetId || targetId === user?._id) return
    setFollowState((s) => ({ ...s, [targetId]: !s[targetId] }))
    try {
      await API.post(`/api/users/${targetId}/follow`)
    } catch (err) {
      console.error('Follow failed:', err)
      setFollowState((s) => ({ ...s, [targetId]: !s[targetId] }))
    }
  }

  const ActivityRow = ({ notif, showFollow = false }) => {
    const { icon: Icon } = notificationCopy(notif)
    return (
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
        <img
          src={notif.sender?.profileImage || `https://i.pravatar.cc/150?u=${notif.sender?.username || 'u'}`}
          alt={notif.sender?.username}
          className="w-9 h-9 rounded-full object-cover shrink-0"
          onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${notif.sender?.username || 'U'}&background=random&color=fff`)}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-800 leading-snug">
            <span className="font-semibold text-gray-900">{notif.sender?.username || 'Someone'}</span>{' '}
            <span className="text-gray-600">
              {notif.type === 'follow' ? 'started following you.' : notif.type === 'like' ? 'liked your photo.' : 'interacted with your post.'}
            </span>
          </p>
          <p className="text-[11px] text-gray-400">{formatTimeAgo(notif.createdAt)}</p>
        </div>
        {showFollow ? (
          <button
            onClick={() => handleFollow(notif.sender?._id)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
          >
            {followState[notif.sender?._id] ? 'Followed' : 'Follow'}
          </button>
        ) : (
          <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    )
  }

  const SuggestionRow = ({ s }) => {
    const targetId = s._id
    const isFollowing = s.isFollowing || followState[targetId]
    return (
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
        <Link to={`/profile/${s.username}`}>
          <img
            src={s.profileImage || `https://i.pravatar.cc/150?u=${s.username}`}
            alt={s.username}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${s.username}&background=random&color=fff`)}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${s.username}`}
            className="text-sm font-semibold text-gray-900 hover:underline truncate block"
          >
            {s.username}
          </Link>
          <p className="text-[11px] text-gray-500 truncate">
            {s.followersCount != null ? `${s.followersCount} followers` : s.bio || 'Suggested for you'}
          </p>
        </div>
        <button
          onClick={() => handleFollow(targetId)}
          className={`text-xs font-semibold shrink-0 ${
            isFollowing ? 'text-gray-500 hover:text-gray-700' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {isFollowing ? 'Followed' : 'Follow'}
        </button>
      </div>
    )
  }

  return (
    <aside
      className="hidden xl:flex flex-col fixed right-0 top-[70px] bottom-0 w-[300px] px-3 py-4 overflow-y-auto"
      style={{ background: '#F5F5F7' }}
    >
      {/* Activity */}
      <div className="bg-white rounded-[18px] shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
          <Link to="/notifications" className="text-xs text-blue-600 hover:underline">See all</Link>
        </div>

        <div className="px-2 pb-2">
          {activity.length > 0 ? (
            activity.map((n, i) => <ActivityRow key={n._id || i} notif={n} showFollow={n.type === 'follow'} />)
          ) : (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No recent activity</p>
          )}
        </div>

        {yesterday.length > 0 && (
          <>
            <div className="px-4 pt-2 pb-1">
              <h4 className="text-xs font-semibold text-gray-700">Yesterday</h4>
            </div>
            <div className="px-2 pb-3">
              {yesterday.map((n, i) => <ActivityRow key={`y-${n._id || i}`} notif={n} />)}
            </div>
          </>
        )}
      </div>

      {/* Suggested */}
      <div className="bg-white rounded-[18px] mt-4 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Suggested For you</h3>
          <button className="text-xs text-gray-500 hover:text-gray-700">See all</button>
        </div>
        <div className="px-2 pb-3">
          {suggested.length > 0 ? (
            suggested.slice(0, 5).map((s) => <SuggestionRow key={s._id} s={s} />)
          ) : (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No suggestions yet</p>
          )}
        </div>
      </div>
    </aside>
  )
}
