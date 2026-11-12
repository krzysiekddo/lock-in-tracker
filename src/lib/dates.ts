// Dates are stored as local calendar keys (YYYY-MM-DD), so a workout never jumps a day with time zones.

export const WEEKDAYS = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
export const WEEKDAYS_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: string): number {
  return (fromKey(key).getDay() + 6) % 7;
}

export function weekStart(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

export function weekDays(key: string): string[] {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayNumber(key: string): number {
  return fromKey(key).getDate();
}

const longFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });

/** "czwartek, 12 listopada" */
export function formatLong(key: string): string {
  return longFmt.format(fromKey(key));
}

/** "12 lis" */
export function formatShort(key: string): string {
  return shortFmt.format(fromKey(key));
}

export function relativeLabel(key: string, today: string): string {
  if (key === today) return "Dziś";
  if (key === addDays(today, -1)) return "Wczoraj";
  if (key === addDays(today, 1)) return "Jutro";
  return WEEKDAYS[weekdayIndex(key)];
}
