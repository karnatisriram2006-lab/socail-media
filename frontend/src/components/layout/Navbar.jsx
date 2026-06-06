import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, Compass, Film, MessageCircle, Bell, Search, Sparkles, 
  Settings, LogOut, User, ChevronDown, PlusSquare, Moon, Sun,
  TrendingUp, Bookmark, HelpCircle, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Search suggestions data
const trendingSearches = [
  { type: 'trending', text: 'photography', icon: TrendingUp },
  { type: 'trending', text: 'design', icon: TrendingUp },
  { type: 'trending', text: 'travel', icon: TrendingUp },
  { type: 'trending', text: 'food', icon: TrendingUp },
]

export default function Navbar({ onCreatePostClick }) {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)

  // Scroll effect for navbar shrink
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when search bar opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`)
      setShowSearch(false)
      setSearch('')
    }
  }

  const handleSearchSuggestion = (text) => {
    setSearch(text)
    navigate(`/search?q=${encodeURIComponent(text)}`)
    setShowSearch(false)
    setSearch('')
  }

  const handleLogout = async () => {
    setShowDropdown(false)
    await logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`hidden lg:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'py-2' 
            : 'py-3'
        }`}
      >
        {/* Glassmorphism Background */}
        <div className={`absolute inset-0 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md'
        }`} />
        
        <div className="relative max-w-[1400px] mx-auto w-full px-6 flex items-center justify-between">
          {/* Logo - Far Left */}
          <Link to="/app" className="flex items-center gap-2.5 shrink-0 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <Sparkles className="w-8 h-8 text-blue-600 relative" />
            </motion.div>
            <span className="text-xl font-bold">
              <span className="text-gray-900 dark:text-white">Vibe</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Snaps</span>
            </span>
          </Link>

          {/* Center Section - Nav Icons */}
          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl px-2 py-1.5">
            {navItems.map(({ icon: Icon, label, path, badge }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        active ? 'stroke-[2.5]' : 'stroke-[1.5]'
                      }`}
                    />
                    {badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg"
                      >
                        {badge > 99 ? '99+' : badge}
                      </motion.span>
                    )}
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {label}
                  </div>
                </Link>
              )
            })}
            
            {/* Create Post Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreatePostClick}
              className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
            >
              <PlusSquare className="w-5 h-5 stroke-[1.5]" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
            </motion.button>
          </div>

          {/* Right Section - Search + Profile */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <div ref={searchRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  showSearch
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </motion.button>

              {/* Search Dropdown */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/10 border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <form onSubmit={handleSearch} className="p-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search for people, tags, places..."
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </form>
                    <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Trending</p>
                      <div className="space-y-1">
                        {trendingSearches.map((item) => (
                          <button
                            key={item.text}
                            onClick={() => handleSearchSuggestion(item.text)}
                            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all duration-200 ${
                  showDropdown 
                    ? 'bg-gray-100 dark:bg-gray-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <img
                  src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=gradient&color=fff&size=100`}
                  alt={user?.username}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=gradient&color=fff&size=100`
                  }}
                />
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/10 border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                      <div className="flex items-center gap-3">
                        <img
                          src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=gradient&color=fff&size=100`}
                          alt={user?.username}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-600 shadow-lg"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.name || user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to={`/profile/${user?.username}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/saved"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>Saved</span>
                      </Link>
                      <Link
                        to="/edit-profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        to="/help"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Help</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between h-12 px-4">
          <Link to="/app" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Vibe<span className="text-blue-600">Snaps</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-12 h-12 transition-all ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
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
                      className="absolute -bottom-0 w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
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
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-1 rounded-full' : ''}`}>
                  <img
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=gradient&color=fff&size=100`}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=gradient&color=fff&size=100`
                    }}
                  />
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute -bottom-0 w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
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