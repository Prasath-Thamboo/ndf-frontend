import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, color: "text-emerald-500" },
  error: { icon: XCircle, color: "text-rose-500" },
  info: { icon: Info, color: "text-brand-500" },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, duration = 4500) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m, d) => push("success", m, d),
      error: (m, d) => push("error", m, d ?? 6000),
      info: (m, d) => push("info", m, d),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((t) => {
          const { icon: Icon, color } = VARIANTS[t.variant] || VARIANTS.info;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} />
              <p className="flex-1 text-sm font-medium text-slate-800">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
