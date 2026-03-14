import type { ButtonHTMLAttributes } from "react";

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center min-h-11 lg:min-h-9 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 disabled:opacity-50 disabled:cursor-not-allowed";

const PRIMARY_CLASS = "bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 active:bg-blue-800";
const SECONDARY_CLASS =
  "bg-white text-gray-700 px-4 py-2 border border-gray-300 hover:bg-gray-50 active:bg-gray-100";
const DANGER_CLASS = "bg-rose-500 text-white px-4 py-2 hover:bg-rose-600 active:bg-rose-700";
const GHOST_CLASS = "text-gray-600 px-3 py-2 hover:bg-gray-100 active:bg-gray-200";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "secondary"
      ? SECONDARY_CLASS
      : variant === "danger"
        ? DANGER_CLASS
        : variant === "ghost"
          ? GHOST_CLASS
          : PRIMARY_CLASS;

  const isDisabled = disabled ?? isLoading;

  return (
    <button
      type={props.type ?? "button"}
      className={`${BASE_BUTTON_CLASS} ${variantClass} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </span>
      )}
      {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
      <span>{children as React.ReactNode}</span>
      {rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
    </button>
  );
}

