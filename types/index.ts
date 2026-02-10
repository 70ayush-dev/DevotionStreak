export type Challenge = {
  id: string;
  timeZone: string;
  createdAt: number;
};

export type DailyState = {
  enabled: boolean;
};

export type Challenge11x11State = {
  active: boolean;
  startDateKey: string; // YYYY-MM-DD (civil date in timeZone)
  days: number; // 11
  targetPerDay: number; // 11
};

export type AppState = {
  id: string;
  timeZone: string;
  daily: DailyState;
  challenge11x11: Challenge11x11State | null;
  createdAt: number;
};

export type DailyLog = {
  dateKey: string; // YYYY-MM-DD
  count: number; // 0..targetPerDay
  updatedAt: number;
};

export type Preferences = {
  reminderTime?: string; // HH:mm
  reduceMotion?: boolean;
};
