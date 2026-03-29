"use client";

import { useEffect } from "react";
import { createAppError, logError, AppError } from "@/lib/errors";

export default function DashboardSubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const appError = createAppError(error, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      action: "dashboard_sub_render",
    });
    
    logError(appError, {
      digest: error.digest,
      isDashboardSubError: true,
    });
  }, [error]);

  const appError = error instanceof AppError 
    ? error 
    : createAppError(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">📊</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        Dashboard failed to load
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
        <a
          href="/dashboard"
          className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
