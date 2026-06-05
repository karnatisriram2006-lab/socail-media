import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { usePostStore } from "../store/postStore";
import PostCard from "../components/post/PostCard";
import CreatePostModal from "../components/post/CreatePostModal";
import { useToast } from "../components/ui/Toast";

export default function HomeFeed() {
  const { posts, loading, error, fetchFeed, hasMoreFeed } = usePostStore();
  const toast = useToast();
  const observerRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreFeed) {
          fetchFeed(true);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMoreFeed, fetchFeed],
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Post
        </motion.button>
      </div>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}

      {posts.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm mt-2">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
