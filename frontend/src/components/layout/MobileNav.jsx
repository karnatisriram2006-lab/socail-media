import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, Search, PlusSquare, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'

export default function MobileNav({ onCreatePostClick }) {
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  return (
    <motion.nav
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-around"
    >
      {[
        { to: '/app', icon: Home },
        { to: '/explore', icon: Compass },
      ].map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `p-2 rounded-lg transition-colors ${
              isActive
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900'
                : 'text-gray-500 hover:text-gray-700'
            }`
          }
        >
          <Icon className="w-6 h-6" />
        </NavLink>
      ))}

      <motion.button
        onClick={onCreatePostClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 bg-blue-600 text-white rounded-full"
      >
        <PlusSquare className="w-6 h-6" />
      </motion.button>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          `p-2 rounded-lg transition-colors ${
            isActive
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        <Search className="w-6 h-6" />
      </NavLink>

      <NavLink
        to={`/profile/${user?.username || ''}`}
        className={({ isActive }) =>
          `p-2 rounded-lg transition-colors ${
            isActive
              ? 'ring-2 ring-blue-600 rounded-full'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        <img
          src={user?.profileImage || '/default-avatar.png'}
          alt="Profile"
          className="w-6 h-6 rounded-full object-cover"
        />
      </NavLink>
    </motion.nav>
  )
}
