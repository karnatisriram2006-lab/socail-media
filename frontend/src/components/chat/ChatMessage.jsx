import { motion } from "framer-motion";
import {
  Clock3,
  Check,
  CheckCircle2,
  Heart,
  Share2,
  MoreHorizontal,
} from "lucide-react";

const friendlyTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatMessage({ message, isMine }) {
  const bubbleClass = isMine
    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/20"
    : "bg-slate-900 text-slate-100 border border-slate-800 shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-1`}
    >
      <div className={`group max-w-[84%] rounded-[32px] p-4 ${bubbleClass}`}>
        {message.sender && !isMine && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300 opacity-90">
            {message.sender.name || message.sender.username}
          </p>
        )}

        {message.messageType === "image" && message.imageUrl ? (
          <img
            src={message.imageUrl}
            alt="Sent image"
            className="mb-3 min-h-[140px] w-full rounded-[28px] object-cover"
          />
        ) : null}

        {message.messageType === "post" ? (
          <div className="mb-3 rounded-[28px] border border-dashed border-slate-700 bg-slate-950/90 p-4 text-sm text-slate-200">
            <div className="mb-1 text-sm font-semibold text-white">
              Shared a post
            </div>
            <p className="text-[13px] text-slate-400">
              Open this message to view the shared post.
            </p>
          </div>
        ) : null}

        {message.messageType === "profile" ? (
          <div className="mb-3 rounded-[28px] border border-dashed border-slate-700 bg-slate-950/90 p-4 text-sm text-slate-200">
            <div className="mb-1 text-sm font-semibold text-white">
              Shared a profile
            </div>
            <p className="text-[13px] text-slate-400">
              {message.sharedProfile?.username || "Profile shared"}
            </p>
          </div>
        ) : null}

        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {message.content ||
            (message.messageType === "image" ? "Sent an image" : "")}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1 opacity-90">
            <Clock3 className="h-3.5 w-3.5" />
            {friendlyTime(message.createdAt)}
          </span>
          {isMine && (
            <span className="inline-flex items-center gap-1 text-slate-200 opacity-90">
              {message.pending ? (
                <span className="inline-flex items-center gap-1 text-yellow-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 animate-pulse" />{" "}
                  Sending
                </span>
              ) : message.isSeen ? (
                <span className="inline-flex items-center gap-1 text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Seen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Check className="h-3.5 w-3.5" /> Delivered
                </span>
              )}
            </span>
          )}
        </div>

        <div className="mt-3 hidden items-center justify-end gap-3 text-slate-400 opacity-0 transition group-hover:flex">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 transition hover:bg-white/10">
            <Heart className="h-4 w-4" />
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 transition hover:bg-white/10">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 transition hover:bg-white/10">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
