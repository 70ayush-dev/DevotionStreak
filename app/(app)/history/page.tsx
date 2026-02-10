"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import DayTile from "@/components/DayTile";
import BottomSheet from "@/components/BottomSheet";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { getHistoryState, incrementToday, undoToday } from "@/lib/challenge";
import Toast from "@/components/Toast";
import { fetchDailyLogsRange, getMyProfileMinimal } from "@/lib/db";
import { dateKeyFromDate, getResolvedTimeZone, parseDateKeyToUTC } from "@/lib/dates";

type Tab = "daily" | "challenge11x11";

function daysInMonthUTC(year: number, month1: number) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate(); // month1 is 1-based
}

function monthFromDateKey(dateKey: string) {
  const [y, m] = dateKey.split("-").slice(0, 2).map((n) => Number(n));
  return { y, m };
}

function cmpMonth(a: { y: number; m: number }, b: { y: number; m: number }) {
  if (a.y !== b.y) return a.y - b.y;
  return a.m - b.m;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [data, setData] = useState<Awaited<ReturnType<typeof getHistoryState>> | null>(null);
  const [dailyLogCounts, setDailyLogCounts] = useState<Record<string, number>>({});
  const [cursorMonth, setCursorMonth] = useState<{ y: number; m: number } | null>(null);
  const [minMonth, setMinMonth] = useState<{ y: number; m: number } | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadMonth = async (y: number, m: number) => {
    const monthStr = String(m).padStart(2, "0");
    const startKey = `${y}-${monthStr}-01`;
    const endKey = `${y}-${monthStr}-${String(daysInMonthUTC(y, m)).padStart(2, "0")}`;
    const rows = await fetchDailyLogsRange(startKey, endKey);
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.log_date] = Math.max(0, r.count);
    setDailyLogCounts(counts);
  };

  const refresh = async () => {
    const tz = getResolvedTimeZone();
    const next = await getHistoryState();
    setData(next);

    const p = await getMyProfileMinimal();
    const createdAt = p?.created_at ? new Date(p.created_at) : new Date();
    const startedKey = dateKeyFromDate(createdAt, tz);
    setMinMonth(monthFromDateKey(startedKey));

    if (!cursorMonth) {
      const month = monthFromDateKey(next.todayKey);
      setCursorMonth(month);
      await loadMonth(month.y, month.m);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cursorMonth) return;
    loadMonth(cursorMonth.y, cursorMonth.m).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorMonth?.y, cursorMonth?.m]);

  const todayKey = data?.todayKey ?? null;

  const selected = useMemo(() => {
    if (!data || !openKey) return null;
    if (tab === "daily") {
      const count = Math.max(0, dailyLogCounts[openKey] ?? 0);
      const dayIndex = Number(openKey.slice(8, 10));
      return { mode: "daily" as const, dayIndex, dateKey: openKey, count, completed: count >= 1 };
    }
    const d = data.challenge11x11?.window.find((x) => x.dateKey === openKey) ?? null;
    return d ? { mode: "challenge" as const, ...d } : null;
  }, [data, openKey, tab, dailyLogCounts]);

  const isToday = Boolean(selected && todayKey && selected.dateKey === todayKey);

  const dailyCalendar = useMemo(() => {
    if (!data || !cursorMonth) return null;

    const y = cursorMonth.y;
    const m = cursorMonth.m;
    const monthStr = String(m).padStart(2, "0");
    const firstKey = `${y}-${monthStr}-01`;
    const firstDowUTC = parseDateKeyToUTC(firstKey).getUTCDay(); // 0..6

    // Monday-start calendar.
    const weekStart = 1; // Mon
    const leading = (firstDowUTC - weekStart + 7) % 7;
    const dim = daysInMonthUTC(y, m);

    const cells: Array<
      | { kind: "empty"; key: string }
      | { kind: "day"; dateKey: string; dayNum: number; count: number; done: boolean }
    > = [];

    for (let i = 0; i < leading; i++) cells.push({ kind: "empty", key: `e_${y}_${m}_${i}` });
    for (let day = 1; day <= dim; day++) {
      const dd = String(day).padStart(2, "0");
      const dateKey = `${y}-${monthStr}-${dd}`;
      const count = Math.max(0, dailyLogCounts[dateKey] ?? 0);
      cells.push({ kind: "day", dateKey, dayNum: day, count, done: count >= 1 });
    }
    while (cells.length % 7 !== 0) cells.push({ kind: "empty", key: `t_${y}_${m}_${cells.length}` });

    const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
      new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
    );

    const canPrev = minMonth ? cmpMonth({ y, m }, minMonth) > 0 : true;

    return { y, m, monthLabel, canPrev, cells };
  }, [data, cursorMonth, dailyLogCounts, minMonth]);

  const onInc = async () => {
    await incrementToday();
    await refresh();
    setToast("+1 Added");
  };
  const onUndo = async () => {
    await undoToday();
    await refresh();
    setToast("Last entry removed");
  };

  return (
    <main>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-[color:var(--muted)]">Calendar</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">History</h1>
        </div>
        <div className="flex gap-2">
          <button
            className={[
              "h-11 rounded-2xl px-4 text-sm font-semibold border",
              tab === "daily" ? "bg-white/80 border-[color:var(--line)]" : "bg-transparent border-transparent text-[color:var(--muted)]"
            ].join(" ")}
            onClick={() => {
              setTab("daily");
              setOpenKey(null);
            }}
          >
            Daily
          </button>
          <button
            className={[
              "h-11 rounded-2xl px-4 text-sm font-semibold border",
              tab === "challenge11x11"
                ? "bg-white/80 border-[color:var(--line)]"
                : "bg-transparent border-transparent text-[color:var(--muted)]"
            ].join(" ")}
            onClick={() => {
              setTab("challenge11x11");
              setOpenKey(null);
            }}
          >
            11×11
          </button>
        </div>
      </div>

      <div className="mt-5">
        <Card>
          {tab === "daily" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{dailyCalendar?.monthLabel ?? "—"}</div>
                <div className="flex gap-2">
                  <button
                    className={[
                      "h-10 rounded-2xl px-3 text-sm font-semibold border",
                      dailyCalendar?.canPrev
                        ? "bg-white/75 border-[color:var(--line)]"
                        : "bg-transparent border-transparent text-[color:var(--muted)] opacity-50"
                    ].join(" ")}
                    onClick={() => {
                      if (!dailyCalendar?.canPrev || !cursorMonth) return;
                      const prev = cursorMonth.m === 1 ? { y: cursorMonth.y - 1, m: 12 } : { y: cursorMonth.y, m: cursorMonth.m - 1 };
                      if (minMonth && cmpMonth(prev, minMonth) < 0) return;
                      setCursorMonth(prev);
                      setOpenKey(null);
                    }}
                    disabled={!dailyCalendar?.canPrev}
                  >
                    Prev
                  </button>
                  <button
                    className="h-10 rounded-2xl px-3 text-sm font-semibold border bg-white/75 border-[color:var(--line)]"
                    onClick={() => {
                      if (!cursorMonth) return;
                      const next = cursorMonth.m === 12 ? { y: cursorMonth.y + 1, m: 1 } : { y: cursorMonth.y, m: cursorMonth.m + 1 };
                      setCursorMonth(next);
                      setOpenKey(null);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] font-semibold text-[color:var(--muted)]">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {(dailyCalendar?.cells ?? []).map((c) =>
                  c.kind === "empty" ? (
                    <div key={c.key} className="h-10" />
                  ) : (
                    <button
                      key={c.dateKey}
                      onClick={() => setOpenKey(c.dateKey)}
                      className={[
                        "h-10 w-full rounded-xl border flex items-center justify-center text-sm font-semibold",
                        c.done ? "bg-[color:var(--accent-2)] border-transparent text-white" : "bg-white/65 border-[color:var(--line)] text-[color:var(--text)]",
                        c.dateKey === todayKey ? "ring-2 ring-[color:var(--accent)] ring-offset-2 ring-offset-[color:var(--bg)]" : ""
                      ].join(" ")}
                      aria-label={c.done ? "Done" : "Not done"}
                    >
                      {c.dayNum}
                    </button>
                  )
                )}
              </div>
            </>
          ) : data?.challenge11x11 ? (
            <div className="grid grid-cols-3 gap-3">
              {data.challenge11x11.window.map((d) => (
                <DayTile
                  key={d.dateKey}
                  dayIndex={d.dayIndex}
                  label={`Day ${d.dayIndex}`}
                  count={d.counted}
                  target={data.challenge11x11?.targetPerDay ?? 11}
                  onClick={() => setOpenKey(d.dateKey)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-[color:var(--muted)]">No active 11×11 challenge yet.</div>
          )}
        </Card>
      </div>

      <BottomSheet
        open={Boolean(openKey)}
        onClose={() => setOpenKey(null)}
        title={
          selected
            ? tab === "challenge11x11"
              ? `Day ${selected.dayIndex}`
              : selected.dateKey
            : ""
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[color:var(--line)] bg-white/60 px-4 py-3">
              <div className="text-xs text-[color:var(--muted)]">Count</div>
              <div className="mt-1 text-lg font-semibold">
                {selected.mode === "challenge" ? (
                  <>
                    {selected.counted}/11{" "}
                    <span className="text-xs text-[color:var(--muted)]">
                      (raw: {selected.rawCount})
                    </span>
                  </>
                ) : (
                  <>{selected.count}</>
                )}
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                {selected.mode === "challenge"
                  ? ((selected.completed ? "Completed" : "Incomplete") + (isToday ? " (today)" : ""))
                  : ((selected.count >= 1 ? "Done" : "Not done") + (isToday ? " (today)" : ""))}
              </div>
            </div>
            {isToday ? (
              <div className="flex flex-col gap-3">
                <PrimaryButton onClick={onInc} disabled={false}>
                  +1 Recitation
                </PrimaryButton>
                <SecondaryButton
                  onClick={onUndo}
                  disabled={selected.mode === "challenge" ? selected.rawCount === 0 : selected.count === 0}
                >
                  Undo
                </SecondaryButton>
              </div>
            ) : (
              <div className="text-sm text-[color:var(--muted)]">Past days are view-only in MVP.</div>
            )}
          </div>
        ) : null}
      </BottomSheet>

      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}
