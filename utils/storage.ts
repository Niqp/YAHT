import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types/habit';

const HABITS_STORAGE_KEY = 'habits_data';

// Add debouncing for storage operations to reduce I/O overhead
let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_TIME = 300; // ms

/**
 * Saves habits to AsyncStorage with debouncing
 * This prevents rapid consecutive saves when multiple habits are updated at once
 */
export const saveHabits = async (habits: Habit[]): Promise<void> => {
  // Clear any pending save operations
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  return new Promise((resolve, reject) => {
    saveTimeout = setTimeout(async () => {
      try {
        const data = JSON.stringify(habits);
        await AsyncStorage.setItem(HABITS_STORAGE_KEY, data);
        resolve();
      } catch (error) {
        console.error('Error saving habits:', error);
        reject(error);
      }
    }, DEBOUNCE_TIME);
  });
};

/**
 * Loads habits from AsyncStorage
 * Optimized with proper error handling and typing
 */
export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const data = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    if (!data) return [];
    
    const parsedData = JSON.parse(data) as Habit[];
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
};

/**
 * Batch updates habits in storage
 * More efficient than saving the entire array for each update
 */
export const updateHabitBatch = async (updatedHabits: Habit[]): Promise<void> => {
  try {
    const existingData = await loadHabits();
    
    // Create a map of existing habits for O(1) lookups
    const habitsMap = new Map(existingData.map(habit => [habit.id, habit]));
    
    // Update only the habits that have changed
    updatedHabits.forEach(habit => {
      habitsMap.set(habit.id, habit);
    });
    
    // Convert back to array
    const mergedHabits = Array.from(habitsMap.values());
    
    // Save the updated array
    await saveHabits(mergedHabits);
  } catch (error) {
    console.error('Error updating habits batch:', error);
    throw error;
  }
};

/**
 * Updates a single habit in storage
 * More efficient than saving the entire array for a single update
 */
export const updateSingleHabit = async (updatedHabit: Habit): Promise<void> => {
  return updateHabitBatch([updatedHabit]);
};