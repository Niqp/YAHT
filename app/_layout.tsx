import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart2, PlusCircle } from 'lucide-react-native';
import { useHabitStore } from '../store/habitStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function AppLayout() {
  const { loadHabitsFromStorage } = useHabitStore();

  // Load habits from storage when the app starts
  useEffect(() => {
    loadHabitsFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#4A6572',
            tabBarInactiveTintColor: '#B0BEC5',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            },
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Tabs.Screen
            name="(tabs)/today"
            options={{
              title: 'Today',
              tabBarIcon: ({ color, size }) => (
                <Home color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="(tabs)/stats"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color, size }) => (
                <BarChart2 color={color} size={size} />
              ),
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}