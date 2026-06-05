import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/app" className="text-xl font-bold">
          VibeSnaps
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/explore" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Explore
          </Link>
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Profile
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
