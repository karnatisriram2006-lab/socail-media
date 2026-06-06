import { Search, MessageCircle, Pin } from "lucide-react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

const formatSnippet = (text = "", max = 40) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

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
  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation._id === currentConversationId,
      ),
    [conversations, currentConversationId],
  );

  const pinned = conversations.filter((conversation) =>
    conversation.pinnedBy?.includes(currentUserId),
  );
  const recent = conversations.filter(
    (conversation) => !conversation.pinnedBy?.includes(currentUserId),
  );

  const renderConversation = (conversation) => {
    const other = conversation.participants?.find(
      (participant) => participant._id !== currentUserId,
    );
    const isActive = conversation._id === currentConversationId;
    const unread = conversation.unreadCount?.[currentUserId] ?? 0;
    const isTyping = Boolean(typingUsers[conversation._id]);
    const preview = isTyping
      ? "Typing…"
      : conversation.lastMessage || "Send a message";

    return (
      <motion.button
        key={conversation._id}
        onClick={() => onSelectConversation(conversation._id)}
        whileHover={{ y: -1 }}
        className={`group flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
          isActive
            ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/40"
            : "bg-slate-950/95 text-slate-100 hover:bg-slate-900/90"
        }`}
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-slate-800 ring-1 ring-white/10">
          <img
            src={
              other?.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || other?.username || "")}`
            }
            alt={other?.name || other?.username}
            className="h-full w-full object-cover"
          />
          <span
            className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border border-slate-950 ${
              other?.isOnline ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold leading-5">
              {other?.name || other?.username || "Conversation"}
            </p>
            {conversation.pinnedBy?.includes(currentUserId) && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Pinned
              </span>
            )}
          </div>
          <p
            className={`truncate text-xs ${isActive ? "text-slate-300" : "text-slate-400"}`}
          >
            {preview}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] text-slate-500">
            {conversation.lastMessageAt
              ? new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg shadow-cyan-500/20">
              {unread}
            </span>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden rounded-[32px] bg-slate-950/95 p-4 shadow-2xl shadow-slate-900/40 ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-900/95 px-4 py-3 text-slate-100 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-3 text-slate-950">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Messages</h2>
            <p className="text-[11px] text-slate-400">
              Premium chat experience
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
          <Pin className="h-4 w-4" /> {conversations.length}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={searchTerm}
          onChange={(event) => {
            onChangeSearchTerm(event.target.value);
            onSearchUser(event.target.value);
          }}
          placeholder="Search users"
          className="w-full rounded-full border border-slate-800 bg-slate-950/90 py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <AnimatePresence initial={false}>
        {searchTerm && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950/90 p-3 shadow-inner"
          >
            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() => onSelectUser(user)}
                className="flex w-full items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-cyan-400/30"
              >
                <div className="h-10 w-10 overflow-hidden rounded-3xl bg-slate-800">
                  <img
                    src={
                      user.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}`
                    }
                    alt={user.name || user.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.name || user.username}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden rounded-[28px] bg-slate-950/95">
        <div className="border-b border-slate-800 px-4 py-4 text-xs uppercase tracking-[0.24em] text-slate-500">
          Chats
        </div>
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-1 py-2">
          {conversations.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/80 p-5 text-sm text-slate-400">
              No conversations yet. Search for someone to message.
            </div>
          ) : (
            <div className="space-y-2">
              {pinned.length > 0 && (
                <div className="space-y-2">
                  <div className="px-4 text-[11px] uppercase tracking-[0.24em] text-cyan-400">
                    Pinned
                  </div>
                  {pinned.map(renderConversation)}
                </div>
              )}
              {recent.map(renderConversation)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
