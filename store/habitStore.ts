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
  completeHabit: (id: string, value?: number) => Promise<void>;
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
  
  completeHabit: async (id, value) => {
    const { selectedDate } = get();
    
    set((state) => {
      const updatedHabits = state.habits.map(habit => {
        if (habit.id === id) {
          const currentCompletion = habit.completionHistory[selectedDate] || { completed: false };
          
          // For repetitions type, increment the value
          let newValue = value;
          if (habit.completionType === 'repetitions' && !newValue) {
            newValue = (currentCompletion.value || 0) + 1;
          }
          
          return {
            ...habit,
            completionHistory: {
              ...habit.completionHistory,
              [selectedDate]: {
                completed: true,
                value: newValue !== undefined ? newValue : currentCompletion.value,
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