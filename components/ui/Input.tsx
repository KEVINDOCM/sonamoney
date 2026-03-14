import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ id, label, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  const baseClass =
    "w-full h-10 lg:h-10 text-base lg:text-sm text-gray-900 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const borderClass = error ? "border-rose-500 focus:ring-rose-500" : "border-gray-300";

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

