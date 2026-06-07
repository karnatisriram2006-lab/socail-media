import { motion } from "framer-motion";
import { useState } from "react";
import { Check, CheckCheck, Heart, Reply, MoreHorizontal, Trash2 } from "lucide-react";
import SharedPostCard from "./SharedPostCard";

const friendlyTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatMessage({
  message,
  isMine,
  grouped = false,
  onReply,
  onReact,
  onDelete,
}) {
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = () => {
    setLiked((prev) => !prev);
    onReact?.(message._id, !liked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2"}`}
    >
      <div className="group relative max-w-[75%] flex items-end gap-1.5">
        {/* Avatar for incoming (first in group) */}
        {!isMine && !grouped && (
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0 mb-1">
            <img
              src={
                message.sender?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || message.sender?.username || "U")}&background=e4e6eb&color=1a1a1a&size=28`
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!isMine && grouped && <div className="w-7 shrink-0" />}

        {/* Actions (left side for mine, right side for theirs) */}
        <div className={`flex ${isMine ? "order-first" : "order-last"} items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition ${liked ? "text-red-500" : "text-gray-400"}`}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onReply?.(message)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition"
              title="More"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className={`absolute ${isMine ? "right-0" : "left-0"} bottom-full mb-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px]`}>
                  <button
                    onClick={() => { onDelete?.(message._id); setShowMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isMine ? "Unsend" : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply indicator */}
        {message.replyTo && (
          <div
            className={`${isMine ? "order-first mr-2" : "order-last ml-2"} self-end mb-1`}
          >
            <div className={`text-[11px] ${isMine ? "text-blue-200" : "text-gray-500"} italic max-w-[160px] truncate`}>
              Replying to {message.replyTo.sender?.name || "a message"}
            </div>
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col">
          {/* Shared post card */}
          {message.messageType === "post" && message.sharedPost && (
            <div className="mb-1">
              <SharedPostCard post={message.sharedPost} compact />
            </div>
          )}
          {message.messageType === "post" && !message.sharedPost && (
            <div className="mb-1 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Post unavailable</p>
            </div>
          )}
          {message.messageType === "profile" && (
            <div className={`mb-1 rounded-xl border ${isMine ? "border-blue-400/30 bg-blue-600" : "border-gray-200 bg-white"} p-3 shadow-sm`}>
              <p className={`text-xs font-semibold ${isMine ? "text-white" : "text-gray-900"}`}>
                👤 Shared a profile
              </p>
              <p className={`text-[11px] mt-0.5 ${isMine ? "text-blue-200" : "text-gray-500"}`}>
                @{message.sharedProfile?.username || "username"}
              </p>
            </div>
          )}

          {/* Image */}
          {message.messageType === "image" && message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Sent image"
              className="mb-1 rounded-xl max-w-[260px] w-full object-cover cursor-pointer"
              loading="lazy"
            />
          )}

          {/* Text bubble */}
          {message.content && (
            <div
              className={`relative px-3.5 py-2 text-sm leading-5 ${
                isMine
                  ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {/* Timestamp + status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end mr-1" : "justify-start ml-1"}`}>
            <span className={`text-[10px] ${isMine ? "text-gray-400" : "text-gray-400"}`}>
              {friendlyTime(message.createdAt)}
            </span>
            {isMine && (
              <span className="inline-flex items-center">
                {message.pending ? (
                  <span className="text-[10px] text-gray-400">Sending...</span>
                ) : message.isSeen ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}