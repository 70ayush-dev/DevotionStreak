"use client";

import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import { ensureMyProfileExists } from "@/lib/leaderboard";

export default function AuthBootstrap() {
  useEffect(() => {
    try {
      const supabase = getBrowserSupabase();

      // Run once on load (if already signed in)
      ensureMyProfileExists().catch(() => undefined);

      const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
        if (evt === "SIGNED_IN") {
          ensureMyProfileExists().catch(() => undefined);
        }
      });

      return () => sub.subscription.unsubscribe();
    } catch {
      // Auth/env optional
    }
  }, []);

  return null;
}
