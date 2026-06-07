import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-500",
    barClass: "bg-green-500",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-red-500",
    barClass: "bg-red-500",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    barClass: "bg-blue-500",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-500",
    barClass: "bg-amber-500",
  },
};

const DEFAULT_VARIANT = "info";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, opts = {}) => {
      const id = Date.now() + Math.random();
      const variant = opts.variant || DEFAULT_VARIANT;
      const duration = opts.duration ?? 3500;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast],
  );

  // The API exposes common helpers for ergonomic use across the app.
  const api = {
    show: (msg, opts) => addToast(msg, opts),
    success: (msg, opts) => addToast(msg, { ...opts, variant: "success" }),
    error: (msg, opts) => addToast(msg, { ...opts, variant: "error" }),
    info: (msg, opts) => addToast(msg, { ...opts, variant: "info" }),
    warning: (msg, opts) => addToast(msg, { ...opts, variant: "warning" }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed z-[100] flex flex-col items-end gap-2 pointer-events-none"
        style={{
          right: 16,
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          maxWidth: 380,
        }}
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant] || VARIANT_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-100 min-w-[260px] max-w-full animate-in fade-in slide-in-from-bottom-2"
              style={{
                animation: "toast-in 0.2s ease-out",
              }}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${style.barClass}`}
              />
              <div className="flex items-start gap-2.5 p-3 pl-4">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconClass}`} />
                <div className="flex-1 text-sm text-gray-800 break-words">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
