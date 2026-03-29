export type UUIDv4 = string; // Type alias for UUIDv4

export enum CompletionType {
  SIMPLE = "simple",
  REPETITIONS = "repetitions",
  TIMED = "timed",
}

// Define the repetition types as an enum
export enum RepetitionType {
  DAILY = "daily",
  WEEKDAYS = "weekdays",
  INTERVAL = "interval",
}

export type CompletionConfig =
  | { type: CompletionType.SIMPLE; goal?: number } // Simple completion (e.g., yes/no)
  | { type: CompletionType.REPETITIONS; goal: number } // Number of repetitions
  | { type: CompletionType.TIMED; goal: number }; // Time in ms

export type RepetitionConfig =
  | { type: RepetitionType.DAILY }
  | { type: RepetitionType.WEEKDAYS; days: number[] } // 0-6 where 0 is Sunday
  | { type: RepetitionType.INTERVAL; days: number }; // Every X days

export interface HabitMap {
  [id: string]: Habit;
}

export type CompletionHistory = {
  isCompleted: boolean;
  value?: number; // Optional value for repetitions or time spent
};

export interface ReminderConfig {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  repeatIfNotCompleted: boolean;
  repeatIntervalMs?: number;
}

export interface Habit {
  id: UUIDv4;
  title: string;
  icon: string;
  repetition: RepetitionConfig;
  completion: CompletionConfig;
  completionHistory: Record<string, CompletionHistory>; // Date-keyed completion history
  createdAt: string;
  color?: string;
  reminder?: ReminderConfig;
}

export interface HabitStats {
  dueDaysSinceCreation: number;
  completedDueDays: number;
  adherenceSinceCreation: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string;
  goalHitRate: number;
  totalRepetitions: number;
  totalTimeSpent: number;
  bestDayValue: number;
}

export interface OverallStats {
  activeHabits: number;
  dueToday: number;
  completedToday: number;
  todayAdherence: number;
  last7DayAdherence: number;
}

export interface ChartDay {
  date: string;
  label: string;
  isDue: boolean;
  isCompleted: boolean;
  value: number;
  goal: number | null;
}

export interface HabitChartData {
  days: ChartDay[];
}
