# UI Flow

## Entry
1. Landing (if not started):
   - Title + short description
   - CTA: "Start 11×11 Challenge"
   - Small: "Already started? Continue"

2. Start Challenge Modal
   - Start date = today (default)
   - Timezone auto
   - Button: "Start"

## Main Tabs (MVP)
A) Home (Today)
B) History (11-day calendar)
C) Stats (streaks + badges)
D) Settings (reminders, reset)

### Home (Today)
- Top: Day X/11 + small streak
- Middle: Progress ring 0–11
- Bottom: +1 button + Undo

### History
- 11-day grid
- Tap day -> bottom sheet:
  - count
  - completed?
  - if today: controls available
  - if past: view-only (MVP)

### Stats
- Current streak
- Completed days
- Total recitations
- Badges grid

### Settings
- Reminder time
- Notification permission prompt
- Data export (Phase 2)
- Reset challenge (with confirm)
