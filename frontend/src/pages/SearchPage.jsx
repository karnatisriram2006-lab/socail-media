import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import API from '../services/api'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(query)
  const [results, setResults] = useState({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('top')

  useEffect(() => {
    if (query) {
      const run = async () => {
        setLoading(true)
        try {
          const res = await API.get(`/api/search?q=${encodeURIComponent(query)}`)
          setResults(res.data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      run()
    }
  }, [query])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() })
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search people, posts, tags..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : query ? (
        <div>
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {['top', 'people', 'posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium capitalize ${
                  activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {results.users?.length > 0 && (activeTab === 'top' || activeTab === 'people') && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">People</h3>
              <div className="space-y-3">
                {results.users.map((user) => (
                  <motion.div key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Link
                      to={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <img src={user.profileImage || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.name || user.bio || ''}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {results.posts?.length > 0 && (activeTab === 'top' || activeTab === 'posts') && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Posts</h3>
              <div className="grid grid-cols-3 gap-2">
                {results.posts.map((post) => (
                  <Link key={post._id} to={`/post/${post._id}`} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {post.image && (
                      <img src={post.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!results.users?.length && !results.posts?.length && (
            <p className="text-center text-gray-500 py-12">No results found for &ldquo;{query}&rdquo;</p>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Search for people and posts</p>
        </div>
      )}
    </div>
  )
}
