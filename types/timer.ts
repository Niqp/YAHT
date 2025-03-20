import { Habit, UUIDv4 } from "./habit"; // Importing Habit type from habit module
export type TimerDate = string; // Type alias for timer date (ISO string format)

// Timer interface
export interface Timer {
  id: UUIDv4;
  lastResumedAt: string | null; // Timestamp when timer was last resumed (ISO string format)
}

export type TimerMap = Record<Habit["id"], Record<TimerDate, Timer>>;

export type TimerElapsedTimeMap = Record<Timer["id"], number>;
