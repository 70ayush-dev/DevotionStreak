"use client";

import Card from "@/components/Card";

type Day = { label: string; done: boolean; isToday: boolean };

export default function DuoStreakCard({
  streakDays,
  days
}: {
  streakDays: number;
  days: Day[];
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[52px] leading-none font-extrabold tracking-tight text-[color:var(--accent)]">
              {streakDays}
            </div>
            <div className="mt-1 text-base font-semibold">day streak!</div>
          </div>
          <div className="text-xs text-[color:var(--muted)] text-right leading-relaxed">
            Keep it calm.
            <br />
            One recitation counts.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d.label} className="text-center">
              <div className="mb-2 text-[11px] font-semibold text-[color:var(--muted)]">{d.label}</div>
              <div
                className={[
                  "mx-auto h-9 w-9 rounded-full border flex items-center justify-center",
                  d.done
                    ? "bg-[color:var(--accent-2)] border-transparent text-white"
                    : "bg-white/65 border-[color:var(--line)] text-[color:var(--muted)]",
                  d.isToday ? "ring-2 ring-[color:var(--accent)] ring-offset-2 ring-offset-[color:var(--bg)]" : ""
                ].join(" ")}
                aria-label={d.done ? "Done" : "Not done"}
              >
                {d.done ? "✓" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] bg-white/55 px-5 py-3 text-xs text-[color:var(--muted)]">
        Early bird: try a consistent time each day.
      </div>
    </Card>
  );
}

