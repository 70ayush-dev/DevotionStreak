# Features

## Phase 1 (MVP) — Required

### A. Onboarding & Challenge Start
- Start challenge in < 10 seconds
- Guest mode supported (no login required)
- Select start: "Start Today" (default)
- Timezone auto-detected
- Inform user: "Goal: 11/day for 11 days"

### B. Home / Today Tracking
- Big central button: "+1 Recitation"
- Secondary: "Undo" (removes last)
- Today status:
  - Count: 0/11
  - Progress ring
  - "Day X of 11"
- Completion state at 11/11:
  - Confetti animation
  - "Day Completed" banner
  - Lock further increments (or allow but do not count beyond 11)

### C. Streaks & Stats
- Current streak count (days completed consecutively)
- Longest streak during the challenge (within 11 days)
- Completion rate: completedDays / 11
- Total recitations: sum daily counts (max 121)

### D. History / Calendar View
- 11-day calendar strip/grid
- Each day shows:
  - count (0–11)
  - completed indicator
  - tap day -> detail sheet
- Day details:
  - count
  - timestamps optional (Phase 2)
  - edit controls (MVP: only undo for today; no backdating)

### E. Reminders (MVP-lite)
- Local reminders (PWA notification if enabled)
- User can set preferred time
- Gentle copy (no guilt): "Time for your Chalisa practice 🙏"

### F. Completion Certificate (MVP)
- Day 11 completion:
  - Certificate screen
  - Share/download image (Phase 2; MVP can be simple screen)

## Phase 2 — Nice to have (Sync + Social)

### A. Authentication + Sync
- Google login
- Option to keep anonymous display name
- Cloud sync across devices

### B. Groups
- Create group (invite code)
- Join group via code
- Group leaderboard:
  - ranking by completed days
  - tie-breaker by streak

### C. Global Leaderboard (Opt-in)
- Only for users who opt-in
- Ranking: completed days (0–11), then streak
- Anti-cheat:
  - max 11/day counted
  - no editing past days (or mark edits as "backfilled")

## Phase 3 — Engagement / Delight

- Audio player mode (listen + mark)
- Timer mode (per recitation timer)
- Reflections / notes
- Shareable progress cards (daily badge card)
- Multiple challenges (7/11/21/40 days)
