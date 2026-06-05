import { useEffect } from 'react'
import { usePostStore } from '../store/postStore'
import PostCard from '../components/post/PostCard'

export default function ExplorePage() {
  const { explorePosts, loading, error, fetchExplore } = usePostStore()

  useEffect(() => {
    fetchExplore()
  }, [fetchExplore])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>

      {explorePosts.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No posts to explore</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {explorePosts.map((post) => (
            <PostCard key={post._id} post={post} isExplore />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
