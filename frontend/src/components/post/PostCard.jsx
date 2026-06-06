import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { usePostStore } from "../../store/postStore";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { useToast } from "../ui/Toast";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\w]+/g);
  return matches || [];
}

function Avatar({ name, src, size = 40 }) {
  const [errored, setErrored] = useState(false);
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const colors = [
    "from-blue-500 to-blue-700",
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
  ];
  const grad = colors[(initial.charCodeAt(0) || 0) % colors.length];
  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-semibold border-2 border-white shrink-0`}
        style={{ width: size, height: size, fontSize: size / 2.6 }}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="rounded-full object-cover shrink-0 bg-gray-100"
      style={{ width: size, height: size }}
    />
  );
}

export default function PostCard({ post }) {
  const {
    likePost,
    savePost,
    deletePost,
    addComment,
    deleteComment,
    fetchComments,
  } = usePostStore();
  const { user } = useAuthStore();
  const { followUser } = useProfileStore();
  const toast = useToast();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(!!post?.isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(
    post?.likesCount ?? 0,
  );
  const [floatingLikes, setFloatingLikes] = useState([]);
  const commentsListRef = useRef(null);
  const commentInputRef = useRef(null);
  const prevLikeCountRef = useRef(0);
  const likeDebounceRef = useRef(0);
  const userId = user?._id;

  const isOwner =
    userId && post?.user?._id && String(userId) === String(post.user._id);
  const liked = optimisticLiked;
  const saved = !!post?.isSaved;
  const likeCount = optimisticLikeCount;
  const commentCount = post?.commentsCount ?? 0;
  const comments = useMemo(() => post?.comments || [], [post?.comments]);

  // Sync optimistic like state with actual post props
  useEffect(() => {
    setOptimisticLiked(!!post?.isLiked);
    setOptimisticLikeCount(post?.likesCount ?? 0);
  }, [post?.isLiked, post?.likesCount]);

  // Detect external like changes (from socket) and trigger a small "+1" floater
  useEffect(() => {
    if (prevLikeCountRef.current && likeCount > prevLikeCountRef.current) {
      const id = Date.now() + Math.random();
      setFloatingLikes((arr) => [...arr, { id }]);
      setTimeout(() => {
        setFloatingLikes((arr) => arr.filter((f) => f.id !== id));
      }, 1200);
    }
    prevLikeCountRef.current = likeCount;
  }, [likeCount]);

  // Auto-scroll comments to bottom when new ones arrive
  useEffect(() => {
    if (showComments && commentsListRef.current) {
      commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
    }
  }, [showComments, comments.length]);

  const handleLike = async () => {
    if (!user) return;
    const now = Date.now();
    if (now - likeDebounceRef.current < 400 || isLikePending) return;
    likeDebounceRef.current = now;

    const nextLiked = !optimisticLiked;
    setOptimisticLiked(nextLiked);
    setOptimisticLikeCount((count) => count + (nextLiked ? 1 : -1));
    setPopHeart(true);
    setTimeout(() => setPopHeart(false), 600);
    setIsLikePending(true);

    try {
      await likePost(post._id);
    } catch (e) {
      console.error(e);
      setOptimisticLiked(!!post?.isLiked);
      setOptimisticLikeCount(post?.likesCount ?? 0);
      toast.error("Like update failed. Please try again.");
    } finally {
      setIsLikePending(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await savePost(post._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(post._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const toggleComments = async () => {
    const willShow = !showComments;
    setShowComments(willShow);
    if (willShow) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
      if (
        (!post.comments || post.comments.length === 0) &&
        commentCount > 0 &&
        !loadingComments
      ) {
        setLoadingComments(true);
        await fetchComments(post._id);
        setLoadingComments(false);
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment(post._id, commentText.trim());
      setCommentText("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (cid) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(post._id, cid);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleFollow = async () => {
    if (!user || isOwner || !post?.user?._id) return;
    try {
      await followUser(post.user._id);
    } catch (e) {
      console.error(e);
    }
  };

  if (!post) return null;

  const username = post.user?.username || "Unknown";
  const userIdStr = post.user?._id || post.userId;
  const userImage = post.user?.profileImage;
  const postImage = post.image || post.imageUrl;
  const timeStr = post.timeAgo || timeAgo(post.createdAt);
  const captionText = post.caption || "";
  const tags =
    post.hashtags && post.hashtags.length > 0
      ? post.hashtags
      : extractHashtags(captionText);
  const cleanCaption =
    tags.length > 0 ? captionText.replace(/#[\w]+/g, "").trim() : captionText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[18px] shadow-sm overflow-hidden relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${userIdStr}`}>
            <Avatar name={username} src={userImage} size={40} />
          </Link>
          <div>
            <Link
              to={`/profile/${userIdStr}`}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {username}
            </Link>
            <p className="text-[11px] text-gray-500">{timeStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <button
              onClick={handleFollow}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                post.user?.isFollowing
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {post.user?.isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {isOwner ? (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Delete post"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          ) : (
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {postImage && (
        <div className="relative bg-gray-50">
          <motion.img
            src={postImage}
            alt="Post"
            className="w-full max-h-[520px] object-cover"
            loading="lazy"
            onDoubleClick={handleLike}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          {/* "+1" floating likes (Instagram-style) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {floatingLikes.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: -120, opacity: 1, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ bottom: "40%" }}
                >
                  <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-lg" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4 mb-2">
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.8 }}
            animate={popHeart ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="hover:opacity-60 transition-opacity"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-gray-900"}`}
            />
          </motion.button>
          <button
            onClick={toggleComments}
            className="hover:opacity-60 transition-opacity"
          >
            <MessageCircle className="w-7 h-7 text-gray-900" />
          </button>
          <button
            onClick={handleSave}
            className="hover:opacity-60 transition-opacity"
          >
            <Send className="w-7 h-7 text-gray-900" />
          </button>
          <button
            onClick={handleSave}
            className="ml-auto hover:opacity-60 transition-opacity"
          >
            <Bookmark
              className={`w-7 h-7 ${saved ? "fill-gray-900 text-gray-900" : "text-gray-900"}`}
            />
          </button>
        </div>

        {/* Likes count */}
        {likeCount > 0 && (
          <p className="font-semibold text-sm text-gray-900 mb-1">
            {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
          </p>
        )}
      </div>

      {/* Caption + hashtags */}
      {(cleanCaption || tags.length > 0) && (
        <div className="px-4 pb-2 -mt-1">
          <p className="text-sm text-gray-900 leading-snug">
            <Link
              to={`/profile/${userIdStr}`}
              className="font-semibold hover:underline"
            >
              {username}
            </Link>{" "}
            {cleanCaption && (
              <span className="text-gray-800">{cleanCaption}</span>
            )}
            {tags.length > 0 && (
              <span className="text-blue-600 ml-1">{tags.join(" ")}</span>
            )}
          </p>
        </div>
      )}

      {/* View all comments */}
      {commentCount > 0 && !showComments && (
        <button
          onClick={toggleComments}
          className="px-4 pb-1 text-sm text-gray-500 hover:text-gray-700"
        >
          View all {commentCount} comments
        </button>
      )}

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={commentsListRef}
              className="px-4 py-3 max-h-60 overflow-y-auto space-y-3"
            >
              {loadingComments ? (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  No comments yet
                </p>
              ) : (
                comments.map((c) => {
                  const cUsername = c.user?.username || "Unknown";
                  const cUserId = c.user?._id || c.userId;
                  const cUserImage = c.user?.profileImage;
                  const cText = c.text || c.comment;
                  return (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <Link to={`/profile/${cUserId}`}>
                        <Avatar name={cUsername} src={cUserImage} size={32} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${cUserId}`}
                            className="font-semibold text-xs text-gray-900 hover:underline"
                          >
                            {cUsername}
                          </Link>
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{cText}</p>
                      </div>
                      {(isOwner || userId === cUserId) && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-gray-400 hover:text-red-500 shrink-0 text-xs"
                          title="Delete"
                        >
                          ×
                        </button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment input */}
      <form
        onSubmit={handleComment}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100"
      >
        <Avatar name={user?.username} src={user?.profileImage} size={28} />
        <input
          ref={commentInputRef}
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        {commentText.trim() && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-blue-600 font-semibold text-sm hover:text-blue-700 disabled:text-blue-300"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Post"
            )}
          </button>
        )}
      </form>
    </motion.div>
  );
}
