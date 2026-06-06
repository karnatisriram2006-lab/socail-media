import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Compass, Film, MessageCircle, Bell, Search, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      style={{ height: 70 }}
    >
      <div className="max-w-[1400px] mx-auto h-full px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/app" className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-7 h-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">
            Vibe<span className="text-blue-600">Snaps</span>
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Centered nav icons */}
        <div className="flex items-center gap-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`p-2.5 rounded-lg transition-colors ${
                  active ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </div>

        {/* Profile + Switch */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src={user?.profileImage || 'https://i.pravatar.cc/150?u=me'}
                  alt="me"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <span className="hidden lg:inline text-sm font-medium text-gray-900">
                  {user.name || user.username}
                </span>
              </Link>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Switch
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
