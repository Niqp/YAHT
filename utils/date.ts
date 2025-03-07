import { Habit } from '../types/habit';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short' });
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const shouldCompleteHabitOnDate = (
  habit: Habit,
  date: string
): boolean => {
  const habitDate = new Date(date);
  const dayOfWeek = habitDate.getDay(); // 0 = Sunday, 6 = Saturday

  switch (habit.repetitionType) {
    case 'daily':
      return true;
    case 'weekly':
      // Check if the current day is in the selected days
      return (habit.repetitionValue as number[]).includes(dayOfWeek);
    case 'custom':
      // For custom "Every X days" pattern
      if (typeof habit.repetitionValue === 'number') {
        const createdAt = new Date(habit.createdAt);
        const daysDiff = Math.floor(
          (habitDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff % habit.repetitionValue === 0;
      }
      // For "X times per Y" pattern
      else if (
        habit.repetitionValue &&
        typeof habit.repetitionValue.times === 'number' &&
        typeof habit.repetitionValue.period === 'string'
      ) {
        // A simple implementation would be to allow it on all days for the period
        // For a more accurate implementation, we'd need to track how many times
        // it's been completed in the current period
        return true;
      }
      return false;
    default:
      return false;
  }
};