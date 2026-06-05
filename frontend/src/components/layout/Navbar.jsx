import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Compass, Bell, MessageCircle, PlusSquare, Sun, Moon, LogOut, Settings, User, ChevronDown, X, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold hidden sm:inline">
            Vibe<span className="text-blue-600">Snaps</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Vibesnaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          {navItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </Link>
          ))}

          <Link to="/messages" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" title="Messages">
            <MessageCircle className="w-5 h-5" />
          </Link>

          <div ref={notifRef} className="relative">
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead() }}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                            !notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={notif.sender?.profileImage || '/default-avatar.png'}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                <span className="font-semibold">{notif.sender?.username || 'Someone'}</span>{' '}
                                {notif.type === 'like' ? 'liked your post' : notif.type === 'comment' ? 'commented on your post' : notif.type === 'follow' ? 'started following you' : 'interacted with your post'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={profileRef} className="relative">
            <button
              className="flex items-center gap-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img
                src={user?.profileImage || '/default-avatar.png'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-sm">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link to={`/profile/${user?.username}`} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      onClick={() => { setShowProfileMenu(false); logout(); navigate('/login') }}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 w-full text-left text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  )
}
