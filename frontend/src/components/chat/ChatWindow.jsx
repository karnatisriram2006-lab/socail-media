import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  ChevronLeft,
} from "lucide-react";
import ChatMessage from "./ChatMessage";

const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find(
    (participant) => participant._id !== currentUserId,
  );

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
  const [composerHeight, setComposerHeight] = useState(48);
  const [attachmentName, setAttachmentName] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const other = useMemo(
    () => getOtherParticipant(conversation, currentUserId),
    [conversation, currentUserId],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSend = async () => {
    if (!draft.trim() && !attachmentName) return;
    await onSend(conversation._id, {
      messageType: attachmentName ? "image" : "text",
      content: draft.trim(),
      imageUrl: attachmentName ? "" : undefined,
    });
    setDraft("");
    setAttachmentName("");
    setComposerHeight(48);
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const handleTextInput = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    setComposerHeight(textareaRef.current.scrollHeight);
    onTyping("start");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-4 rounded-t-[32px] border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 transition hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-inner">
              <img
                src={
                  other?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || other?.username || "")}`
                }
                alt={other?.name || other?.username}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                {other?.name || other?.username || "Conversation"}
              </p>
              <p className="text-sm text-slate-400">
                {other?.isOnline ? "Online" : "Last seen recently"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-slate-300 transition hover:bg-slate-800">
            <Phone className="h-5 w-5" />
          </button>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]">
            <Video className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mx-auto mt-16 w-full max-w-xl rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-8 text-center text-sm text-slate-400"
            >
              <p className="font-semibold text-slate-100">
                Welcome to your new chat
              </p>
              <p className="mt-2 text-slate-500">
                Send the first message to start the conversation.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isMine={message.sender?._id === currentUserId}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-b-[32px] border-t border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            {typing ? `${other?.name || "They"} is typing…` : "Type a message"}
          </p>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
            {attachmentName || "Ready"}
          </span>
        </div>

        <div className="flex items-end gap-3">
          <div className="grid gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-slate-300 transition hover:bg-slate-800"
              onClick={() => alert("Emoji picker coming soon")}
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-slate-300 transition hover:bg-slate-800"
              onClick={triggerFileInput}
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                handleTextInput();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              className="min-h-[48px] w-full resize-none rounded-[28px] border border-slate-800 bg-slate-900/90 px-5 py-4 pr-14 text-sm leading-6 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              style={{ height: composerHeight }}
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105"
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-slate-300 transition hover:bg-slate-800"
            onClick={() => alert("Voice messaging coming soon")}
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
