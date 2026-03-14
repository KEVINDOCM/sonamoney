"use client";

import { ChevronDown } from "lucide-react";

interface PaginationControlsProps {
  visibleCount: number;
  totalCount: number;
  hasMore: boolean;
  remaining: number;
  itemsPerPage: number;
  onLoadMore: () => void;
  // Pre-translated labels
  loadMoreLabel: string;
  showingLabel: string;
  ofLabel: string;
  transactionsLabel: string;
  allLoadedLabel: string;
}

export default function PaginationControls({
  visibleCount,
  totalCount,
  hasMore,
  remaining,
  itemsPerPage,
  onLoadMore,
  loadMoreLabel,
  showingLabel,
  ofLabel,
  transactionsLabel,
  allLoadedLabel,
}: PaginationControlsProps) {
  return (
    <>
      {/* Load more button - Client side pagination */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 py-6">
          <button
            onClick={onLoadMore}
            className="flex items-center gap-2 px-6 py-2.5 border border-[#00B9A7] text-[#00B9A7] rounded-full text-sm font-semibold hover:bg-[#00B9A7] hover:text-white active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <ChevronDown className="h-4 w-4" />
            {loadMoreLabel}
          </button>
          <p className="text-xs text-[#6B7280] dark:text-gray-500">
            {showingLabel} {Math.min(visibleCount, totalCount)} {ofLabel} {totalCount} {transactionsLabel}
            {remaining > 0 && ` · ${remaining} more`}
          </p>
        </div>
      )}

      {/* All loaded message */}
      {!hasMore && totalCount > itemsPerPage && (
        <p className="text-center text-xs text-[#6B7280] dark:text-gray-500 py-4">
          {allLoadedLabel}
        </p>
      )}
    </>
  );
}
