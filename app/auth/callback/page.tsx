import { Suspense } from "react";
import AuthCallbackClient from "@/app/auth/callback/AuthCallbackClient";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-[color:var(--muted)]">Signing you in</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Auth</h1>
      </div>
      <Suspense fallback={<div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-5">Loading…</div>}>
        <AuthCallbackClient />
      </Suspense>
    </main>
  );
}

