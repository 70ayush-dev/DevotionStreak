"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import BadgeGrid from "@/components/BadgeGrid";
import { getHomeState } from "@/lib/challenge";

export default function StatsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getHomeState>> | null>(null);

  useEffect(() => {
    (async () => {
      setData(await getHomeState());
    })();
  }, []);

  if (!data) {
    return (
      <main>
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-4 text-sm text-[color:var(--muted)]">
          Loading…
        </div>
      </main>
    );
  }
  const ch = data.challenge11x11;

  return (
    <main>
      <div>
        <div className="text-sm text-[color:var(--muted)]">Streaks and blessings</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Stats</h1>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Current streak</div>
          <div className="mt-1 text-2xl font-semibold">{data.daily.currentStreak}</div>
        </Card>
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Longest streak</div>
          <div className="mt-1 text-2xl font-semibold">{data.daily.longestStreak}</div>
        </Card>
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Total recitations</div>
          <div className="mt-1 text-2xl font-semibold">{data.daily.totalRecitations}</div>
        </Card>
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Today</div>
          <div className="mt-1 text-2xl font-semibold">{data.today.count}</div>
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <div className="text-sm font-medium">11×11 Challenge</div>
          {ch ? (
            <>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[color:var(--line)] bg-white/60 px-4 py-3">
                  <div className="text-xs text-[color:var(--muted)]">Completed days</div>
                  <div className="mt-1 text-lg font-semibold">{ch.completedDays}/11</div>
                </div>
                <div className="rounded-xl border border-[color:var(--line)] bg-white/60 px-4 py-3">
                  <div className="text-xs text-[color:var(--muted)]">Challenge streak</div>
                  <div className="mt-1 text-lg font-semibold">{ch.currentStreak}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-[color:var(--muted)]">Counted total: {ch.totalCounted}/121 (caps at 11/day)</div>
              <div className="mt-5">
                <BadgeGrid completedDays={ch.completedDays} />
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-[color:var(--muted)]">Not started yet. You can run Daily and 11×11 in parallel.</div>
          )}
        </Card>
      </div>
    </main>
  );
}
