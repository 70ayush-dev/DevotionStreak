"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

export default function EnsureAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user && pathname !== "/") {
          router.replace("/");
          setOk(false);
          return;
        }
        setOk(true);

        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          if (cancelled) return;
          if (!session?.user && pathname !== "/") {
            router.replace("/");
            setOk(false);
            return;
          }
          setOk(true);
        });
        unsubscribe = () => sub.subscription.unsubscribe();
      } catch {
        if (cancelled) return;
        if (pathname !== "/") router.replace("/");
        setOk(false);
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}
