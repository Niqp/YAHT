import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <SafeAreaView style={styles.container} >
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
            elevation: 5,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            height: 70, // Reduce header height
          },
          headerTitleContainerStyle: {
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => (
              <BarChart2 color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});