export interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}

export function CategoryIcon({ icon, color, size = "md" }: CategoryIconProps) {
  const sizes = {
    sm: { container: "h-7 w-7", emoji: "text-sm", dot: "h-2 w-2" },
    md: { container: "h-9 w-9", emoji: "text-lg", dot: "h-2.5 w-2.5" },
    lg: { container: "h-11 w-11", emoji: "text-xl", dot: "h-3 w-3" },
  };

  const s = sizes[size];

  if (icon) {
    return (
      <div
        className={`${s.container} rounded-xl flex items-center justify-center shrink-0 bg-gray-50`}
      >
        <span className={s.emoji}>{icon}</span>
      </div>
    );
  }

  return (
    <div
      className={`${s.container} rounded-xl flex items-center justify-center shrink-0`}
      // eslint-disable-next-line react/forbid-component-props
      style={{ backgroundColor: (color ?? "#6b7280") + "20" }}
    >
      <div
        className={`${s.dot} rounded-full`}
        // eslint-disable-next-line react/forbid-component-props
        style={{ backgroundColor: color ?? "#6b7280" }}
      />
    </div>
  );
}
