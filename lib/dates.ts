export function getResolvedTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function dateKeyFromDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  const y = get("year");
  const m = get("month");
  const d = get("day");
  if (!y || !m || !d) throw new Error("Failed to format date parts");
  return `${y}-${m}-${d}`;
}

export function parseDateKeyToUTC(dateKey: string) {
  // Use noon UTC to avoid DST edge cases when diffing civil dates.
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function diffDays(aDateKey: string, bDateKey: string) {
  const a = parseDateKeyToUTC(aDateKey).getTime();
  const b = parseDateKeyToUTC(bDateKey).getTime();
  return Math.round((a - b) / 86400000);
}

