import type { ButtonHTMLAttributes } from "react";

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center min-h-11 lg:min-h-10 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-[0.98]";

const PRIMARY_CLASS = 
  "bg-brand-primary text-white px-5 hover:bg-brand-primaryHover shadow-teal-sm hover:shadow-teal-md";

const SECONDARY_CLASS =
  "bg-brand-primaryLight text-brand-primary dark:bg-teal-900/30 dark:text-teal-300 px-5 hover:bg-teal-200 dark:hover:bg-teal-900/50";

const TERTIARY_CLASS =
  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-5 hover:bg-slate-200 dark:hover:bg-slate-700";

const DANGER_CLASS = 
  "bg-brand-danger text-white px-5 hover:bg-red-600";

const GHOST_CLASS = 
  "text-brand-textSecondary dark:text-slate-400 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-textPrimary dark:hover:text-slate-200";

const OUTLINE_CLASS =
  "border-2 border-slate-200 dark:border-slate-700 text-brand-textPrimary dark:text-slate-300 px-5 hover:border-brand-primary hover:text-brand-primary dark:hover:border-teal-500 dark:hover:text-teal-400 bg-transparent";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "ghost" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaControls,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "secondary"
      ? SECONDARY_CLASS
      : variant === "tertiary"
        ? TERTIARY_CLASS
        : variant === "danger"
          ? DANGER_CLASS
          : variant === "ghost"
            ? GHOST_CLASS
            : variant === "outline"
              ? OUTLINE_CLASS
              : PRIMARY_CLASS;

  const isDisabled = disabled ?? isLoading;

  return (
    <button
      type={props.type ?? "button"}
      className={`${BASE_BUTTON_CLASS} ${variantClass} ${className}`}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
      {leftIcon && <span className="mr-2 inline-flex items-center" aria-hidden="true">{leftIcon}</span>}
      <span>{children as React.ReactNode}</span>
      {rightIcon && <span className="ml-2 inline-flex items-center" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}

