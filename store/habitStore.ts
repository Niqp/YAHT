import { create } from 'zustand';
import { Habit } from '../types/habit';
import { saveHabits, loadHabits, updateSingleHabit } from '../utils/storage';
import { clearHabitCache } from '../utils/date';

// Type to hold a map of habits for faster lookups
interface HabitsMap {
  [id: string]: Habit;
}

interface HabitState {
  habits: Habit[];
  habitsMap: HabitsMap; // Added for O(1) lookups
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completionHistory'>) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, value?: number, forcedState?: boolean) => Promise<void>;
  setSelectedDate: (date: string) => void;
  loadHabitsFromStorage: () => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
}

// Helper to convert habit array to map
const habitsArrayToMap = (habits: Habit[]): HabitsMap => {
  if (!Array.isArray(habits)) return {};
  
  return habits.reduce((map, habit) => {
    if (habit && habit.id) {
      map[habit.id] = habit;
    }
    return map;
  }, {} as HabitsMap);
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  habitsMap: {}, // Initialize empty map
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: true,
  error: null,
  
  addHabit: async (habitData) => {
    try {
      const newHabit: Habit = {
        ...habitData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completionHistory: {},
      };
      
      set((state) => {
        const updatedHabits = [...state.habits, newHabit];
        const updatedMap = {...state.habitsMap, [newHabit.id]: newHabit};
        
        // Save to storage asynchronously
        saveHabits(updatedHabits).catch(error => {
          console.error('Error saving habits:', error);
          // We don't set state here to avoid triggering a new render cycle
          // Just log the error
        });
        
        return { 
          habits: updatedHabits,
          habitsMap: updatedMap,
          error: null
        };
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      set({ error: 'Failed to add habit' });
    }
  },
  
  updateHabit: async (id, habitData) => {
    try {
      set((state) => {
        // Get the existing habit
        const existingHabit = state.habitsMap[id];
        if (!existingHabit) return state;
        
        // Create updated habit
        const updatedHabit = { ...existingHabit, ...habitData };
        
        // Clear cache for this habit
        clearHabitCache(id);
        
        // Update in-memory data
        const updatedHabits = state.habits.map(h => h.id === id ? updatedHabit : h);
        const updatedMap = {...state.habitsMap, [id]: updatedHabit};
        
        // Save to storage asynchronously
        saveHabits(updatedHabits).catch(error => {
          console.error('Error saving habits:', error);
        });
        
        return { 
          habits: updatedHabits,
          habitsMap: updatedMap,
          error: null
        };
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      set({ error: 'Failed to update habit' });
    }
  },
  
  deleteHabit: async (id) => {
    try {
      set((state) => {
        // Remove from in-memory data
        const updatedHabits = state.habits.filter(h => h.id !== id);
        const updatedMap = {...state.habitsMap};
        delete updatedMap[id];
        
        // Clear cache for this habit
        clearHabitCache(id);
        
        // Save to storage asynchronously
        saveHabits(updatedHabits).catch(error => {
          console.error('Error saving habits after delete:', error);
        });
        
        return { 
          habits: updatedHabits,
          habitsMap: updatedMap,
          error: null
        };
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({ error: 'Failed to delete habit' });
    }
  },
  
  // Optimized to directly update the specific habit instead of mapping all habits
  completeHabit: async (id, value, forcedState) => {
    try {
      const { selectedDate, habitsMap } = get();
      
      // Get existing habit
      const habit = habitsMap[id];
      if (!habit) return;
      
      // Get current completion status
      const currentCompletion = habit.completionHistory[selectedDate] || { completed: false };
      let newCompleted = currentCompletion.completed;
      
      // Determine new completion state
      if (forcedState !== undefined) {
        // If a forced state is provided, use that
        newCompleted = forcedState;
      } else if (habit.completionType === 'simple') {
        // For simple habits, toggle the completion if no forced state
        newCompleted = !currentCompletion.completed;
      } else if (habit.completionType === 'repetitions') {
        // For repetitions, only mark completed if we reach the goal
        newCompleted = (value !== undefined && value >= (habit.completionGoal || 0));
      } else if (habit.completionType === 'timed') {
        // For timed habits, mark as completed if time exceeds goal
        newCompleted = (value !== undefined && value >= (habit.completionGoal || 0));
      }
      
      // Determine new value
      let newValue = value;
      if (habit.completionType === 'repetitions') {
        newValue = value;
      } else if (habit.completionType === 'timed' && newValue === undefined) {
        newValue = currentCompletion.value;
      }
      
      // Create updated habit with new completion history
      const updatedHabit = {
        ...habit,
        completionHistory: {
          ...habit.completionHistory,
          [selectedDate]: {
            completed: newCompleted,
            value: newValue,
          },
        },
      };
      
      // Update in-memory state
      set((state) => {
        const updatedHabits = state.habits.map(h => 
          h.id === id ? updatedHabit : h
        );
        
        const updatedMap = {
          ...state.habitsMap,
          [id]: updatedHabit
        };
        
        // Save just this habit asynchronously for better performance
        updateSingleHabit(updatedHabit).catch(error => {
          console.error('Error updating single habit:', error);
        });
        
        return { 
          habits: updatedHabits,
          habitsMap: updatedMap,
          error: null
        };
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      set({ error: 'Failed to complete habit' });
    }
  },
  
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },
  
  loadHabitsFromStorage: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await loadHabits();
      // Validate habits array to prevent rendering with invalid data
      if (!Array.isArray(habits)) {
        throw new Error('Loaded habits is not an array');
      }
      
      // Remove any invalid habit entries
      const validHabits = habits.filter(habit => 
        habit && typeof habit === 'object' && habit.id && habit.title
      );
      
      const habitsMap = habitsArrayToMap(validHabits);
      set({ habits: validHabits, habitsMap, isLoading: false });
    } catch (error) {
      console.error('Error loading habits:', error);
      // Don't leave the app in a loading state - reset to empty array
      set({ 
        habits: [], 
        habitsMap: {}, 
        isLoading: false,
        error: 'Failed to load habits'
      });
    }
  },
  
  getHabitById: (id) => {
    return get().habitsMap[id]; // O(1) lookup from map
  },
}));