"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  borderColorClass?: string;
  icon?: ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  borderColorClass = "border-gray-200",
  icon,
}: StatCardProps) {
  return (
    <div
      className={`
        p-4 lg:p-5
        bg-white dark:bg-gray-900
        rounded-2xl shadow-sm
        flex flex-col
        border-l-4 ${borderColorClass}
        hover:shadow-md hover:-translate-y-1
        transition-all duration-300
        cursor-default
        animate-fadeIn
      `}
    >
      <span className="
        text-xs font-semibold
        text-[#6B7280] dark:text-gray-400
        uppercase tracking-wide mb-2
      ">
        {title}
      </span>

      <span className="
        text-xl lg:text-2xl font-extrabold
        text-[#1A1A2E] dark:text-white
        leading-tight
      ">
        {value}
      </span>

      {subtitle && (
        <span className="
          text-xs text-[#6B7280]
          dark:text-gray-500 mt-1.5
        ">
          {subtitle}
        </span>
      )}
    </div>
  );
}
