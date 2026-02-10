# UI/UX Spec (Delightful + Respectful)

## Design Tone
- Calm, devotional, uplifting
- Minimal distractions
- Clean typography, generous spacing
- Avoid "aggressive" gamification language (no "grind", no "rank shame")

## Core UX Rules
- One-thumb friendly on mobile
- The +1 action must always be visible
- Celebrate completion of day and challenge
- Never guilt the user for missing a day

---

## Screens & Interaction Details

## 1) Home (Today)
### Layout
- Header: "Day X of 11" + small streak pill (e.g., "Streak: 3")
- Main card:
  - Circular progress ring (0–11)
  - Big number "6/11"
  - Subtext: "Today’s Recitations"
- Actions:
  - Primary: "+1 Recitation" (big)
  - Secondary: "Undo" (small)
  - Optional micro: "I’m done for today" appears only when 11/11

### Microinteractions
- Tap "+1":
  - Button press animation (scale down 0.98 -> back)
  - Progress ring animates smoothly to next step
  - Haptic feedback on mobile (if supported)
  - Small toast: "+1 Added"

- Tap "Undo":
  - Reverse ring animation
  - Toast: "Last entry removed"

### Completion (when hits 11/11)
- Confetti burst (1.5s)
- Banner: "Day Completed 🙏"
- Day card glow animation (subtle pulse once)
- Disable "+1" OR allow but show "11/11 counted" and ignore beyond 11.

---

## 2) History (11-Day Calendar)
### Layout
- 11 tiles (grid or horizontal)
- Each tile shows:
  - Day number (1..11)
  - Count (0..11)
  - Completed check if 11/11
  - Missed indicator if day passed & not complete

### Interaction
- Tap a tile opens bottom sheet:
  - Title: "Day 4"
  - Count: "8/11"
  - Status chip: "Incomplete" or "Completed"
  - If it's today: show controls (+1, undo)
  - If past days: view-only in MVP

### Animations
- Bottom sheet slides up (spring)
- Tile press effect (scale 0.97)

---

## 3) Stats + Badges
### Metrics cards
- Current streak (0–11)
- Completed days (0–11)
- Total recitations (0–121)
- Completion rate (%)

### Badges
Badges should feel like "blessings" not "trophies".
- "Start" (Day 1 started)
- "Consistency" (Day 3 completed)
- "Halfway" (Day 6 completed)
- "Devotion" (Day 11 completed)
- "Perfect Day" (completed 11/11 without undo – optional)

### Badge Animation
- When a badge is earned:
  - Badge flips in / pops (scale + fade)
  - Small sparkle / glow for 1 second
  - Notification toast: "New badge earned: Halfway"

---

## 4) Completion Certificate
### Trigger
- When Day 11 is completed

### Screen
- "Challenge Completed" header
- Summary:
  - Completed days: 11/11
  - Total: 121 recitations (max)
  - Streak: 11
- CTA:
  - "Share certificate" (Phase 2)
  - "Start another challenge" (Phase 3)

### Animation
- Soft confetti
- Certificate card slides in with fade

---

## 5) Settings
### Reminder UX
- Toggle reminders
- Pick time
- If notifications blocked:
  - show a guide card:
    - "Enable notifications in browser settings"
- Never nag; one reminder per day default.

---

## Visual Style Recommendations
(These are guidelines; exact colors can be decided later.)
- Background: warm off-white / light saffron tint
- Accent: deep saffron / maroon
- Success: soft green
- Typography: readable sans + optional devotional heading font

---

## Accessibility
- Large tap targets (>= 44px)
- High contrast text
- Reduce motion toggle:
  - if enabled, reduce confetti & heavy animations

---

## Copy Guidelines
Use encouraging, peaceful wording:
- "Nice work 🙏"
- "Day complete"
- "Continue tomorrow"
Avoid:
- "You failed"
- "Broken streak shame"
- "Rank drop" fear

---

## Optional Fun Mode (Phase 3)
- Toggle "Fun mode" to enable:
  - stronger confetti
  - more playful badge effects
Default mode stays calm/minimal.
