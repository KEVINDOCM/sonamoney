const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return SHORT_DATE_FORMATTER.format(date);
}

export function formatLongDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return LONG_DATE_FORMATTER.format(date);
}

