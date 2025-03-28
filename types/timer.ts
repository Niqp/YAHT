import { DateStamp, DateTimeStamp } from "./date";
import { Habit, UUIDv4 } from "./habit"; // Importing Habit type from habit module

export type timeMs = number; // Type alias for time in milliseconds

// Timer interface
export interface Timer {
  id: UUIDv4;
  lastResumedAt: DateTimeStamp | null; // Timestamp when timer was last resumed (ISO string format)
}

export type TimerMap = Record<Habit["id"], Record<DateStamp, Timer>>;

export type TimerElapsedTimeMap = Record<Timer["id"], timeMs>;
