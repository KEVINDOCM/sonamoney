// @ts-nocheck
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastVariant = "success" | "error";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined as unknown as ToastContextValue | undefined);

export interface ToastProviderProps {
  children?: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts((current: Toast[]) => current.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message: string) => {
    setToasts((current: Toast[]) => {
      const next: Toast[] = [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          message,
          variant: "success",
        },
      ];
      return next.slice(-2);
    });
  };

  const showError = (message: string) => {
    setToasts((current: Toast[]) => {
      const next: Toast[] = [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          message,
          variant: "error",
        },
      ];
      return next.slice(-2);
    });
  };

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers: number[] = [];
    toasts.forEach((toast) => {
      if (toast.variant === "success") {
        const timer = window.setTimeout(() => removeToast(toast.id), 3000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.variant === "success"
                ? "bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-sm flex items-center justify-between gap-3"
                : "bg-rose-600 text-white text-sm rounded-lg px-4 py-3 shadow-sm flex items-center justify-between gap-3"
            }
          >
            <p className="truncate flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center shrink-0 -mr-2 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4 lg:h-3.5 lg:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

