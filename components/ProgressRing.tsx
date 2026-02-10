"use client";

import { motion } from "framer-motion";

export default function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, max <= 0 ? 0 : value / max));
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const rest = c - dash;

  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full">
        <circle cx="70" cy="70" r={r} stroke="rgba(36,18,11,0.12)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          stroke="url(#grad)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${rest}`}
          initial={false}
          animate={{ strokeDasharray: `${dash} ${rest}` }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          transform="rotate(-90 70 70)"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d47b12" />
            <stop offset="100%" stopColor="#8a1f1a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold tracking-tight">
          {value}/{max}
        </div>
        <div className="mt-1 text-xs text-[color:var(--muted)]">Today</div>
      </div>
    </div>
  );
}

