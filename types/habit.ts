export enum CompletionType {
  SIMPLE = 'simple',
  REPETITIONS = 'repetitions',
  TIMED = 'timed'
}

// Define the repetition types as an enum
export enum RepetitionType {
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  INTERVAL = 'interval'
}

export type CompletionConfig =
  | { type: CompletionType.SIMPLE } // Simple completion (e.g., yes/no)
  | { type: CompletionType.REPETITIONS, goal: number } // Number of repetitions
  | { type: CompletionType.TIMED, goal: number }; // Time in ms

export type RepetitionConfig = 
  | { type: RepetitionType.DAILY }
  | { type: RepetitionType.WEEKDAYS, days: number[] } // 0-6 where 0 is Sunday
  | { type: RepetitionType.INTERVAL, days: number, nextDueDate: string };

export interface Habit {
  id: string;
  title: string;
  icon: string;
  repetition: RepetitionConfig;
  completion: CompletionConfig;
  completionHistory: {
    [date: string]: {
      completed: boolean;
      value?: number;
    };
  };
  createdAt: string;
  color?: string;
}