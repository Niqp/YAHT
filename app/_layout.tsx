import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useHabitStore } from '../store/habitStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../components/ThemeProvider';
import { AppThemeWrapper } from '../components/AppThemeWrapper';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const { loadHabitsFromStorage } = useHabitStore();
  const { colors, isDarkMode } = useTheme();

  // Load habits from storage when the app starts
  useEffect(() => {
    loadHabitsFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppThemeWrapper>
        <ThemeProvider>
          <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.cardBackground,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
              },
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen name="index" redirect={true} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
                  </SafeAreaProvider>
        </ThemeProvider>
      </AppThemeWrapper>
    </GestureHandlerRootView>
  );
}