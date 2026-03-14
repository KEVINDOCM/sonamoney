"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  percentage: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  showLabel?: boolean;
  label?: string;
  height?: "sm" | "md";
}

export default function ProgressBar({
  percentage,
  warningThreshold = 70,
  dangerThreshold = 90,
  showLabel = false,
  label,
  height = "md",
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min(percentage, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const heightClass = height === "sm" ? "h-1.5" : "h-2";

  const colorClass =
    percentage >= dangerThreshold
      ? "bg-[#FF5B5B]"
      : percentage >= warningThreshold
      ? "bg-[#FFB800]"
      : "bg-[#00C48C]";

  return (
    <div className="w-full mt-3">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-[#6B7280] dark:text-gray-400">
              {label}
            </span>
          )}
          {showLabel && (
            <span className={`
              text-xs font-semibold
              ${percentage >= dangerThreshold
                ? "text-[#FF5B5B]"
                : percentage >= warningThreshold
                ? "text-[#FFB800]"
                : "text-[#00C48C]"
              }
            `}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="
        w-full bg-gray-100 dark:bg-gray-700
        rounded-full overflow-hidden
      "
        style={{ height: height === "sm" ? "6px" : "8px" }}
      >
        <div
          className={`
            ${heightClass} ${colorClass}
            rounded-full
            transition-all duration-700 ease-out
          `}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
