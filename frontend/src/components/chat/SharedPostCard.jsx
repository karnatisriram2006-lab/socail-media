import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Play } from "lucide-react";

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
  const isVideo = post.mediaType === "video";
  const caption = post.caption || "";
  const likeCount = post.likesCount ?? post.likes?.length ?? 0;
  const commentCount = post.commentsCount ?? 0;

  // Resolve the right media for the preview
  // For images: use the image / mediaUrl
  // For videos: show the thumbnail (poster) by default, with a play overlay.
  //             If the caller wants an inline preview, render a muted looping
  //             <video> with poster fallback.
  const previewSrc = isVideo
    ? (post.thumbnail || post.image || post.imageUrl || post.mediaUrl)
    : (post.image || post.imageUrl || post.mediaUrl);
  const inlineVideoSrc = isVideo ? (post.mediaUrl || post.image || post.imageUrl) : null;

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
          {isVideo && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium">
              <Play className="w-2.5 h-2.5 fill-gray-500" /> Video
            </span>
          )}
        </div>

        {/* Post media */}
        {previewSrc && (
          <div className="relative bg-gray-50">
            {isVideo && inlineVideoSrc ? (
              // Inline muted, autoplay, looping video preview
              <video
                src={inlineVideoSrc}
                poster={previewSrc}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                className="w-full h-32 object-cover"
              />
            ) : (
              <img
                src={previewSrc}
                alt="Post"
                className="w-full h-32 object-cover"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}

            {/* Play icon overlay for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
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
