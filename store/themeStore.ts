import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekStartDay = 'sunday' | 'monday';

interface ThemeState {
  mode: ThemeMode;
  systemColorScheme: ColorSchemeName;
  isDarkMode: boolean;
  weekStartDay: WeekStartDay;
  setMode: (mode: ThemeMode) => void;
  setSystemColorScheme: (colorScheme: ColorSchemeName) => void;
  initializeWithSystemTheme: (systemTheme: ColorSchemeName) => void;
  setWeekStartDay: (day: WeekStartDay) => void;
}

// Create a stable version of the functions outside the store
const createActions = (set: any, get: any) => {
  const setMode = (mode: ThemeMode) => {
    const { systemColorScheme } = get();
    const isDark = 
      mode === 'dark' || 
      (mode === 'system' && systemColorScheme === 'dark');
    
    console.log(`Setting mode to ${mode}, isDarkMode: ${isDark}, system: ${systemColorScheme}`);
    set({ 
      mode,
      isDarkMode: isDark
    });
  };
  
  const setSystemColorScheme = (colorScheme: ColorSchemeName) => {
    const { mode, systemColorScheme: currentScheme } = get();
    // Skip if it's the same value to avoid unnecessary renders
    if (colorScheme === currentScheme) return;
    
    // Only update isDarkMode if we're in system mode
    const isDark = mode === 'system' 
      ? colorScheme === 'dark' 
      : mode === 'dark';
    
    console.log(`System color scheme changed to ${colorScheme}, isDarkMode: ${isDark}, mode: ${mode}`);
    set({ 
      systemColorScheme: colorScheme,
      isDarkMode: isDark
    });
  };

  const initializeWithSystemTheme = (systemTheme: ColorSchemeName) => {
    const { mode } = get();
    const isDark = mode === 'system' 
      ? systemTheme === 'dark' 
      : mode === 'dark';
    
    console.log(`Initializing with system theme: ${systemTheme}, mode: ${mode}, isDarkMode: ${isDark}`);
    set({
      systemColorScheme: systemTheme,
      isDarkMode: isDark
    });
  };

  const setWeekStartDay = (day: WeekStartDay) => {
    console.log(`Setting week start day to ${day}`);
    set({ weekStartDay: day });
  };

  return {
    setMode,
    setSystemColorScheme,
    initializeWithSystemTheme,
    setWeekStartDay
  };
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      const actions = createActions(set, get);
      
      return {
        mode: 'system', // Default to system
        systemColorScheme: null, // Start with null to ensure we pick up the real value
        isDarkMode: false, // Initial value will be updated
        weekStartDay: 'monday', // Default to Monday as first day of week
        ...actions
      };
    },
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        mode: state.mode,
        weekStartDay: state.weekStartDay 
      }),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, we'll initialize
        console.log('Theme storage rehydrated with mode:', state?.mode);
      }
    }
  )
);