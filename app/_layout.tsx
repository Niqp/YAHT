import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useHabitStore } from '../store/habitStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { loadHabitsFromStorage } = useHabitStore();

  // Load habits from storage when the app starts
  useEffect(() => {
    loadHabitsFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" redirect={true} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ 
            presentation: 'modal',
            headerShown: false
          }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}