import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Send, Check, ChevronLeft } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import API from "../../services/api";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { y: "100%", transition: { type: "spring", damping: 30, stiffness: 300 } },
};

export default function ShareModal({ post, onClose }) {
  const { user } = useAuthStore();
  const { conversations, fetchConversations, createConversation, sendMessage } = useChatStore();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [contacts, setContacts] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Load conversations + followers
  useEffect(() => {
    fetchConversations();
    API.get("/api/users/followers").then((res) => {
      setContacts(res.data || []);
    }).catch(() => {});
  }, [fetchConversations]);

  // Build recent chat users
  const recentChatUsers = useMemo(() => {
    const users = [];
    const seen = new Set();
    for (const conv of conversations) {
      const other = conv.participants?.find((p) => p._id !== user?._id);
      if (other && !seen.has(other._id)) {
        seen.add(other._id);
        users.push(other);
      }
    }
    return users.slice(0, 5);
  }, [conversations, user]);

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);

    try {
      const promises = [];
      for (const userId of selected) {
        promises.push(
          (async () => {
            const conv = await createConversation(userId);
            await sendMessage(conv._id, {
              messageType: "post",
              content: message.trim() || "Shared a post",
              sharedPostId: post._id,
            });
          })(),
        );
      }
      await Promise.all(promises);
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSending(false);
    }
  };

  const renderUser = (contact) => {
    if (!contact) return null;
    const isSelected = selected.has(contact._id);
    return (
      <motion.button
        key={contact._id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => toggleSelect(contact._id)}
        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-colors ${
          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
      >
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200">
            <img
              src={
                contact.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.username || "U")}&background=e4e6eb&color=1a1a1a&size=44`
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          {contact.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {contact.name || contact.username || "User"}
          </p>
          <p className="text-xs text-gray-500 truncate">@{contact.username}</p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </motion.button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          variants={sheetVariants}
          className="relative w-full sm:max-w-md sm:rounded-2xl bg-white sm:mb-0 max-h-[90vh] flex flex-col overflow-hidden"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900">Share</h2>
            <div className="w-7" />
          </div>

          {/* Search */}
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="w-full bg-gray-100 rounded-xl py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-gray-300 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {!search.trim() && recentChatUsers.length > 0 && (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</p>
                {recentChatUsers.map((u) => renderUser(u))}
                <div className="my-2 border-t border-gray-100" />
              </>
            )}

            {filteredContacts.length > 0 ? (
              <>
                {!search.trim() && (
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    All followers
                  </p>
                )}
                {filteredContacts.map((c) => renderUser(c))}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                {search.trim() ? "No users found" : "No followers to show"}
              </div>
            )}
          </div>

          {/* Bottom: message input + send */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
            {/* Optional message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message…"
              rows={1}
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-gray-300 mb-3"
            />

            {/* Preview */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="shrink-0">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={post?.image || post?.imageUrl || ""}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {post?.user?.username || "Post"}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {post?.caption ? `${post.caption.slice(0, 40)}...` : "No caption"}
                </p>
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || sending}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                sent
                  ? "bg-green-500 text-white"
                  : selected.size === 0 || sending
                    ? "bg-blue-200 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]"
              }`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : sent ? (
                <>
                  <Check className="w-4 h-4" />
                  Sent
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send {selected.size > 0 ? `to ${selected.size}` : ""}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}