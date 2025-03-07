import React, { useEffect, useRef } from 'react';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface AppThemeWrapperProps {
  children: React.ReactNode;
}

export function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  const systemColorScheme = useColorScheme();
  const { 
    setSystemColorScheme, 
    initializeWithSystemTheme,
    systemColorScheme: storeSystemTheme
  } = useThemeStore();
  
  // Use ref to track if we've initialized
  const initializedRef = useRef(false);

  // Initialize with system theme ONLY ONCE on first render
  useEffect(() => {
    if (!initializedRef.current && systemColorScheme) {
      console.log('AppThemeWrapper: Initial system theme:', systemColorScheme);
      initializeWithSystemTheme(systemColorScheme);
      initializedRef.current = true;
    }
  }, [systemColorScheme, initializeWithSystemTheme]);

  // Listen for system theme changes, but only update if it actually changed
  useEffect(() => {
    if (initializedRef.current && systemColorScheme && systemColorScheme !== storeSystemTheme) {
      console.log('AppThemeWrapper: System theme changed to:', systemColorScheme);
      setSystemColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, setSystemColorScheme, storeSystemTheme]);

  // Listen for app state changes to catch theme changes when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && systemColorScheme && systemColorScheme !== storeSystemTheme) {
        console.log('App became active, updating system theme:', systemColorScheme);
        setSystemColorScheme(systemColorScheme);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [systemColorScheme, setSystemColorScheme, storeSystemTheme]);

  return <>{children}</>;
}