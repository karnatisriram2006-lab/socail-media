import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, Send } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'

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

function notifSender(n) {
  return n.senderId || n.sender || {}
}

function notifIcon(type) {
  if (type === 'like') return Heart
  if (type === 'comment') return MessageCircle
  if (type === 'follow') return UserPlus
  if (type === 'message') return Send
  return Bell
}

function notifMessage(n) {
  const sender = notifSender(n)
  const who = sender?.username || 'Someone'
  if (n.type === 'like') return `${who} liked your post.`
  if (n.type === 'comment') return `${who} commented on your post.`
  if (n.type === 'follow') return `${who} started following you.`
  if (n.type === 'message') return `${who} sent you a message.`
  if (n.type === 'post_share' || n.type === 'share') return `${who} shared your post.`
  if (n.type === 'profile_share') return `${who} shared a profile with you.`
  return `${who} interacted with your post.`
}

function notifIconColor(type) {
  if (type === 'like') return 'text-red-500'
  if (type === 'comment') return 'text-blue-500'
  if (type === 'follow') return 'text-purple-500'
  if (type === 'message') return 'text-cyan-500'
  return 'text-gray-500'
}

export default function RightSidebar() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useNotificationStore()
  const { suggested, suggestedLoading, fetchSuggested, followState, handleFollow } = useProfileStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchSuggested()
    }
  }, [user, fetchNotifications, fetchSuggested])

  const recentNotifications = notifications.slice(0, 5)

  return (
    <aside
      className="hidden xl:flex flex-col fixed right-0 top-[70px] bottom-0 w-[300px] px-3 py-4 overflow-y-auto"
      style={{ background: '#F5F5F7' }}
    >
      {/* Activity */}
      <div className="bg-white rounded-[18px] shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Mark read
              </button>
            )}
            <Link to="/notifications" className="text-xs text-gray-500 hover:text-gray-700">
              See all
            </Link>
          </div>
        </div>

        <div className="px-2 pb-2">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((n, i) => {
              const sender = notifSender(n)
              const Icon = notifIcon(n.type)
              return (
                <div
                  key={n._id || i}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                    !n.isRead ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => navigate('/notifications')}
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        sender?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'U')}&background=e4e6eb&color=1a1a1a&size=36`
                      }
                      alt={sender?.username}
                      className="w-9 h-9 rounded-full object-cover bg-gray-100"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'U')}&background=e4e6eb&color=1a1a1a&size=36`
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Icon className={`w-2.5 h-2.5 ${notifIconColor(n.type)}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">
                      {notifMessage(n)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No recent activity</p>
          )}
        </div>
      </div>

      {/* Suggested */}
      <div className="bg-white rounded-[18px] mt-4 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Suggested For you</h3>
          <button
            onClick={() => fetchSuggested()}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Refresh
          </button>
        </div>
        <div className="px-2 pb-3">
          {suggestedLoading ? (
            <div className="space-y-2 px-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-2 w-28 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggested.length > 0 ? (
            suggested.slice(0, 5).map((s) => (
              <SuggestionRow key={s._id} s={s} followState={followState} handleFollow={handleFollow} />
            ))
          ) : (
            <p className="text-xs text-gray-400 px-2 py-3 text-center">No suggestions yet</p>
          )}
        </div>
      </div>
    </aside>
  )
}

function SuggestionRow({ s, followState, handleFollow }) {
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