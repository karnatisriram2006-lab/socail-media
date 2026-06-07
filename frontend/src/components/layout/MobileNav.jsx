import { NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, PlusSquare, Heart, Sparkles, Bell, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'

export default function MobileNav({ onCreatePostClick }) {
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const navItems = [
    { to: '/app', icon: Home },
    { to: '/search', icon: Search },
    { to: '/messages', icon: MessageCircle }, // Messages navigation
    { to: '/explore', icon: Sparkles },
  ]

  return (
    <>
      {/* Mobile Header with App Name */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between h-12 px-4">
          <Link to="/app" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">
              Vibe<span className="text-blue-600">Snaps</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Use Bell for notifications to avoid confusion with Explore's Sparkles */}
            <Link to="/notifications" className="relative p-2">
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-12 h-12 transition-all ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute -bottom-0 w-1 h-1 bg-gray-900 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Create Post Button */}
        <motion.button
          onClick={onCreatePostClick}
          whileTap={{ scale: 0.9 }}
          className="relative flex items-center justify-center w-12 h-12"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center shadow-lg">
            <PlusSquare className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        </motion.button>

        {/* Profile */}
        <NavLink
          to={`/profile/${user?.username || ''}`}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          {({ isActive }) => (
            <>
              <div className={`relative ${isActive ? 'ring-2 ring-gray-900 ring-offset-1 rounded-full' : ''}`}>
                <img
                  src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=random&color=fff&size=100`}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=random&color=fff&size=100`
                  }}
                />
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeMobileNav"
                  className="absolute -bottom-0 w-1 h-1 bg-gray-900 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </>
          )}
        </NavLink>
        </div>

        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </motion.nav>
    </>
  )
}
