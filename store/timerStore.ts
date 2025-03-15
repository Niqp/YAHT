import { create } from 'zustand';
import { storage } from '../utils/storage';
import { useEffect } from 'react';

// Timer storage key
const TIMERS_STORAGE_KEY = 'timers_state';

// Single timer interface
interface Timer {
  startTime: number;
  currentTime: number;
  goalTime: number;
  isActive: boolean;
}

// Timers state interface
interface TimersState {
  timers: Record<string, Timer>; // Map of habitId to timer
  
  // Actions
  startTimer: (habitId: string, goalTimeMs?: number) => void;
  pauseTimer: (habitId: string) => void;
  resetTimer: (habitId: string) => void;
  updateTimer: (habitId: string) => void;
  setGoalTime: (habitId: string, goalTimeMs: number) => void;
  removeTimer: (habitId: string) => void;
  
  // Utilities
  getElapsedTime: (habitId: string) => number;
  getRemainingTime: (habitId: string) => number;
  isGoalReached: (habitId: string) => boolean;
  getActiveTimers: () => string[];
  hasTimer: (habitId: string) => boolean;
}

// Create Zustand store with persistence
export const useTimerStore = create<TimersState>((set, get) => {
  // Try to load initial state from storage
  const savedTimers = loadTimersFromStorage();
  
  return {
    // Initial state with fallback to empty timer collection
    timers: savedTimers ?? {},
    
    // Start a timer for a specific habit
    startTimer: (habitId: string, goalTimeMs?: number) => set(state => {
      const now = Date.now();
      const existingTimer = state.timers[habitId];
      
      const newTimers = {
        ...state.timers,
        [habitId]: {
          startTime: existingTimer?.startTime || now,
          currentTime: now,
          goalTime: goalTimeMs !== undefined ? goalTimeMs : (existingTimer?.goalTime || 25 * 60 * 1000),
          isActive: true
        }
      };
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Pause a specific timer
    pauseTimer: (habitId: string) => set(state => {
      if (!state.timers[habitId]) return state;
      
      const newTimers = {
        ...state.timers,
        [habitId]: {
          ...state.timers[habitId],
          isActive: false,
          currentTime: Date.now()
        }
      };
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Reset a specific timer
    resetTimer: (habitId: string) => set(state => {
      if (!state.timers[habitId]) return state;
      
      const { goalTime } = state.timers[habitId];
      const now = Date.now();
      
      const newTimers = {
        ...state.timers,
        [habitId]: {
          startTime: now,
          currentTime: now,
          goalTime,
          isActive: false
        }
      };
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Remove a timer completely
    removeTimer: (habitId: string) => set(state => {
      if (!state.timers[habitId]) return state;
      
      const newTimers = { ...state.timers };
      delete newTimers[habitId];
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Update current time for an active timer
    updateTimer: (habitId: string) => set(state => {
      const timer = state.timers[habitId];
      if (!timer || !timer.isActive) return state;
      
      const newTimers = {
        ...state.timers,
        [habitId]: {
          ...timer,
          currentTime: Date.now()
        }
      };
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Set a new goal time for a specific timer
    setGoalTime: (habitId: string, goalTimeMs: number) => set(state => {
      if (!state.timers[habitId]) return state;
      
      const newTimers = {
        ...state.timers,
        [habitId]: {
          ...state.timers[habitId],
          goalTime: goalTimeMs
        }
      };
      
      saveTimersToStorage(newTimers);
      return { timers: newTimers };
    }),
    
    // Get elapsed time for a specific timer
    getElapsedTime: (habitId: string) => {
      const timer = get().timers[habitId];
      if (!timer) return 0;
      return timer.currentTime - timer.startTime;
    },
    
    // Get remaining time for a specific timer
    getRemainingTime: (habitId: string) => {
      const timer = get().timers[habitId];
      if (!timer) return 0;
      const elapsed = timer.currentTime - timer.startTime;
      return Math.max(0, timer.goalTime - elapsed);
    },
    
    // Check if goal is reached for a specific timer
    isGoalReached: (habitId: string) => {
      const timer = get().timers[habitId];
      if (!timer) return false;
      return (timer.currentTime - timer.startTime) >= timer.goalTime;
    },
    
    // Get list of active timer habit IDs
    getActiveTimers: () => {
      const { timers } = get();
      return Object.keys(timers).filter(habitId => timers[habitId].isActive);
    },
    
    // Check if a timer exists for a habit
    hasTimer: (habitId: string) => {
      return !!get().timers[habitId];
    }
  };
});

// Hook to automatically update all active timers
export const useTimersTick = (intervalMs = 1000) => {
  const { getActiveTimers, updateTimer } = useTimerStore();
  
  useEffect(() => {
    const activeTimers = getActiveTimers();
    if (activeTimers.length === 0) return;
    
    const interval = setInterval(() => {
      const currentActiveTimers = getActiveTimers();
      currentActiveTimers.forEach(habitId => {
        updateTimer(habitId);
      });
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [getActiveTimers, updateTimer, intervalMs]);
};

// Helper functions for loading and saving timer states
function saveTimersToStorage(timers: Record<string, Timer>) {
  try {
    storage.set(TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.error('Error saving timers state:', error);
  }
}

function loadTimersFromStorage(): Record<string, Timer> | null {
  try {
    const data = storage.getString(TIMERS_STORAGE_KEY);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading timers state:', error);
    return null;
  }
}
