import Card from "@/components/Card";

type Badge = {
  key: string;
  title: string;
  desc: string;
  earned: (completedDays: number) => boolean;
};

const badges: Badge[] = [
  { key: "start", title: "Start", desc: "You began the journey.", earned: (d) => d >= 1 },
  { key: "consistency", title: "Consistency", desc: "3 days completed.", earned: (d) => d >= 3 },
  { key: "halfway", title: "Halfway", desc: "6 days completed.", earned: (d) => d >= 6 },
  { key: "devotion", title: "Devotion", desc: "11 days completed.", earned: (d) => d >= 11 }
];

export default function BadgeGrid({ completedDays }: { completedDays: number }) {
  return (
    <Card>
      <div className="mb-3 text-sm font-semibold">Badges</div>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => {
          const ok = b.earned(completedDays);
          return (
            <div
              key={b.key}
              className={[
                "rounded-2xl border border-[color:var(--line)] bg-white/65 p-4",
                ok ? "" : "opacity-55"
              ].join(" ")}
            >
              <div className="text-sm font-semibold">{b.title}</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">{b.desc}</div>
              <div className="mt-3 text-xs font-medium" style={{ color: ok ? "var(--ok)" : "var(--muted)" }}>
                {ok ? "Earned" : "Not yet"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

