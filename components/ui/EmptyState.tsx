"use client";

import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  onClick?: () => void;
  buttonLabel?: string;
}

export function EmptyState({
  title,
  description,
  action,
  onClick,
  buttonLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border border-dashed border-gray-200 bg-gray-50">
      <div className="h-16 w-16 rounded-full bg-white border border-gray-100 flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-gray-100" aria-hidden="true" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-base lg:text-lg font-medium text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {action ? (
        <div className="mt-2">{action}</div>
      ) : onClick ? (
        <div className="mt-2">
          <Button onClick={onClick}>{buttonLabel ?? "Add"}</Button>
        </div>
      ) : null}
    </div>
  );
}

