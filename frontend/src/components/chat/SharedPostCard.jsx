import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";

export default function SharedPostCard({ post, compact = false }) {
  if (!post) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">Post unavailable</p>
        <p className="text-xs text-gray-400 mt-0.5">
          This post may have been deleted.
        </p>
      </div>
    );
  }

  // Post model uses `userId` field, populated from backend as { _id, username, name, profileImage }
  const postAuthor = post.user || post.userId || {};
  const username = postAuthor.username || "unknown";
  const userImage = postAuthor.profileImage;
  const postImage = post.image || post.imageUrl;
  const caption = post.caption || "";
  const likeCount = post.likesCount ?? post.likes?.length ?? 0;
  const commentCount = post.commentsCount ?? 0;

  return (
    <Link to={`/post/${post._id}`}>
      <motion.div
        whileHover={{ y: -1 }}
        className={`rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
          compact ? "max-w-[240px]" : ""
        }`}
      >
        {/* Author header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 shrink-0">
            <img
              src={
                userImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=e4e6eb&color=1a1a1a&size=24`
              }
              alt={username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-gray-900 truncate">
            {username}
          </span>
        </div>

        {/* Post image */}
        {postImage && (
          <div className="bg-gray-50">
            <img
              src={postImage}
              alt="Post"
              className="w-full h-32 object-cover"
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}

        {/* Caption preview */}
        {caption && (
          <div className="px-3 py-1.5">
            <p className="text-xs text-gray-700 line-clamp-1 leading-relaxed">
              {caption.length > 80 ? `${caption.slice(0, 80)}...` : caption}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Heart className="w-3 h-3" />
            {likeCount}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3" />
            {commentCount}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}