"use client";

import { useRouter } from "next/navigation";
import {
  PlusCircle,
  ArrowLeftRight,
  Target,
  BarChart2,
} from "lucide-react";

interface QuickActionsProps {
  mounted: boolean;
  t: (key: string) => string;
  onAddTransaction: () => void;
}

export function QuickActions({
  mounted,
  t,
  onAddTransaction,
}: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      icon: PlusCircle,
      label: mounted ? t("transactions.add") : "Add",
      color: "bg-[#00B9A7]",
      onClick: onAddTransaction,
    },
    {
      icon: ArrowLeftRight,
      label: mounted ? t("nav.accounts") : "Transfer",
      color: "bg-[#6366F1]",
      onClick: () => router.push("/accounts"),
    },
    {
      icon: Target,
      label: mounted ? t("nav.budget") : "Budget",
      color: "bg-[#FFB800]",
      onClick: () => router.push("/budget"),
    },
    {
      icon: BarChart2,
      label: mounted ? t("nav.analytics") : "Analytics",
      color: "bg-[#00C48C]",
      onClick: () => router.push("/analytics"),
    },
  ];

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-2xl shadow-sm
      mx-4 md:mx-0
      -mt-5 relative
      px-4 py-4
    ">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="
              flex flex-col items-center gap-2
              group cursor-pointer
            "
          >
            <div className={`
              w-12 h-12 rounded-2xl
              ${action.color}
              flex items-center justify-center
              shadow-sm
              group-hover:scale-110
              group-active:scale-95
              transition-all duration-200
            `}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="
              text-[11px] font-medium
              text-[#6B7280] dark:text-gray-400
              text-center leading-tight
            ">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
