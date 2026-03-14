"use client";

import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
            pointer-events-auto min-w-[280px] max-w-[360px]
            animate-slideInRight
            ${toast.type === "success"
              ? "bg-white border-emerald-100 text-emerald-700"
              : toast.type === "error"
              ? "bg-white border-rose-100 text-rose-600"
              : "bg-white border-blue-100 text-blue-600"
            }
          `}
        >
          {toast.type === "success" && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />}
          {toast.type === "info" && <Info className="h-4 w-4 shrink-0 text-blue-500" />}

          <p className="text-sm font-medium flex-1">{toast.message}</p>

          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss notification"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
