"use client";

import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <div className="page-container">
      {/* Header Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 px-4 pt-6 pb-8 md:pt-8 md:pb-12 md:rounded-3xl md:mx-4 md:mt-4">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-3 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
            <div className="col-span-3 md:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                  <div className="h-3 w-16 bg-white/20 rounded animate-pulse" />
                </div>
                <div className="h-6 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
            <div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                  <div className="h-3 w-12 bg-white/20 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
            <div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                  <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mt-6 mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 p-4 h-64">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 p-4 h-64">
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
