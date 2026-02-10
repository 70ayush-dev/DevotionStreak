"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import { SecondaryButton } from "@/components/Buttons";
import { fetch11x11LeaderboardForCohort, fetchDailyLeaderboard } from "@/lib/leaderboard";
import { getLatestChallengeCovering, getTodayKeyFromTz } from "@/lib/db";
import { getResolvedTimeZone } from "@/lib/dates";

type Tab = "daily" | "challenge";

type DailyRow = {
  display_name: string;
  current_streak: number;
  longest_streak: number;
  updated_at: string;
};

type ChallengeRow = {
  display_name: string;
  completed_days: number;
  current_streak: number;
  updated_at: string;
  challenge_start_date: string;
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [daily, setDaily] = useState<DailyRow[] | null>(null);
  const [challengeRows, setChallengeRows] = useState<ChallengeRow[] | null>(null);
  const [challengeStart, setChallengeStart] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setErr(null);
    try {
      const d = await fetchDailyLeaderboard(50);
      setDaily(d);

      const tz = getResolvedTimeZone();
      const todayKey = getTodayKeyFromTz(tz);
      const ch = await getLatestChallengeCovering(todayKey);
      const startKey = ch?.start_date ?? null;
      if (startKey) {
        setChallengeStart(startKey);
        const rows = await fetch11x11LeaderboardForCohort(startKey, 50);
        setChallengeRows(rows);
      } else {
        setChallengeStart(null);
        setChallengeRows([]);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load leaderboards");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const title = useMemo(() => {
    if (tab === "daily") return "Global Daily Streak";
    return "11×11 Challenge (Cohort)";
  }, [tab]);

  return (
    <main>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-[color:var(--muted)]">Leaderboards</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            className={[
              "h-11 rounded-2xl px-4 text-sm font-semibold border",
              tab === "daily" ? "bg-white/80 border-[color:var(--line)]" : "bg-transparent border-transparent text-[color:var(--muted)]"
            ].join(" ")}
            onClick={() => setTab("daily")}
          >
            Daily
          </button>
          <button
            className={[
              "h-11 rounded-2xl px-4 text-sm font-semibold border",
              tab === "challenge" ? "bg-white/80 border-[color:var(--line)]" : "bg-transparent border-transparent text-[color:var(--muted)]"
            ].join(" ")}
            onClick={() => setTab("challenge")}
          >
            11×11
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4">
          <Card>
            <div className="text-sm font-semibold">Could not load</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">{err}</div>
            <div className="mt-4">
              <SecondaryButton onClick={refresh}>Retry</SecondaryButton>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "daily" ? (
        <div className="mt-5">
          <Card>
            <div className="text-xs text-[color:var(--muted)]">Opt-in only. Sorted by current streak.</div>
            <div className="mt-4 space-y-3">
              {(daily ?? []).map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-white/65 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {i + 1}. {r.display_name || "Anonymous"}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">Best: {r.longest_streak}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[color:var(--accent)]">{r.current_streak}</div>
                    <div className="text-[11px] font-semibold text-[color:var(--muted)]">days</div>
                  </div>
                </div>
              ))}
              {daily && daily.length === 0 ? <div className="text-sm text-[color:var(--muted)]">No entries yet.</div> : null}
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-5">
          <Card>
            <div className="text-xs text-[color:var(--muted)]">
              Cohort: {challengeStart ?? "Start an 11×11 challenge to join this leaderboard."}
            </div>
            <div className="mt-4 space-y-3">
              {(challengeRows ?? []).map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-white/65 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {i + 1}. {r.display_name || "Anonymous"}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">Streak: {r.current_streak}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[color:var(--accent)]">{r.completed_days}</div>
                    <div className="text-[11px] font-semibold text-[color:var(--muted)]">days</div>
                  </div>
                </div>
              ))}
              {challengeRows && challengeRows.length === 0 ? <div className="text-sm text-[color:var(--muted)]">No entries yet.</div> : null}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
