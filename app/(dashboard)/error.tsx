"use client";

import { useEffect } from "react";
import { createAppError, logError, AppError } from "@/lib/errors";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Convert to AppError and log with full context
    const appError = createAppError(error, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      action: "dashboard_render",
    });
    
    logError(appError, {
      digest: error.digest,
      isDashboardError: true,
    });
  }, [error]);

  // Convert to AppError for consistent handling
  const appError = error instanceof AppError 
    ? error 
    : createAppError(error);

  const errorMessage = appError.userMessage;
  const errorId = appError.errorId;

  const handleCopyErrorId = () => {
    navigator.clipboard.writeText(errorId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">😵</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        {errorMessage}
      </p>

      {/* Error ID for support */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-xs">
        <p className="text-xs text-blue-600 font-medium mb-1">
          Error Reference ID
        </p>
        <div className="flex items-center justify-center gap-2">
          <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-blue-200">
            {errorId}
          </code>
          <button
            onClick={handleCopyErrorId}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            title="Copy error ID"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Technical details (collapsible) */}
      <details className="mb-6 text-left max-w-xs">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          Technical details
        </summary>
        <div className="mt-2 p-3 bg-gray-100 rounded-lg overflow-auto">
          <p className="text-xs text-gray-600 font-mono break-words">
            {appError.message}
          </p>
          {appError.code && (
            <p className="text-xs text-gray-400 mt-2">
              Code: {appError.code}
            </p>
          )}
        </div>
      </details>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-colors duration-200"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
