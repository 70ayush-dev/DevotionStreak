import { dateKeyFromDate, getResolvedTimeZone, parseDateKeyToUTC } from "@/lib/dates";
import { fetchDailyLogsRange, getDailyLog, getLatestChallengeCovering, getTodayKeyFromTz, upsertChallengeDayLog, upsertDailyLog } from "@/lib/db";

function dateKeyAddDays(dateKey: string, days: number) {
  const d = parseDateKeyToUTC(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function getTodayKey(timeZone?: string) {
  const tz = timeZone ?? getResolvedTimeZone();
  return dateKeyFromDate(new Date(), tz);
}

type LocalLog = { dateKey: string; count: number; updatedAt: number };

function computeDailyStreak(logsByKey: Map<string, LocalLog>, endKey: string) {
  let streak = 0;
  let cursor = endKey;
  while (true) {
    const c = Math.max(0, logsByKey.get(cursor)?.count ?? 0);
    if (c < 1) break;
    streak += 1;
    cursor = dateKeyAddDays(cursor, -1);
  }
  return streak;
}

function computeLongestDailyStreak(logsByKey: Map<string, LocalLog>, endKey: string, windowDays = 180) {
  let run = 0;
  let best = 0;
  let cursor = dateKeyAddDays(endKey, -(windowDays - 1));
  for (let i = 0; i < windowDays; i++) {
    const done = (logsByKey.get(cursor)?.count ?? 0) >= 1;
    run = done ? run + 1 : 0;
    best = Math.max(best, run);
    cursor = dateKeyAddDays(cursor, 1);
  }
  return best;
}

function computeWeek(logsByKey: Map<string, LocalLog>, tz: string, todayKey: string) {
  const fmt = new Intl.DateTimeFormat("en", { timeZone: tz, weekday: "short" });
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const label = fmt.format(d).slice(0, 2);
    const key = dateKeyFromDate(d, tz);
    const done = (logsByKey.get(key)?.count ?? 0) >= 1;
    return { label, done, isToday: key === todayKey };
  });
}

function computeDailyHistory(logsByKey: Map<string, LocalLog>, tz: string, todayKey: string) {
  // Last 14 days, oldest -> newest
  return Array.from({ length: 14 }, (_, i) => {
    const dateKey = dateKeyAddDays(todayKey, -(13 - i));
    const count = Math.max(0, logsByKey.get(dateKey)?.count ?? 0);
    return { dayIndex: i + 1, dateKey, count, completed: count >= 1 };
  });
}

function compute11x11(opts: { startDateKey: string; days: number; targetPerDay: number }, logsByKey: Map<string, LocalLog>, todayKey: string) {
  const ch = opts;

  const days = Array.from({ length: ch.days }, (_, i) => {
    const dayIndex = i + 1;
    const dateKey = dateKeyAddDays(ch.startDateKey, i);
    const raw = Math.max(0, logsByKey.get(dateKey)?.count ?? 0);
    const counted = Math.min(raw, ch.targetPerDay);
    const completed = raw >= ch.targetPerDay;
    return { dayIndex, dateKey, rawCount: raw, counted, completed };
  });

  const completedDays = days.filter((d) => d.completed).length;
  const totalCounted = days.reduce((s, d) => s + d.counted, 0);

  // Current streak within the 11-day window, ending at today if today in window else ending at last window day <= today.
  const todayIdx = days.findIndex((d) => d.dateKey === todayKey);
  const endIdx = todayIdx >= 0 ? todayIdx : days.length - 1;

  let currentStreak = 0;
  for (let i = endIdx; i >= 0; i--) {
    if (!days[i].completed) break;
    currentStreak += 1;
  }

  const dayIndexToday = todayIdx >= 0 ? todayIdx + 1 : null;
  const todayRaw = todayIdx >= 0 ? days[todayIdx].rawCount : Math.max(0, logsByKey.get(todayKey)?.count ?? 0);
  const todayCounted = Math.min(todayRaw, ch.targetPerDay);
  const todayComplete = todayRaw >= ch.targetPerDay;

  return {
    startDateKey: ch.startDateKey,
    daysTotal: ch.days,
    targetPerDay: ch.targetPerDay,
    dayIndexToday,
    todayRaw,
    todayCounted,
    todayComplete,
    completedDays,
    currentStreak,
    totalCounted,
    window: days
  };
}

export async function getHomeState() {
  const tz = getResolvedTimeZone();
  const todayKey = getTodayKeyFromTz(tz);

  const log = await getDailyLog(todayKey);
  const today = { dateKey: todayKey, count: Math.max(0, log?.count ?? 0), updatedAt: log ? Date.parse(log.updated_at) : Date.now() };

  const fromKey = dateKeyAddDays(todayKey, -179);
  const rows = await fetchDailyLogsRange(fromKey, todayKey);
  const logs: LocalLog[] = rows.map((r) => ({ dateKey: r.log_date, count: Math.max(0, r.count), updatedAt: Date.parse(r.updated_at) }));
  const logsByKey = new Map(logs.map((l) => [l.dateKey, l]));

  const dailyCurrentStreak = computeDailyStreak(logsByKey, todayKey);
  const dailyLongestStreak = computeLongestDailyStreak(logsByKey, todayKey);
  const totalRecitations = logs.reduce((s, l) => s + Math.max(0, l.count), 0);

  const week = computeWeek(logsByKey, tz, todayKey);
  const ch = await getLatestChallengeCovering(todayKey);
  const challenge11x11 = ch ? compute11x11({ startDateKey: ch.start_date, days: 11, targetPerDay: ch.target_per_day }, logsByKey, todayKey) : null;

  return {
    today,
    daily: {
      currentStreak: dailyCurrentStreak,
      longestStreak: dailyLongestStreak,
      totalRecitations,
      week
    },
    challenge11x11
  };
}

export async function getHistoryState() {
  const tz = getResolvedTimeZone();
  const todayKey = getTodayKeyFromTz(tz);
  const fromKey = dateKeyAddDays(todayKey, -179);
  const rows = await fetchDailyLogsRange(fromKey, todayKey);
  const logs: LocalLog[] = rows.map((r) => ({ dateKey: r.log_date, count: Math.max(0, r.count), updatedAt: Date.parse(r.updated_at) }));
  const logsByKey = new Map(logs.map((l) => [l.dateKey, l]));

  const dailyDays = computeDailyHistory(logsByKey, tz, todayKey);
  const ch = await getLatestChallengeCovering(todayKey);
  const challenge11x11 = ch ? compute11x11({ startDateKey: ch.start_date, days: 11, targetPerDay: ch.target_per_day }, logsByKey, todayKey) : null;

  return { state: { timeZone: tz }, todayKey, dailyDays, challenge11x11 };
}

export async function incrementToday() {
  const tz = getResolvedTimeZone();
  const key = getTodayKeyFromTz(tz);
  const log = await getDailyLog(key);
  const nextCount = Math.max(0, (log?.count ?? 0) + 1);
  await upsertDailyLog(key, nextCount);

  const ch = await getLatestChallengeCovering(key);
  if (ch) {
    await upsertChallengeDayLog({ challengeId: ch.id, dateKey: key, rawCount: nextCount, targetPerDay: ch.target_per_day });
  }
}

export async function undoToday() {
  const tz = getResolvedTimeZone();
  const key = getTodayKeyFromTz(tz);
  const log = await getDailyLog(key);
  const nextCount = Math.max(0, (log?.count ?? 0) - 1);
  await upsertDailyLog(key, nextCount);

  const ch = await getLatestChallengeCovering(key);
  if (ch) {
    await upsertChallengeDayLog({ challengeId: ch.id, dateKey: key, rawCount: nextCount, targetPerDay: ch.target_per_day });
  }
}
