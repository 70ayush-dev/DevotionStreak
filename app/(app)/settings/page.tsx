"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { SecondaryButton } from "@/components/Buttons";
import { getResolvedTimeZone } from "@/lib/dates";
import { getBrowserSupabase } from "@/lib/supabase";
import { getMyProfile, upsertMyLeaderboardSnapshots, upsertProfile } from "@/lib/leaderboard";
import { getHomeState } from "@/lib/challenge";
import { endActiveChallenge, getLatestChallengeCovering, getTodayKeyFromTz, restart11x11Challenge, start11x11Challenge } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tz, setTz] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [optInGlobal, setOptInGlobal] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [challengeActive, setChallengeActive] = useState<boolean>(false);
  const [challengeStart, setChallengeStart] = useState<string | null>(null);
  const [challengeBusy, setChallengeBusy] = useState(false);

  useEffect(() => {
    try {
      setTz(getResolvedTimeZone());
    } catch {
      setTz(null);
    }

    // Optional: auth status
    try {
      const supabase = getBrowserSupabase();
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null);
        setAuthReady(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setUserEmail(session?.user?.email ?? null);
      });
      return () => sub.subscription.unsubscribe();
    } catch {
      setAuthReady(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tz = getResolvedTimeZone();
        const todayKey = getTodayKeyFromTz(tz);
        const ch = await getLatestChallengeCovering(todayKey);
        setChallengeActive(Boolean(ch));
        setChallengeStart(ch?.start_date ?? null);
      } catch {
        setChallengeActive(false);
        setChallengeStart(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!authReady) return;
      if (!userEmail) return;
      try {
        const p = await getMyProfile();
        if (p) {
          setDisplayName(p.display_name ?? "");
          setOptInGlobal(Boolean(p.opt_in_global));
        }
      } catch {
        // ignore
      }
    })();
  }, [authReady, userEmail]);

  const onStartChallenge = async () => {
    setChallengeBusy(true);
    try {
      await start11x11Challenge();
      const tz = getResolvedTimeZone();
      const todayKey = getTodayKeyFromTz(tz);
      const ch = await getLatestChallengeCovering(todayKey);
      setChallengeActive(Boolean(ch));
      setChallengeStart(ch?.start_date ?? null);
    } finally {
      setChallengeBusy(false);
    }
  };

  const onRestartChallenge = async () => {
    const ok = confirm("Restart 11×11 challenge? This creates a new cohort start date (your daily logs are kept).");
    if (!ok) return;
    setChallengeBusy(true);
    try {
      await restart11x11Challenge();
      const tz = getResolvedTimeZone();
      const todayKey = getTodayKeyFromTz(tz);
      const ch = await getLatestChallengeCovering(todayKey);
      setChallengeActive(Boolean(ch));
      setChallengeStart(ch?.start_date ?? null);
    } finally {
      setChallengeBusy(false);
    }
  };

  const onEndChallenge = async () => {
    const ok = confirm("End 11×11 challenge? Your daily practice logs will be kept.");
    if (!ok) return;
    setChallengeBusy(true);
    try {
      const tz = getResolvedTimeZone();
      const todayKey = getTodayKeyFromTz(tz);
      await endActiveChallenge(todayKey);
      const ch = await getLatestChallengeCovering(todayKey);
      setChallengeActive(Boolean(ch));
      setChallengeStart(ch?.start_date ?? null);
    } finally {
      setChallengeBusy(false);
    }
  };

  const onSignOut = async () => {
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
      setUserEmail(null);
    } catch {}
    router.replace("/");
  };

  const onSaveProfile = async () => {
    setProfileBusy(true);
    try {
      await upsertProfile({ displayName, optInGlobal });
      // Also publish current leaderboard snapshot immediately.
      const snapshot = await getHomeState();
      await upsertMyLeaderboardSnapshots({
        displayName,
        optInGlobal,
        daily: { currentStreak: snapshot.daily.currentStreak, longestStreak: snapshot.daily.longestStreak },
        challenge11x11:
          snapshot.challenge11x11
            ? {
                startDateKey: snapshot.challenge11x11.startDateKey,
                completedDays: snapshot.challenge11x11.completedDays,
                currentStreak: snapshot.challenge11x11.currentStreak
              }
            : undefined
      });
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <main>
      <div>
        <div className="text-sm text-[color:var(--muted)]">Account</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="mt-5 space-y-3">
        <Card>
          <div className="text-sm font-medium">11×11 Challenge</div>
          <div className="mt-2 text-xs text-[color:var(--muted)]">
            Status: {challengeActive ? `Active (start: ${challengeStart ?? "—"})` : "Not active"}
          </div>
          <div className="mt-4 grid gap-3">
            <SecondaryButton onClick={onStartChallenge} disabled={challengeBusy || challengeActive}>
              {challengeBusy ? "Working..." : "Start 11×11"}
            </SecondaryButton>
            <SecondaryButton onClick={onRestartChallenge} disabled={challengeBusy || !challengeActive}>
              {challengeBusy ? "Working..." : "Restart 11×11"}
            </SecondaryButton>
            <SecondaryButton onClick={onEndChallenge} disabled={challengeBusy || !challengeActive}>
              {challengeBusy ? "Working..." : "End 11×11"}
            </SecondaryButton>
          </div>
          <div className="mt-4 text-xs text-[color:var(--muted)]">
            Daily streak runs independently and is never disabled.
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium">Account</div>
          <div className="mt-2 text-xs text-[color:var(--muted)]">
            {authReady ? (userEmail ? `Signed in as ${userEmail}` : "Not signed in") : "Auth not configured"}
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Display name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Anonymous"
                className="h-11 w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-3 text-sm"
                disabled={!userEmail}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Opt in to Global Leaderboard</span>
              <input
                type="checkbox"
                checked={optInGlobal}
                onChange={(e) => setOptInGlobal(e.target.checked)}
                className="h-5 w-5"
                disabled={!userEmail}
              />
            </label>
            <SecondaryButton onClick={onSaveProfile} disabled={!userEmail || profileBusy}>
              {profileBusy ? "Saving..." : "Save profile"}
            </SecondaryButton>
          </div>
          <div className="mt-4">
            <SecondaryButton onClick={onSignOut} disabled={!userEmail}>
              Sign out
            </SecondaryButton>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium">About</div>
          <div className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
            Timezone: <span suppressHydrationWarning>{tz ?? "—"}</span>. Your streaks are stored in Supabase.
          </div>
        </Card>
      </div>
    </main>
  );
}
