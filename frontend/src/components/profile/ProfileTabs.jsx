import { motion } from 'framer-motion'

const tabs = [
  { id: 'posts', label: 'Posts' },
  { id: 'saved', label: 'Saved' },
  { id: 'tagged', label: 'Tagged' },
]

export default function ProfileTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
      ))}
    </div>
  )
}
