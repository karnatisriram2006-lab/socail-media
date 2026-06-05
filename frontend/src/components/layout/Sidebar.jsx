import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, Search, Bell, User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import Tooltip from '../ui/Tooltip'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Home', path: '/app', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Search', path: '/search', icon: Search },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'Profile', path: `/profile/${user?.username}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto"
    >
      {user && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user.profileImage || '/default-avatar.png'}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-sm">{user.name || user.username}</h3>
              <p className="text-xs text-gray-500">@{user.username}</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <div className="text-center">
              <span className="block font-semibold text-gray-800 dark:text-gray-200">{user.followers?.length || 0}</span>
              <span>Followers</span>
            </div>
            <div className="text-center">
              <span className="block font-semibold text-gray-800 dark:text-gray-200">{user.following?.length || 0}</span>
              <span>Following</span>
            </div>
            <div className="text-center">
              <span className="block font-semibold text-gray-800 dark:text-gray-200">{user.postsCount || 0}</span>
              <span>Posts</span>
            </div>
          </div>
          <motion.button
            onClick={() => navigate(`/profile/${user.username}`)}
            whileHover={{ x: 3 }}
            className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            My Profile
          </motion.button>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Shortcuts</h4>
        <nav className="space-y-1">
          {navItems.map(({ name, path, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </motion.div>

      <div className="mt-auto">
        <motion.button
          variants={itemVariants}
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
