# Next.js Folder Structure (App Router)

app/
  layout.tsx
  page.tsx                  # Landing / Start
  (app)/
    home/page.tsx           # Today tracking
    history/page.tsx        # 11-day calendar
    stats/page.tsx          # streaks + badges
    settings/page.tsx       # reminders + reset
components/
  ProgressRing.tsx
  DayTile.tsx
  BadgeGrid.tsx
  BottomSheet.tsx
  ConfettiBurst.tsx
  StreakPill.tsx
lib/
  storage.ts                # local-first storage wrapper
  challenge.ts              # compute day index, streak logic
  dates.ts                  # timezone-safe date helpers
types/
  index.ts
public/
  manifest.webmanifest
  icons/
styles/
  globals.css
