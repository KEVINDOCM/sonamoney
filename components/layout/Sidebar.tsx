"use client";

import Link from "next/link";
import * as navigation from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/actions/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  LayoutDashboard,
  BarChart2,
  Target,
  DollarSign,
  Tag,
  MoreHorizontal,
  LogOut,
  Settings2,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export interface SidebarProps {
  budgetWarningCount: number;
  children: React.ReactNode;
}

// Primary nav items (shown in sidebar and mobile nav)
const PRIMARY_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: DollarSign },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Budget", href: "/budget", icon: Target },
];

// Secondary nav items (shown only in sidebar, hidden on mobile)
const SECONDARY_NAV_ITEMS = [
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

export function Sidebar({ budgetWarningCount, children }: SidebarProps) {
  const pathname = navigation.usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { t, mounted } = useTranslation();

  const isActive = (href: string) => pathname === href;
  const isMoreActive = SECONDARY_NAV_ITEMS.some((item) => isActive(item.href));

  const getNavKey = (href: string): string => {
    const keyMap: Record<string, string> = {
      "/dashboard": "dashboard",
      "/transactions": "transactions",
      "/calendar": "calendar",
      "/budget": "budget",
      "/accounts": "accounts",
      "/goals": "goals",
      "/analytics": "analytics",
      "/categories": "categories",
      "/settings": "settings",
    };
    return keyMap[href] || "";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop only, collapsible with hover */}
      <aside className="group fixed inset-y-0 left-0 z-40 w-16 hover:w-64 bg-white dark:bg-gray-900 hidden lg:flex flex-col py-6 transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-100 dark:border-gray-800 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
        {/* Logo section */}
        <div className="mb-8 px-3 flex items-center gap-3 overflow-hidden">
          <Link href="/dashboard" aria-label="SonaMoney Home" className="flex items-center gap-3">
            <img src="/logo-navbar.svg" alt="SonaMoney" className="h-8 w-8 shrink-0" />
            <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              SonaMoney
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-2">
          {ALL_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isBudget = item.href === "/budget";
            const navKey = getNavKey(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={mounted && navKey ? t(`nav.${navKey}`) : item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium">
                  {mounted && navKey ? t(`nav.${navKey}`) : item.label}
                </span>
                {isBudget && budgetWarningCount > 0 && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-[#FF5B5B] text-white text-xs flex items-center justify-center font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {budgetWarningCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Log out button */}
        <div className="mt-6 px-2">
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              ariaLabel={mounted ? t("nav.logout") : "Log out"}
              className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium">
                {mounted ? t("nav.logout") : "Log out"}
              </span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full ml-0 lg:ml-16 pb-16 lg:pb-0 bg-slate-50 dark:bg-slate-950">
        <div className="px-4 py-4 lg:px-6 lg:py-6 min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* More Drawer - Mobile only */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] p-4 p-safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const navKey = getNavKey(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl transition-colors duration-200 ${
                      active
                        ? "bg-[#E6F7F6] dark:bg-[#00B9A7]/10 text-[#00B9A7]"
                        : "text-[#6B7280] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">
                      {mounted && navKey ? t(`nav.${navKey}`) : item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile only */}
      <nav className="fixed bottom-0 left-0 z-50 h-16 w-full lg:hidden bg-white dark:bg-slate-900 flex items-center shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isBudget = item.href === "/budget";
          const navKey = getNavKey(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 relative min-h-[44px]"
            >
              {active ? (
                <div className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] w-full">
                  <div className="flex flex-col items-center gap-0.5 bg-teal-50 dark:bg-teal-900/30 rounded-2xl px-3 py-1 transition-all duration-200">
                    <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                      {mounted && navKey ? t(`nav.${navKey}`) : item.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] w-full">
                  <div className="flex flex-col items-center gap-0.5 px-3 py-1">
                    <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {mounted && navKey ? t(`nav.${navKey}`) : item.label}
                    </span>
                  </div>
                </div>
              )}
              {isBudget && budgetWarningCount > 0 && (
                <span className="absolute top-1 right-1/4 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                  {budgetWarningCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          aria-label={mounted ? t("nav.more") : "More"}
          aria-expanded={isMoreOpen}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 relative min-h-[44px] ${
            isMoreActive || isMoreOpen ? "" : ""
          }`}
        >
          {isMoreActive || isMoreOpen ? (
            <div className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] w-full">
              <div className="flex flex-col items-center gap-0.5 bg-teal-50 dark:bg-teal-900/30 rounded-2xl px-3 py-1 transition-all duration-200">
                <MoreHorizontal className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                  {mounted ? t("nav.more") : "More"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] w-full">
              <div className="flex flex-col items-center gap-0.5 px-3 py-1">
                <MoreHorizontal className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {mounted ? t("nav.more") : "More"}
                </span>
              </div>
            </div>
          )}
        </button>
      </nav>
      <OnboardingModal />
    </div>
  );
}
