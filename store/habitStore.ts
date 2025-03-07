import { create } from 'zustand';
import { Habit } from '../types/habit';
import { saveHabits, loadHabits } from '../utils/storage';

interface HabitState {
  habits: Habit[];
  selectedDate: string;
  isLoading: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completionHistory'>) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, value?: number, forcedState?: boolean) => Promise<void>;
  setSelectedDate: (date: string) => void;
  loadHabitsFromStorage: () => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: true,
  
  addHabit: async (habitData) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completionHistory: {},
    };
    
    set((state) => {
      const updatedHabits = [...state.habits, newHabit];
      saveHabits(updatedHabits);
      return { habits: updatedHabits };
    });
  },
  
  updateHabit: async (id, habitData) => {
    set((state) => {
      const updatedHabits = state.habits.map(habit => 
        habit.id === id ? { ...habit, ...habitData } : habit
      );
      saveHabits(updatedHabits);
      return { habits: updatedHabits };
    });
  },
  
  deleteHabit: async (id) => {
    set((state) => {
      const updatedHabits = state.habits.filter(habit => habit.id !== id);
      saveHabits(updatedHabits);
      return { habits: updatedHabits };
    });
  },
  
  // Enhanced to support toggling and forced completion states
  completeHabit: async (id, value, forcedState) => {
    const { selectedDate } = get();
    
    set((state) => {
      const updatedHabits = state.habits.map(habit => {
        if (habit.id === id) {
          const currentCompletion = habit.completionHistory[selectedDate] || { completed: false };
          let newCompleted = currentCompletion.completed;
          
          // Handle the new forcedState parameter 
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
            // This will be handled by the value parameter
            newCompleted = (value !== undefined && value >= (habit.completionGoal || 0));
          }
          
          // For repetitions type, use the provided value
          let newValue = value;
          
          // For repetitions, always use the value passed in
          if (habit.completionType === 'repetitions') {
            newValue = value;
          }
          // For timed habits without an explicit value, keep using the current value
          else if (habit.completionType === 'timed' && newValue === undefined) {
            newValue = currentCompletion.value;
          }
          
          return {
            ...habit,
            completionHistory: {
              ...habit.completionHistory,
              [selectedDate]: {
                completed: newCompleted,
                value: newValue,
              },
            },
          };
        }
        return habit;
      });
      
      saveHabits(updatedHabits);
      return { habits: updatedHabits };
    });
  },
  
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },
  
  loadHabitsFromStorage: async () => {
    set({ isLoading: true });
    const habits = await loadHabits();
    set({ habits, isLoading: false });
  },
  
  getHabitById: (id) => {
    return get().habits.find(habit => habit.id === id);
  },
}));