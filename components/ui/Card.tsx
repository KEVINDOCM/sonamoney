export interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const CARD_CLASS =
  "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 lg:p-6 flex flex-col gap-3";

export function Card({ title, description, children }: CardProps) {
  return (
    <section className={CARD_CLASS}>
      {(title || description) && (
        <header className="space-y-1">
          {title && <h2 className="text-base lg:text-lg font-medium text-gray-700 dark:text-gray-300">{title}</h2>}
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </header>
      )}
      <div>{children as React.ReactNode}</div>
    </section>
  );
}

