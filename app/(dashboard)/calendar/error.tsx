"use client";

import { useEffect } from "react";
import { createAppError, logError, AppError } from "@/lib/errors";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const appError = createAppError(error, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      action: "calendar_render",
    });
    
    logError(appError, {
      digest: error.digest,
      isCalendarError: true,
    });
  }, [error]);

  const appError = error instanceof AppError 
    ? error 
    : createAppError(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">📅</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        Calendar failed to load
      </h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        {appError.userMessage}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
