"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/Card";
import { getBrowserSupabase } from "@/lib/supabase";

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const code = params.get("code");
        const errorDesc = params.get("error_description");

        if (errorDesc) {
          setError(errorDesc);
          return;
        }

        if (code) {
          // auth-js expects the code string, not the full URL.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        if (cancelled) return;
        router.replace("/home");
      } catch (e: unknown) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Authentication failed";
        setError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, params]);

  return (
    <Card>
      {error ? (
        <div>
          <div className="text-sm font-semibold">Could not sign in</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">{error}</div>
          <div className="mt-4 text-xs text-[color:var(--muted)]">
            Check Google OAuth redirect URI and Supabase URL Configuration allowlist.
          </div>
        </div>
      ) : (
        <div className="text-sm text-[color:var(--muted)]">Please wait…</div>
      )}
    </Card>
  );
}
