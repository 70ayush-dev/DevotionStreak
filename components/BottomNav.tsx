 "use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/home", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/stats", label: "Stats" },
  { href: "/leaderboard", label: "Leaders" },
  { href: "/settings", label: "Settings" }
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const doPrefetch = () => {
      for (const t of tabs) {
        if (t.href !== pathname) router.prefetch(t.href);
      }
    };
    // Let interaction settle first; prefetch in idle time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ric = (globalThis as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    if (typeof ric === "function") {
      const id = ric(doPrefetch);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cancel = (globalThis as any).cancelIdleCallback as ((id: number) => void) | undefined;
        cancel?.(id);
      };
    }
    const t = setTimeout(doPrefetch, 250);
    return () => clearTimeout(t);
  }, [router, pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
      <div className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-2 shadow-soft backdrop-blur">
        <div className="grid grid-cols-5">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className={[
                "flex h-12 items-center justify-center rounded-xl text-sm font-medium active:scale-[0.98] transition-colors",
                pathname === t.href ? "text-[color:var(--text)] bg-white/70" : "text-[color:var(--muted)] hover:bg-white/40"
              ].join(" ")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
