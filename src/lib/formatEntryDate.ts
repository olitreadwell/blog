const displayDateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const machineDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

/**
 * Formats an entry date for readers, for example `24 September 2026`.
 *
 * Dates come from front matter as UTC midnight, so the formatter pins the
 * time zone. Without that, a New Zealand build shows the previous day.
 */
export function formatEntryDate(date: Date): string {
  return displayDateFormatter.format(date);
}

/** Formats an entry date for feeds and `datetime` attributes as `2026-09-24`. */
export function formatEntryDateMachine(date: Date): string {
  return machineDateFormatter.format(date);
}
