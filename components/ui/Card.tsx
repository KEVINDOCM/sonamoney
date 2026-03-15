export interface CardProps {
  children: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function Card({
  children,
  className,
  transparent = false,
}: CardProps) {
  const baseClass = transparent
    ? "flex flex-col gap-3"
    : "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 lg:p-6 flex flex-col gap-3";

  return (
    <div className={`${baseClass} ${className ?? ""}`}>
      {children}
    </div>
  );
}

