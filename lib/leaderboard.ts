import { getBrowserSupabase } from "@/lib/supabase";

function dateKeyToISODate(dateKey: string) {
  // YYYY-MM-DD
  return dateKey;
}

function guessDisplayName(user: { email?: string | null; user_metadata?: unknown }) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = meta.name || meta.full_name || meta.display_name;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const email = user.email ?? "";
  if (email.includes("@")) return email.split("@")[0];
  return "";
}

export async function upsertProfile(opts: { displayName: string; optInGlobal: boolean }) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("Not signed in");

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    display_name: opts.displayName,
    opt_in_global: opts.optInGlobal,
    updated_at: now
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;

  // Keep leaderboard row in sync with opt-in + display name
  const { error: lbErr } = await supabase
    .from("leaderboard_daily")
    .upsert({ user_id: user.id, display_name: opts.displayName, opt_in_global: opts.optInGlobal, updated_at: now }, { onConflict: "user_id" });
  if (lbErr) throw lbErr;
}

export async function getMyProfile() {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("profiles")
    .select("display_name,opt_in_global")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return row ?? null;
}

export async function ensureMyProfileExists() {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const existing = await getMyProfile();

  const existingName = (existing?.display_name ?? "").trim();
  const displayName = existingName || guessDisplayName(user);

  // Product decision: default opt-in for global leaderboard on first sign-in.
  // If a profile exists (user opted out), keep their choice.
  const optInGlobal = existing ? Boolean(existing.opt_in_global) : true;

  // If the DB trigger created a minimal profile (empty name, opt-out default),
  // treat it as "fresh" and apply defaults.
  const shouldApplyDefaults = !existingName && existing?.opt_in_global === false;

  // Upsert is safe (RLS restricts to own row).
  await upsertProfile({ displayName, optInGlobal: shouldApplyDefaults ? true : optInGlobal });
}

export async function upsertMyLeaderboardSnapshots(opts: {
  displayName: string;
  optInGlobal: boolean;
  daily: { currentStreak: number; longestStreak: number };
  challenge11x11?: { startDateKey: string; completedDays: number; currentStreak: number };
}) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const now = new Date().toISOString();

  const { error: dailyErr } = await supabase.from("leaderboard_daily").upsert(
    {
      user_id: user.id,
      display_name: opts.displayName,
      opt_in_global: opts.optInGlobal,
      current_streak: opts.daily.currentStreak,
      longest_streak: opts.daily.longestStreak,
      updated_at: now
    },
    { onConflict: "user_id" }
  );
  if (dailyErr) throw dailyErr;

  if (opts.challenge11x11) {
    const { error: chErr } = await supabase.from("leaderboard_11x11").upsert(
      {
        user_id: user.id,
        challenge_start_date: dateKeyToISODate(opts.challenge11x11.startDateKey),
        display_name: opts.displayName,
        completed_days: opts.challenge11x11.completedDays,
        current_streak: opts.challenge11x11.currentStreak,
        updated_at: now
      },
      { onConflict: "user_id,challenge_start_date" }
    );
    if (chErr) throw chErr;
  }
}

export async function fetchDailyLeaderboard(limit = 50) {
  const supabase = getBrowserSupabase();
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_daily_leaderboard", { lim: limit });
  if (!rpcErr) return rpcData ?? [];

  // Fallback for older DBs: snapshot table.
  const { data, error } = await supabase
    .from("leaderboard_daily")
    .select("display_name,current_streak,longest_streak,updated_at")
    .eq("opt_in_global", true)
    .order("current_streak", { ascending: false })
    .order("longest_streak", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw rpcErr;
  return data ?? [];
}

export async function fetch11x11LeaderboardForCohort(startDateKey: string, limit = 50) {
  const supabase = getBrowserSupabase();
  const start = dateKeyToISODate(startDateKey);

  // Preferred: server-truth aggregation (RPC). If not installed yet, fall back to snapshot table.
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_11x11_leaderboard", {
    cohort_start: start,
    lim: limit
  });
  if (!rpcErr) return rpcData ?? [];

  const { data, error } = await supabase
    .from("leaderboard_11x11")
    .select("display_name,completed_days,current_streak,updated_at,challenge_start_date")
    .eq("challenge_start_date", start)
    .order("completed_days", { ascending: false })
    .order("current_streak", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw rpcErr; // surface the real/root error
  return data ?? [];
}
