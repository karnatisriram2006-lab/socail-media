import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { PostSkeleton } from '../components/common/Skeleton'
import EmptyState from '../components/common/EmptyState'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function notifIcon(type) {
  if (type === 'like') return Heart
  if (type === 'comment') return MessageCircle
  if (type === 'follow') return UserPlus
  return Bell
}

function notifSender(n) {
  return n.senderId || n.sender || {}
}

function notifText(n) {
  const sender = notifSender(n)
  const who = sender?.username || 'Someone'
  if (n.type === 'like') return `${who} liked your post.`
  if (n.type === 'comment') return `${who} commented on your post.`
  if (n.type === 'follow') return `${who} started following you.`
  if (n.type === 'post_share' || n.type === 'share') return `${who} shared your post.`
  if (n.type === 'profile_share') return `${who} shared a profile with you.`
  return `${who} interacted with your post.`
}

function Avatar({ name, src, size = 44 }) {
  const [errored, setErrored] = useState(false)
  if (!src || errored) {
    const initial = (name || 'U').charAt(0).toUpperCase()
    return (
      <div
        className="rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold flex items-center justify-center shrink-0"
        style={{ width: size, height: size, fontSize: size / 2.6 }}
      >
        {initial}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="rounded-full object-cover shrink-0 bg-gray-100"
      style={{ width: size, height: size }}
    />
  )
}

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAllRead, unreadCount } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <div className="w-full max-w-[650px] mx-auto px-2 py-3 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-[18px] shadow-sm divide-y divide-gray-100">
        {loading && notifications.length === 0 ? (
          <div className="p-4 space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="When someone likes, comments, or follows you, you'll see it here."
          />
        ) : (
          notifications.map((n, i) => {
            const Icon = notifIcon(n.type)
            return (
              <motion.div
                key={n._id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${
                  !n.isRead ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={notifSender(n)?.username} src={notifSender(n)?.profileImage} size={44} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                    <Icon className={`w-3 h-3 ${
                      n.type === 'like' ? 'text-red-500' : n.type === 'comment' ? 'text-blue-500' : n.type === 'follow' ? 'text-purple-500' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-gray-900">
                      {n.sender?.username || 'Someone'}
                    </span>{' '}
                    <span className="text-gray-600">{notifText(n)}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
