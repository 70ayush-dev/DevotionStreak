# 🕉️ DevotionStreak: Hanuman Chalisa 11×11 Challenge

**DevotionStreak** is a Progressive Web App (PWA) designed to help users build a spiritual habit: completing **11 Hanuman Chalisa recitations per day for 11 consecutive days**.

It focuses on simplicity, privacy, and motivation without guilt.

## 🌟 Features

*   **11×11 Challenge**: Track your daily progress of 11 recitations for 11 days.
*   **Progressive Web App (PWA)**: Installable on mobile and desktop, works offline.
*   **Daily Tracking**: Simple tap-to-count interface (0–11).
*   **Streak Tracking**: monitor your consistency and build a streak.
*   **History View**: Review your 11-day journey in a calendar grid.
*   **Privacy-First**: "Guest Mode" stores data locally on your device.
*   **Cloud Sync (Optional)**: Sign in with Google to sync your progress across devices (via Supabase).
*   **Gentle Motivation**: Encouraging UI with confetti celebrations and milestone tracking.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **Local Environment**: [DDEV](https://ddev.com/) (Docker-based)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or OrbStack/Colima)
*   [DDEV](https://ddev.com/get-started/)
*   [Node.js](https://nodejs.org/) (v20+ recommended, ideally via [Volta](https://volta.sh/) or NVM)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/devotion-streak.git
    cd devotion-streak
    ```

2.  **Start the DDEV environment:**
    ```bash
    ddev start
    ```

3.  **Install dependencies:**
    ```bash
    ddev npm install
    # or just `npm install` if running locally
    ```

4.  **Set up Environment Variables:**
    Copy the example env file:
    ```bash
    cp .env.example .env.local
    ```
    Then, fill in your Supabase credentials in `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

5.  **Run the application:**
    ```bash
    ddev launch
    # or visit https://devotionstreak.ddev.site
    ```

### Local Development

You can run the development server inside DDEV:

```bash
ddev exec npm run dev
```

Or run it on your host machine (ensure `.env.local` is set up):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the DDEV URL) to see the app.

## 📂 Folder Structure

```
app/
  layout.tsx             # Root layout
  page.tsx               # Landing / Start screen
  (app)/                 # Authenticated/Main app layout group
    home/page.tsx        # Today's tracking
    history/page.tsx     # 11-day calendar history
    stats/page.tsx       # Streaks & badges
    settings/page.tsx    # Preferences & reset
components/
  ui/                    # Reusable UI components
  ...                    # Feature-specific components (ProgressRing, etc.)
lib/
  supabase.ts            # Supabase client & auth helpers
  storage.ts             # Local-first storage logic
  dates.ts               # Date & Timezone utilities
public/                  # Static assets (icons, manifest)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
