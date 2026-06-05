import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, duration }]);
    if (duration > 0) {
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        duration,
      );
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = {
    show: (msg, dur) => addToast(msg, dur),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              marginBottom: 8,
              pointerEvents: "auto",
              background: "#fff",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>{t.message}</div>
              <button onClick={() => removeToast(t.id)}>x</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
