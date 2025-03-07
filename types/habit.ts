export type RepetitionType = 'daily' | 'weekly' | 'custom';
export type CompletionType = 'simple' | 'repetitions' | 'timed';

export interface Habit {
  id: string;
  title: string;
  icon: string; // emoji or icon name
  repetitionType: RepetitionType;
  repetitionValue: any; // this will vary based on the repetition type
  completionType: CompletionType;
  completionGoal?: number; // for repetitions or timed habits (in seconds for timed)
  completionHistory: {
    [date: string]: {
      completed: boolean;
      value?: number; // for repetitions or timed habits
    };
  };
  createdAt: string;
  color?: string;
}