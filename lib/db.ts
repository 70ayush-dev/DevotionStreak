import { getBrowserSupabase } from "@/lib/supabase";
import { dateKeyFromDate, getResolvedTimeZone, parseDateKeyToUTC } from "@/lib/dates";

export type DailyPracticeLog = {
  log_date: string; // YYYY-MM-DD
  count: number;
  updated_at: string;
};

export type ChallengeRow = {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  target_per_day: number;
  timezone: string;
  created_at: string;
};

function requireUserId(user: { id?: string } | null | undefined) {
  const id = user?.id;
  if (!id) throw new Error("Please sign in");
  return id;
}

function dateKeyAddDays(dateKey: string, days: number) {
  const d = parseDateKeyToUTC(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function getTodayKeyFromTz(timeZone?: string) {
  const tz = timeZone ?? getResolvedTimeZone();
  return dateKeyFromDate(new Date(), tz);
}

export async function getMyProfileMinimal() {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const { data: row, error } = await supabase
    .from("profiles")
    .select("display_name,opt_in_global,created_at,onboarding_11x11_prompt_dismissed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!error) return row;

  // Backward-compatible: if the onboarding column doesn't exist yet in DB, retry without it.
  // PostgREST uses 42703 for undefined_column.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (error as any)?.code as string | undefined;
  if (code !== "42703") throw error;

  const { data: row2, error: error2 } = await supabase
    .from("profiles")
    .select("display_name,opt_in_global,created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error2) throw error2;
  return row2;
}

export async function dismiss11x11HomePrompt() {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_11x11_prompt_dismissed_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (!error) return;

  // If the column doesn't exist yet, treat dismiss as a no-op.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (error as any)?.code as string | undefined;
  if (code === "42703") return;
  throw error;
}

export async function getDailyLog(dateKey: string) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const { data: row, error } = await supabase
    .from("daily_practice_logs")
    .select("log_date,count,updated_at")
    .eq("user_id", userId)
    .eq("log_date", dateKey)
    .maybeSingle();
  if (error) throw error;
  return row as DailyPracticeLog | null;
}

export async function upsertDailyLog(dateKey: string, count: number) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const payload = {
    user_id: userId,
    log_date: dateKey,
    count: Math.max(0, Math.trunc(count)),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("daily_practice_logs").upsert(payload, { onConflict: "user_id,log_date" });
  if (error) throw error;
}

export async function fetchDailyLogsRange(fromDateKeyInclusive: string, toDateKeyInclusive: string) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  // PostgREST date comparisons are lexical-safe for YYYY-MM-DD.
  const { data: rows, error } = await supabase
    .from("daily_practice_logs")
    .select("log_date,count,updated_at")
    .eq("user_id", userId)
    .gte("log_date", fromDateKeyInclusive)
    .lte("log_date", toDateKeyInclusive)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return (rows ?? []) as DailyPracticeLog[];
}

export async function getLatestChallengeCovering(dateKey: string) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const { data: rows, error } = await supabase
    .from("challenges")
    .select("id,start_date,end_date,target_per_day,timezone,created_at")
    .eq("user_id", userId)
    .lte("start_date", dateKey)
    .gte("end_date", dateKey)
    .order("start_date", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = rows?.[0] ?? null;
  return row as ChallengeRow | null;
}

export async function start11x11Challenge() {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const tz = getResolvedTimeZone();
  const startKey = getTodayKeyFromTz(tz);
  const endKey = dateKeyAddDays(startKey, 10);

  const payload = {
    user_id: userId,
    start_date: startKey,
    end_date: endKey,
    target_per_day: 11,
    timezone: tz
  };

  const { error } = await supabase.from("challenges").insert(payload);
  if (error) throw error;
  return startKey;
}

export async function restart11x11Challenge() {
  return start11x11Challenge();
}

export async function endActiveChallenge(dateKey: string) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const userId = requireUserId(data.user);

  const active = await getLatestChallengeCovering(dateKey);
  if (!active) return;

  // End by setting end_date to yesterday.
  const yesterday = dateKeyAddDays(dateKey, -1);
  const { error } = await supabase
    .from("challenges")
    .update({ end_date: yesterday })
    .eq("id", active.id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function upsertChallengeDayLog(opts: {
  challengeId: string;
  dateKey: string;
  rawCount: number;
  targetPerDay: number;
  updatedAtISO?: string;
}) {
  const supabase = getBrowserSupabase();
  const counted = Math.min(Math.max(0, Math.trunc(opts.rawCount)), opts.targetPerDay);
  const completed = Math.max(0, Math.trunc(opts.rawCount)) >= opts.targetPerDay;
  const payload = {
    challenge_id: opts.challengeId,
    log_date: opts.dateKey,
    count: counted,
    completed,
    updated_at: opts.updatedAtISO ?? new Date().toISOString()
  };

  const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "challenge_id,log_date" });
  if (error) throw error;
}
