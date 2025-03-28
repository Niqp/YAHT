import React from 'react';
import { StatusBar } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode } = useThemeStore();
  
  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </>
  );
}