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

export interface Habit {
  id: UUIDv4;
  title: string;
  icon: string;
  repetition: RepetitionConfig;
  completion: CompletionConfig;
  completionHistory: Map<string, CompletionHistory>; // Map of dates to completion history
  createdAt: string;
  color?: string;
}
