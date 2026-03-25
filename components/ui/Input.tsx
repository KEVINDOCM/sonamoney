import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ id, label, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  const baseClass =
    "w-full h-10 lg:h-10 text-base lg:text-sm text-brand-textPrimary border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-darkSurface-elevated dark:text-slate-200 dark:border-slate-700";

  const borderClass = error ? "border-brand-danger focus:ring-brand-danger" : "border-slate-300";

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`${baseClass} ${borderClass} ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

