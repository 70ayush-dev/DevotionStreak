"use client";

export default function DayTile({
  dayIndex,
  label,
  count,
  target,
  onClick
}: {
  dayIndex: number;
  label?: string;
  count: number;
  target: number;
  onClick: () => void;
}) {
  const done = count >= target;
  return (
    <button
      onClick={onClick}
      className={[
        "h-20 rounded-2xl border border-[color:var(--line)] bg-white/65 p-3 text-left",
        "active:scale-[0.98]"
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-[color:var(--muted)]">{label ?? `Day ${dayIndex}`}</div>
        <div className={["text-xs font-semibold", done ? "text-[color:var(--ok)]" : "text-[color:var(--muted)]"].join(" ")}>
          {done ? "✓" : ""}
        </div>
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight">
        {count}/{target}
      </div>
    </button>
  );
}
