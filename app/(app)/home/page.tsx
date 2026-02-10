"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import ProgressRing from "@/components/ProgressRing";
import ConfettiBurst from "@/components/ConfettiBurst";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import StreakPill from "@/components/StreakPill";
import DuoStreakCard from "@/components/DuoStreakCard";
import Toast from "@/components/Toast";
import BottomSheet from "@/components/BottomSheet";
import { getHomeState, incrementToday, undoToday } from "@/lib/challenge";
import { getMyProfile, upsertMyLeaderboardSnapshots } from "@/lib/leaderboard";
import { dismiss11x11HomePrompt, getMyProfileMinimal, start11x11Challenge } from "@/lib/db";

export default function HomePage() {
  const [state, setState] = useState<Awaited<ReturnType<typeof getHomeState>> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptChecked, setPromptChecked] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const refresh = async () => setState(await getHomeState());

  useEffect(() => {
    refresh();
    (async () => {
      try {
        const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        setReduceMotion(Boolean(media?.matches));
      } catch {
        setReduceMotion(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!state) return;
    if (promptChecked) return;
    setPromptChecked(true);

    (async () => {
      try {
        if (state.challenge11x11) return;
        const profile = await getMyProfileMinimal();
        const dismissedAt = (profile as { onboarding_11x11_prompt_dismissed_at?: string | null } | null)?.onboarding_11x11_prompt_dismissed_at ?? null;
        if (!dismissedAt) setPromptOpen(true);
      } catch {
        // ignore
      }
    })();
  }, [state, promptChecked]);

  const vibrate = () => {
    try {
      // iOS Safari ignores this; that's fine.
      navigator.vibrate?.(10);
    } catch {}
  };

  const onInc = async () => {
    if (!state) return;
    vibrate();
    await incrementToday();
    const next = await getHomeState();
    setState(next);
    setToast("+1 Added");
    if (!reduceMotion && next.challenge11x11 && next.challenge11x11.todayCounted === 11) {
      setBurst(true);
      setTimeout(() => setBurst(false), 1700);
    }
    try {
      const p = await getMyProfile();
      if (p) {
        await upsertMyLeaderboardSnapshots({
          displayName: p.display_name ?? "",
          optInGlobal: Boolean(p.opt_in_global),
          daily: { currentStreak: next.daily.currentStreak, longestStreak: next.daily.longestStreak },
          challenge11x11:
            next.challenge11x11
              ? {
                  startDateKey: next.challenge11x11.startDateKey,
                  completedDays: next.challenge11x11.completedDays,
                  currentStreak: next.challenge11x11.currentStreak
                }
              : undefined
        });
      }
    } catch {
      // ignore (auth optional)
    }
  };

  const onUndo = async () => {
    if (!state) return;
    if (state.today.count <= 0) return;
    vibrate();
    await undoToday();
    const next = await getHomeState();
    setState(next);
    setToast("Last entry removed");
    try {
      const p = await getMyProfile();
      if (p) {
        await upsertMyLeaderboardSnapshots({
          displayName: p.display_name ?? "",
          optInGlobal: Boolean(p.opt_in_global),
          daily: { currentStreak: next.daily.currentStreak, longestStreak: next.daily.longestStreak },
          challenge11x11:
            next.challenge11x11
              ? {
                  startDateKey: next.challenge11x11.startDateKey,
                  completedDays: next.challenge11x11.completedDays,
                  currentStreak: next.challenge11x11.currentStreak
                }
              : undefined
        });
      }
    } catch {
      // ignore
    }
  };

  if (!state) {
    return (
      <main>
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-4 text-sm text-[color:var(--muted)]">
          Loading…
        </div>
      </main>
    );
  }

  const week = state.daily.week;

  return (
    <main>
      <BottomSheet
        open={promptOpen}
        title="Try the 11×11 Challenge"
        onClose={async () => {
          setPromptOpen(false);
          try {
            await dismiss11x11HomePrompt();
          } catch {
            // ignore
          }
        }}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-4">
            <div className="text-sm font-semibold">A focused 11 days</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Daily streak keeps running. The challenge just adds a goal: <span className="font-semibold text-[color:var(--text)]">11 recitations/day</span> for{" "}
              <span className="font-semibold text-[color:var(--text)]">11 days</span>.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <PrimaryButton
              disabled={promptBusy}
              onClick={async () => {
                setPromptBusy(true);
                try {
                  await start11x11Challenge();
                  setPromptOpen(false);
                  await refresh();
                  setToast("11×11 started");
                } finally {
                  setPromptBusy(false);
                }
              }}
            >
              {promptBusy ? "Starting…" : "Start 11×11 now"}
            </PrimaryButton>
            <SecondaryButton
              disabled={promptBusy}
              onClick={async () => {
                setPromptBusy(true);
                try {
                  await dismiss11x11HomePrompt();
                  setPromptOpen(false);
                } finally {
                  setPromptBusy(false);
                }
              }}
            >
              Not now
            </SecondaryButton>
          </div>
        </div>
      </BottomSheet>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-[color:var(--muted)]">Daily practice</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Today</h1>
        </div>
        <StreakPill streak={state.daily.currentStreak} />
      </div>

      <div className="mt-6">
        <DuoStreakCard streakDays={state.daily.currentStreak} days={week} />
      </div>

      {state.challenge11x11 ? (
        <div className="mt-5">
          <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-[color:var(--muted)]">
                  11×11 Challenge {state.challenge11x11.dayIndexToday ? `(Day ${state.challenge11x11.dayIndexToday}/11)` : ""}
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">Progress</div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  Counted today: {state.challenge11x11.todayCounted}/11{" "}
                  {state.today.count > 11 ? "(extra recitations not counted)" : ""}
                </div>
              </div>
              <ProgressRing value={state.challenge11x11.todayCounted} max={11} />
            </div>
            {state.challenge11x11.todayComplete ? (
              <div className="mt-4 rounded-xl border border-[color:var(--line)] bg-white/60 px-4 py-3 text-center">
                <div className="text-sm font-medium">Day Completed</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">Challenge progress recorded.</div>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {!state.challenge11x11 ? (
        <div className="mt-5">
          <Card className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">11×11 Challenge</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">Start anytime. Daily streak continues.</div>
            </div>
            <SecondaryButton
              onClick={() => setPromptOpen(true)}
              className="shrink-0 w-auto h-11 px-4 text-sm"
            >
              Start
            </SecondaryButton>
          </Card>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton onClick={onInc} disabled={false}>
          +1 Recitation
        </PrimaryButton>
        <SecondaryButton onClick={onUndo} disabled={state.today.count === 0}>
          Undo
        </SecondaryButton>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Today</div>
          <div className="mt-1 text-lg font-semibold">{state.today.count}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">{state.today.count >= 1 ? "Done" : "Not done yet"}</div>
        </Card>
        <Card>
          <div className="text-xs text-[color:var(--muted)]">Total recitations</div>
          <div className="mt-1 text-lg font-semibold">{state.daily.totalRecitations}</div>
        </Card>
      </div>

      {burst ? <ConfettiBurst /> : null}
      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}
