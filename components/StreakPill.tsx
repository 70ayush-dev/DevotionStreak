export default function StreakPill({ streak }: { streak: number }) {
  return (
    <div className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
      Streak: <span className="text-[color:var(--text)]">{streak}</span>
    </div>
  );
}

