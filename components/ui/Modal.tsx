"use client";

import { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, description, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent | KeyboardEventInit | KeyboardEvent) => {
      if ("key" in event && event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown as unknown as (e: KeyboardEvent) => void);
    return () => {
      window.removeEventListener("keydown", handleKeyDown as unknown as (e: KeyboardEvent) => void);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full lg:max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 transform transition-all duration-200 animate-in zoom-in-95 overflow-y-auto max-h-[85vh] p-0 relative">
        <div className="p-4">
          <h2 id="modal-title" className="text-lg lg:text-xl font-medium text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

