import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import API from '../../services/api'

export default function RightSidebar() {
  const { user } = useAuthStore()
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await API.get('/api/users/suggested')
        setSuggestions(res.data)
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      }
    }
    if (user) fetchSuggestions()
  }, [user])

  return (
    <aside className="hidden xl:block fixed right-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Suggested for you
        </h3>
        <div className="space-y-3">
          {suggestions.slice(0, 5).map((suggestion) => (
            <motion.div
              key={suggestion._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <Link to={`/profile/${suggestion.username}`}>
                <img
                  src={suggestion.profileImage || '/default-avatar.png'}
                  alt={suggestion.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${suggestion.username}`}
                  className="text-sm font-semibold hover:underline truncate block"
                >
                  {suggestion.username}
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.name || suggestion.bio || 'Suggested for you'}
                </p>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex-shrink-0">
                Follow
              </button>
            </motion.div>
          ))}
          {suggestions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No suggestions yet</p>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
        <p>Locations · Language</p>
        <p className="mt-2">&copy; 2026 VibeSnaps</p>
      </div>
    </aside>
  )
}
