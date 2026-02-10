"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { PrimaryButton } from "@/components/Buttons";
import { getHomeState } from "@/lib/challenge";

export default function CertificatePage() {
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
  const completed = Boolean(ch && ch.completedDays >= 11);

  return (
    <main>
      <div>
        <div className="text-sm text-[color:var(--muted)]">11×11</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Certificate</h1>
      </div>

      <div className="mt-5">
        <Card>
          {ch ? (
            <div className="text-center">
              <div className="text-xs text-[color:var(--muted)]">{completed ? "Challenge completed" : "In progress"}</div>
              <div className="mt-1 text-3xl font-semibold">{ch.completedDays}/11</div>
              <div className="mt-4 text-xs text-[color:var(--muted)]">Counted total</div>
              <div className="mt-1 text-2xl font-semibold">{ch.totalCounted}/121</div>
              <div className="mt-4 text-xs text-[color:var(--muted)]">Challenge streak</div>
              <div className="mt-1 text-2xl font-semibold">{ch.currentStreak}</div>
              {!completed ? (
                <div className="mt-4 text-xs text-[color:var(--muted)]">Complete all 11 days to earn the certificate.</div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold">Certificate is for 11×11 mode</div>
              <div className="mt-2 text-sm text-[color:var(--muted)]">
                Start an 11×11 challenge to earn the completion certificate. Daily streak can still run in parallel.
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={() => (location.href = "/home")}>Back to home</PrimaryButton>
      </div>
    </main>
  );
}
