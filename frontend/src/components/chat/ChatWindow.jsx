import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  ChevronLeft,
  ChevronDown,
  Send,
  MoreHorizontal,
  X,
} from "lucide-react";
import ChatMessage from "./ChatMessage";

const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find(
    (p) => p._id !== currentUserId,
  );

const formatDateSeparator = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

function DateSeparator({ timestamp }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {formatDateSeparator(timestamp)}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function TypingDots({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start px-1 mt-1"
    >
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-xs text-gray-500 italic">{name} is typing</span>
      </div>
    </motion.div>
  );
}

function ImagePreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative inline-block mb-2 rounded-xl overflow-hidden border border-gray-200"
    >
      <img src={url} alt="Preview" className="max-h-36 w-auto object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-900/70 text-white flex items-center justify-center hover:bg-gray-900 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  typing,
  onSend,
  onTyping,
  onBack,
}) {
  const [draft, setDraft] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const other = useMemo(
    () => getOtherParticipant(conversation, currentUserId),
    [conversation, currentUserId],
  );

  // Group messages
  const groupedMessages = useMemo(() => {
    const groups = [];
    for (let i = 0; i < messages.length; i++) {
      const curr = messages[i];
      const prev = messages[i - 1];
      const isGrouped =
        prev &&
        prev.sender?._id === curr.sender?._id &&
        new Date(curr.createdAt) - new Date(prev.createdAt) < 300000;
      groups.push({ ...curr, grouped: !!isGrouped });
    }
    return groups;
  }, [messages]);

  // Date separators
  const displayItems = useMemo(() => {
    const items = [];
    let lastDate = null;
    for (const msg of groupedMessages) {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== lastDate) {
        items.push({ type: "date", timestamp: msg.createdAt });
        lastDate = d;
      }
      items.push({ type: "message", data: msg });
    }
    return items;
  }, [groupedMessages]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const hasNew = messages.length > prevMessagesLengthRef.current;
    if (nearBottom || hasNew) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!draft.trim() && !imageFile) return;
    const content = draft.trim();
    await onSend(conversation._id, {
      messageType: imageFile ? "image" : "text",
      content: content || (imageFile ? "Sent an image" : ""),
      imageFile: imageFile || undefined,
    });
    setDraft("");
    setImageFile(null);
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onTyping("stop");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
    onTyping(draft.trim() ? "start" : "stop");
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const addEmoji = (emoji) => {
    setDraft((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 shrink-0">
            <img
              src={
                other?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || other?.username || "U")}&background=e4e6eb&color=1a1a1a&size=36`
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {other?.name || other?.username || "Conversation"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {other?.isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active now
                </span>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 bg-[#F5F5F7]"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Say hello to {other?.name || "this user"}!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-0.5">
              {displayItems.map((item, i) =>
                item.type === "date" ? (
                  <DateSeparator key={`d-${i}`} timestamp={item.timestamp} />
                ) : (
                  <ChatMessage
                    key={item.data._id}
                    message={item.data}
                    isMine={item.data.sender?._id === currentUserId}
                    grouped={item.data.grouped}
                  />
                ),
              )}
              {typing && <TypingDots name={other?.name || other?.username || ""} />}
            </div>
          )}
        </AnimatePresence>

        {/* Scroll button */}
        <AnimatePresence>
          {showScrollBtn && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:shadow-md transition z-10"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
        {/* Image preview */}
        {imagePreview && <ImagePreview file={imageFile} onRemove={() => { setImageFile(null); setImagePreview(null); }} />}

        <div className="flex items-end gap-2">
          {/* Left buttons */}
          <div className="flex gap-0.5 pb-1">
            <button
              type="button"
              onClick={() => addEmoji("😊")}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              rows={1}
              className="w-full resize-none rounded-2xl bg-gray-100 px-4 py-2.5 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-gray-300 leading-5 max-h-[150px]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim() && !imageFile}
              className="absolute right-1.5 bottom-1.5 w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white flex items-center justify-center transition disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Mic */}
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition pb-1"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />
      </div>
    </div>
  );
}