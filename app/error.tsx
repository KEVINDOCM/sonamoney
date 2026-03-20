"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
    console.error("Error Stack:", error.stack);
    console.error("Error Digest:", error.digest);
  }, [error]);

  const errorMessage = error.message || "Unknown error occurred";

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-sm">
            <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              An unexpected error occurred. Please try again.
            </p>
            {/* Error details for debugging */}
            <div className="mb-6 p-3 bg-gray-100 rounded-lg max-w-sm overflow-auto">
              <p className="text-xs text-gray-600 font-mono break-words">
                {errorMessage}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-400 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
