import { Search, MessageCircle, Edit3, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

const formatSnippet = (text = "", max = 36) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const timeAgo = (timestamp) => {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

function SkeletonLoader() {
  return (
    <div className="space-y-1 px-2 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-2.5 w-36 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        {hasSearch ? (
          <Users className="w-6 h-6 text-gray-400" />
        ) : (
          <MessageCircle className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800">
        {hasSearch ? "No users found" : "No messages yet"}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {hasSearch
          ? "Try a different name"
          : "Tap the pencil to start a conversation"}
      </p>
    </div>
  );
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  searchTerm,
  onChangeSearchTerm,
  onSearchUser,
  searchResults,
  onSelectUser,
  isLoading,
  typingUsers = {},
}) {
  const currentUserId = useAuthStore((state) => state.user?._id);

  const renderConversation = (conversation) => {
    const other = conversation.participants?.find(
      (p) => p._id !== currentUserId,
    );
    const isActive = conversation._id === currentConversationId;
    const unread = conversation.unreadCount?.[currentUserId] ?? 0;
    const isTyping = Boolean(typingUsers[conversation._id]);
    const preview = isTyping
      ? "Typing…"
      : conversation.lastMessage || "No messages yet";

    return (
      <motion.button
        key={conversation._id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onSelectConversation(conversation._id)}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive
            ? "bg-blue-50"
            : "hover:bg-gray-50"
        }`}
      >
        {/* Avatar with online dot */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200">
            <img
              src={
                other?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || other?.username || "U")}&background=e4e6eb&color=1a1a1a&size=44`
              }
              alt={other?.name || other?.username}
              className="w-full h-full object-cover"
            />
          </div>
          {other?.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {other?.name || other?.username || "User"}
            </p>
            <span className="text-[11px] text-gray-400 ml-2 shrink-0">
              {timeAgo(conversation.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className={`text-sm truncate ${isTyping ? "text-blue-500 italic" : unread > 0 ? "font-semibold text-gray-900" : "text-gray-500"}`}>
              {isTyping ? "typing..." : formatSnippet(preview)}
            </p>
            {unread > 0 && (
              <span className="ml-2 shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center px-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">
          {currentConversationId ? (
            <button onClick={() => window.history.back()} className="lg:hidden mr-2 text-blue-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          Messages
        </h1>
        <button
          onClick={() => onChangeSearchTerm("")}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          title="New message"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={(e) => {
              onChangeSearchTerm(e.target.value);
              if (e.target.value) onSearchUser(e.target.value);
            }}
            placeholder="Search"
            className="w-full bg-gray-100 rounded-lg py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-gray-300 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onChangeSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      <AnimatePresence>
        {searchTerm && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-gray-100"
          >
            <div className="px-2 py-1 space-y-0.5 max-h-48 overflow-y-auto">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts</p>
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => onSelectUser(user)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={
                        user.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=e4e6eb&color=1a1a1a&size=40`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <SkeletonLoader />
        ) : conversations.length === 0 ? (
          <EmptyState hasSearch={false} />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-0.5">
              {conversations.map(renderConversation)}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}