import { motion } from 'framer-motion'
import { Grid3X3, Bookmark, UserSquare2 } from 'lucide-react'

const tabs = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'tagged', label: 'Tagged', icon: UserSquare2 },
]

export default function ProfileTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex justify-center gap-12 border-b border-gray-200 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 py-4 text-xs uppercase tracking-wider font-semibold transition-colors ${
              isActive
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
