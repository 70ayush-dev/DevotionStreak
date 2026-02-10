"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResolvedTimeZone } from "@/lib/dates";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import Card from "@/components/Card";
import { getBrowserSupabase } from "@/lib/supabase";
import Toast from "@/components/Toast";
import { start11x11Challenge } from "@/lib/db";

export default function LandingPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tz, setTz] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Avoid server/client mismatch: compute timezone only on client after mount.
      if (cancelled) return;
    })();
    try {
      setTz(getResolvedTimeZone());
    } catch {
      setTz(null);
    }
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        setUserEmail(data.user?.email ?? null);
      } catch {
        // Auth is optional; ignore missing env or other failures.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onStart = async () => {
    setStarting(true);
    try {
      await start11x11Challenge();
      router.push("/home");
    } finally {
      setStarting(false);
    }
  };

  const onStartDaily = async () => {
    router.push("/home");
  };

  const onContinue = () => router.push("/home");

  const onGoogle = async () => {
    setAuthLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Google sign-in failed";
      setToast(message);
      setAuthLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8">
        <div className="text-sm text-[color:var(--muted)]">Hanuman Chalisa</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">11×11 Challenge</h1>
        <p className="mt-3 text-base leading-relaxed text-[color:var(--muted)]">
          Two modes: a{" "}
          <span className="font-medium text-[color:var(--text)]">Daily Streak</span> for simple consistency, and the{" "}
          <span className="font-medium text-[color:var(--text)]">11×11 Challenge</span> for{" "}
          <span className="font-medium text-[color:var(--text)]">11 recitations/day</span>, for{" "}
          <span className="font-medium text-[color:var(--text)]">11 days</span>. Synced to your account.
        </p>
      </div>

      <Card>
        <div className="text-sm text-[color:var(--muted)]">Goal</div>
        <div className="mt-1 text-lg font-medium">11/day for 11 days</div>
        <div className="mt-3 text-xs text-[color:var(--muted)]" suppressHydrationWarning>
          Timezone: {tz ?? "—"}
        </div>
        {userEmail ? <div className="mt-2 text-xs text-[color:var(--muted)]">Signed in: {userEmail}</div> : null}
        <div className="mt-6 flex flex-col gap-3">
          <PrimaryButton disabled={starting || !userEmail} onClick={onStart}>
            {starting ? "Starting..." : "Start 11×11 Challenge"}
          </PrimaryButton>
          <SecondaryButton disabled={!userEmail} onClick={onStartDaily}>
            Start Daily Streak
          </SecondaryButton>
          <SecondaryButton disabled={authLoading} onClick={onGoogle}>
            {authLoading ? "Opening Google..." : "Continue with Google"}
          </SecondaryButton>
          {userEmail ? (
            <SecondaryButton onClick={onContinue}>
              Continue
            </SecondaryButton>
          ) : (
            <SecondaryButton disabled className="opacity-60">
              Continue
            </SecondaryButton>
          )}
        </div>
      </Card>

      <div className="mt-6 text-xs leading-relaxed text-[color:var(--muted)]">
        Login is required. Your streaks are stored in Supabase.
      </div>

      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}
