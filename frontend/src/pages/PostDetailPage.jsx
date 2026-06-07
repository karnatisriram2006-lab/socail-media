import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PostCard from "../components/post/PostCard";
import API from "../services/api";

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    API.get(`/api/posts/${postId}`)
      .then((res) => setPost(res.data.post || res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      {post ? (
        <PostCard post={post} />
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">Post not found or has been deleted.</p>
        </div>
      )}
    </div>
  );
}