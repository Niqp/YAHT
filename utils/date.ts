import { Habit } from '../types/habit';

// Cached day names to avoid repeated calculations
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Fast date formatting (YYYY-MM-DD) without using toISOString
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  // Months are 0-indexed in JS Date
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Efficient date addition without creating multiple date objects
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Use cached day names rather than locale formatting each time
export const getDayName = (date: Date): string => {
  return DAY_NAMES[date.getDay()];
};

// Use cached month names rather than locale formatting each time
export const getMonthName = (date: Date): string => {
  return MONTH_NAMES[date.getMonth()];
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Cache results for improved performance
const completionCache = new Map<string, boolean>();

export const shouldCompleteHabitOnDate = (
  habit: Habit,
  date: string
): boolean => {
  // Create a cache key using habit ID and date
  const cacheKey = `${habit.id}:${date}`;
  
  // Check if result is already cached
  if (completionCache.has(cacheKey)) {
    return completionCache.get(cacheKey)!;
  }
  
  const habitDate = new Date(date);
  const dayOfWeek = habitDate.getDay(); // 0 = Sunday, 6 = Saturday
  let result = false;

  switch (habit.repetitionType) {
    case 'daily':
      result = true;
      break;
    case 'weekly':
      // Check if the current day is in the selected days
      result = (habit.repetitionValue as number[]).includes(dayOfWeek);
      break;
    case 'custom':
      // For custom "Every X days" pattern
      if (typeof habit.repetitionValue === 'number') {
        const createdAt = new Date(habit.createdAt);
        const daysDiff = Math.floor(
          (habitDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        result = daysDiff % habit.repetitionValue === 0;
      }
      // For "X times per Y" pattern
      else if (
        habit.repetitionValue &&
        typeof habit.repetitionValue.times === 'number' &&
        typeof habit.repetitionValue.period === 'string'
      ) {
        // A simple implementation would be to allow it on all days for the period
        result = true;
      }
      break;
    default:
      result = false;
  }
  
  // Cache the result
  completionCache.set(cacheKey, result);
  
  return result;
};

// Function to clear cache when needed (e.g., when habit definitions change)
export const clearCompletionCache = (): void => {
  completionCache.clear();
};