"use client";

import { useState } from "react";
import { TOAST_DURATION_MS } from "@/lib/constants";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastMethods {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface UseToastReturn {
  toasts: Toast[];
  toast: ToastMethods;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev: Toast[]) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev: Toast[]) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  };

  const removeToast = (id: string) => {
    setToasts((prev: Toast[]) => prev.filter((t) => t.id !== id));
  };

  const toast: ToastMethods = {
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  };

  return { toasts, toast, removeToast };
}
